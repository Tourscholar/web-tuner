/**
 * // the frequency histogram
 *
 * // 频率直方图
 *
 * // 주파수 히스토그램
 * @param {string} selector
 * @constructor
 */
class FrequencyBars {
  constructor(selector) {
    this.$canvas = document.querySelector(selector);
    this.$canvas.width = document.body.clientWidth;
    this.$canvas.height = document.body.clientHeight / 2;
    this.canvasContext = this.$canvas.getContext("2d");
  }
  /**
   * @param {Uint8Array} data
   */
  update(data) {
    const length = 64; 
    // low frequency only
    // 仅低频
    // 저주파만
    const width = this.$canvas.width / length - 0.5;
    this.canvasContext.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
    for (let i = 0; i < length; i += 1) {
      this.canvasContext.fillStyle = "#ecf0f1";
      this.canvasContext.fillRect(
        i * (width + 0.5),
        this.$canvas.height - data[i],
        width,
        data[i]
      );
    }
  }
}


