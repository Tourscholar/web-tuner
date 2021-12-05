class Application {
  constructor() {
    this.tuner = new Tuner();
    this.notes = new Notes(".notes", this.tuner);
    this.meter = new Meter(".meter");
    this.frequencyBars = new FrequencyBars(".frequency-bars");
    this.update({ name: "A", frequency: 440, octave: 4, value: 69, cents: 0 });
  }
  start() {
    const self = this;

    this.tuner.onNoteDetected = function (note) {
      if (self.notes.isAutoMode) {
        if (self.lastNote === note.name) {
          self.update(note);
        } else {
          self.lastNote = note.name;
        }
      }
    };

    swal("Welcome 네트워크 투너(Online Tuner)!").then(function () {
      self.tuner.init();
      self.frequencyData = new Uint8Array(
        self.tuner.analyser.frequencyBinCount
      );
    });

    this.updateFrequencyBars();
  }
  updateFrequencyBars() {
    if (this.tuner.analyser) {
      this.tuner.analyser.getByteFrequencyData(this.frequencyData);
      this.frequencyBars.update(this.frequencyData);
    }
    requestAnimationFrame(this.updateFrequencyBars.bind(this));
  }
  update(note) {
    this.notes.update(note);
    this.meter.update((note.cents / 50) * 45);
  }
  // noinspection JSUnusedGlobalSymbols
  // 没有检查JSUnusedGlobalSymbols
  // JSUnusedGlobalSymbols검사하지 않다.
  toggleAutoMode() {
    this.notes.toggleAutoMode();
  }
}

const app = new Application();
app.start();
