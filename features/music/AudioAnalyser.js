function isStream(obj) {
  return obj && typeof obj.pipe === "function" && obj instanceof Stream;
}

class AudioAnalyser {
  constructor() {
    this.initFlag = false;
    this.callbacks = [];
  }
  init(target, { fftSize = 256 } = {}) {
    if (this.initFlag) return;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.source =
      target instanceof MediaStream
        ? this.audioContext.createMediaStreamSource(target)
        : this.audioContext.createMediaElementSource(target);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    this.initFlag = true;
    this.renderFrame();
  }

  destroy() {
    this.initFlag = false;
    this.source.disconnect();
    this.audioContext.close();
    this.audioContext = null;
    this.source = null;
  }

  registerCallback(callback) {
    this.callbacks.push(callback);
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  renderFrame() {
    if (!this.initFlag) return;
    this.getFrequencyData();
    this.callbacks.forEach((callback) => callback(this.dataArray));
    requestAnimationFrame(() => this.renderFrame());
  }
}
