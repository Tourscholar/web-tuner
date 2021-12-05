class Tuner {
  constructor() {
    this.middleA = 440;
    this.semitone = 69;
    this.bufferSize = 4096;
    this.noteStrings = [
      "C",
      "C♯",
      "D",
      "D♯",
      "E",
      "F",
      "F♯",
      "G",
      "G♯",
      "A",
      "A♯",
      "B",
    ];

    this.initGetUserMedia();
  }
  initGetUserMedia() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!window.AudioContext) {
      return alert("AudioContext not supported");
    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    // 较旧的浏览器可能根本不实现mediaDevices，因此我们首先设置一个空对象
    // 이전 브라우저는 mediaDevices를 전혀 구현하지 않을 수 있으므로 먼저 빈 개체를 설정하십시오.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    // 一些浏览器部分实现了mediaDevices。我们不能只分配一个对象
    // 使用getUserMedia，因为它将覆盖现有属性。
    // 在这里，我们将仅添加getUserMedia属性（如果缺少）。
    // 일부 브라우저는 부분적으로 mediaDevices를 구현한다. 우리는 단지 사물을 지정할 수 없다.
    // 기존 속성을 덮어쓸 수 있는 getUserMedia와 함께 사용.
    // 여기에 getUserMedia 속성이 누락된 경우 추가하십시오.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        // First get ahold of the legacy getUserMedia, if present
        // 首先获取旧版getUserMedia（如果存在）
        // 먼저 레거시 getUserMedia(있는 경우)에 대한 정보를 얻으십시오.
        const getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        // 一些浏览器只是不实现它-返回被拒绝的Promise并带有错误以保持一致的界面
        // 일부 브라우저에서 이를 구현하지 않음 - 일관된 인터페이스를 유지하기 위해 오류와 함께 거부된 약속 반환
        if (!getUserMedia) {
          alert("getUserMedia is not implemented in this browser");
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        // 否则，将对Promise的调用包装到旧的navigator.getUserMedia中。
        // 그렇지 않으면 기존 네비게이터로 통화를 마무리하십시오.약속과 함께 UserMedia 가져오기
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }
  startRecord() {
    const self = this;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        self.audioContext
          .createMediaStreamSource(stream)
          .connect(self.analyser);
        self.analyser.connect(self.scriptProcessor);
        self.scriptProcessor.connect(self.audioContext.destination);
        self.scriptProcessor.addEventListener("audioprocess", function (event) {
          const frequency = self.pitchDetector.do(
            event.inputBuffer.getChannelData(0)
          );
          if (frequency && self.onNoteDetected) {
            const note = self.getNote(frequency);
            self.onNoteDetected({
              name: self.noteStrings[note % 12],
              value: note,
              cents: self.getCents(frequency, note),
              octave: parseInt(note / 12) - 1,
              frequency: frequency,
            });
          }
        });
      })
      .catch(function (error) {
        alert(error.name + ": " + error.message);
      });
  }
  init() {
    this.audioContext = new window.AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.scriptProcessor = this.audioContext.createScriptProcessor(
      this.bufferSize,
      1,
      1
    );

    const self = this;

    Aubio().then(function (aubio) {
      self.pitchDetector = new aubio.Pitch(
        "default",
        self.bufferSize,
        1,
        self.audioContext.sampleRate
      );
      self.startRecord();
    });
  }
  /**
   * // get musical note from frequency
   *
   * // 从频率获取音符
   *
   * // 주파수에서 음악적 음표를 얻다.
   * @param {number} frequency
   * @returns {number}
   */
  getNote(frequency) {
    const note = 12 * (Math.log(frequency / this.middleA) / Math.log(2));
    return Math.round(note) + this.semitone;
  }
  /**
   * // get the musical note's standard frequency
   *
   * // 获得音符的标准频率
   *
   * // 악보의 표준 주파수를 구하다.
   *
   * @param note
   * @returns {number}
   */
  getStandardFrequency(note) {
    return this.middleA * Math.pow(2, (note - this.semitone) / 12);
  }
  /**
   * // get cents difference between given frequency and musical note's standard frequency
   *
   * // 获得给定频率与音符标准频率之间的分差
   *
   * // 주어진 주파수와 악보의 표준 주파수의 차이점을 얻다.
   * @param {number} frequency
   * @param {number} note
   * @returns {number}
   */
  getCents(frequency, note) {
    return Math.floor(
      (1200 * Math.log(frequency / this.getStandardFrequency(note))) /
        Math.log(2)
    );
  }
  /**
   * // play the musical note
   *
   * // 播放音符
   *
   * // 악보를 연주하다
   * @param {number} frequency
   */
  play(frequency) {
    if (!this.oscillator) {
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.connect(this.audioContext.destination);
      this.oscillator.start();
    }
    this.oscillator.frequency.value = frequency;
  }
  stop() {
    this.oscillator.stop();
    this.oscillator = null;
  }
}
