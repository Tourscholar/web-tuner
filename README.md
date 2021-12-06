<h3 align="center">web tuner</h3>

[在线预览](https://tourscholar.github.io/web-tuner/)

一个基于现有的c音频库[aubio](https://github.com/aubio/aubio/tree/d3325ba1d97167dc17307cd116000c46c7aba1ec)
使用[emscipten](https://github.com/emscripten-core/emscripten)编译成```JavaScript```文件, 基于Web Audio API实现的调音器

#### 通过Web Audio获取实时录音数据
Web Audio API标准允许浏览器获取实时录音数据, 所有最新主流浏览器基本都支持
 - [Web Audio API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API)
 - [AudioRecorder Demo](https://higuma.github.io/web-audio-recorder-js/)
将下面这段代码黏贴到浏览器的```Console```界面, 来测试浏览器是否支持获取录音数据
```javascript
AudioContext = window.AudioContext || window.webkitAudioContext

const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
const scriptProcessor = audioContext.createScriptProcessor(8192, 1, 1)

navigator.mediaDevices.getUserMedia({audio: true}).then(streamSource => {
  // connect 的顺序一定要 streamSource => analyser => scriptProcessor
  audioContext.createMediaStreamSource(streamSource).connect(analyser)
  analyser.connect(scriptProcessor)
  scriptProcessor.connect(audioContext.destination)

  scriptProcessor.addEventListener('audioprocess', event => {
    const data = event.inputBuffer.getChannelData(0)
    // 为了避免卡住浏览器，只打印一些简单的数据
    console.log(`${data.length}, ${data[0]}`)
  })
})
```

#### 音高检测
调用编译好的```aubio.js```文件
```javascript
AudioContext = window.AudioContext || window.webkitAudioContext

const bufferSize = 8192
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)

const pitchDetector = new (Module().AubioPitch)(
    'default', bufferSize, 1, audioContext.sampleRate)

navigator.mediaDevices.getUserMedia({audio: true}).then(streamSource => {
  // connect 的顺序一定要 streamSource => analyser => scriptProcessor
  audioContext.createMediaStreamSource(streamSource).connect(analyser)
  analyser.connect(scriptProcessor)
  scriptProcessor.connect(audioContext.destination)

  scriptProcessor.addEventListener('audioprocess', event => {
    const frequency = self.pitchDetector.do(event.inputBuffer.getChannelData(0))
    if (frequency) {
      console.log(frequency)
    }
  })
})
```

#### 调音器界面的实现
首先将音高频率转成音名及对应的八度. 比如82.41Hz对应E2. [音符](https://zh.wikipedia.org/wiki/%E9%9F%B3%E7%AC%A6)查看更详细的说明

使用标准的MIDI转换公式, 基于十二平均律, 设定标准音高为440Hz:



​                                         $ p=6q+12\times \log _{2}\left( \dfrac{f}{440}\right) $

为了描述音的偏移距离还需要知道音分:




​                                         $ a=b\times 2^{\dfrac{n}{1200}} $

```javascript
const MIDDLE_A = 440
const SEMITONE = 69

/**
 * get musical note from frequency
 *
 * @param {float} frequency
 * @returns {int}
 */
function getNote(frequency) {
  var note = 12 * (Math.log(frequency / MIDDLE_A) / Math.log(2))
  return Math.round(note) + SEMITONE
}

/**
 * get the musical note's standard frequency
 *
 * @param note
 * @returns {number}
 */
function getStandardFrequency(note) {
  return MIDDLE_A * Math.pow(2, (note - SEMINETON) / 12)
}

/**
 * get cents difference between given frequency and musical note's standard frequency
 *
 * @param {float} frequency
 * @param {int} note
 * @returns {int}
 */
function getCents(frequency, note) {
  return Math.floor(1200 * Math.log(frequency / getStandardFrequency(note)) / Math.log(2))
}
```

#### 表盘的实现
通过CSS的 ```transform: rotate```, 将音分差值转换为旋转角度
