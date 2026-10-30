import type { Sound } from "./world";

// Every sound is synthesised with Web Audio: no files to load. A small
// generated beat plays under the fight and dulls during slow motion.

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private beat = 0;
  private nextBeat = 0;
  muted = false;

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(ctx.destination);
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 18000;
      this.filter.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = 0.32;
      this.music.connect(this.filter);
      const len = ctx.sampleRate * 0.5;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.nextBeat = ctx.currentTime + 0.1;
    } catch {
      this.ctx = null;
    }
  }

  stop() {
    void this.ctx?.close();
    this.ctx = null;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  /** Dulls everything while time is slowed. */
  setSlow(slow: boolean) {
    if (!this.ctx || !this.filter) return;
    this.filter.frequency.setTargetAtTime(slow ? 900 : 18000, this.ctx.currentTime, 0.08);
  }

  private env(gain: GainNode, t: number, peak: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }

  private tone(type: OscillatorType, from: number, to: number, decay: number, peak: number, dest?: AudioNode, at?: number) {
    const ctx = this.ctx!;
    const t = at ?? ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + decay);
    this.env(g, t, peak, decay);
    o.connect(g).connect(dest ?? this.filter!);
    o.start(t);
    o.stop(t + decay + 0.02);
  }

  private hiss(freq: number, q: number, decay: number, peak: number, sweep?: number, dest?: AudioNode, at?: number) {
    const ctx = this.ctx!;
    const t = at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + decay);
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, decay);
    src.connect(f).connect(g).connect(dest ?? this.filter!);
    src.start(t);
    src.stop(t + decay + 0.02);
  }

  play(name: Sound) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "light":
        this.tone("sine", 180, 60, 0.12, 0.7);
        this.hiss(2400, 1.2, 0.07, 0.5);
        break;
      case "heavy":
        this.tone("sine", 140, 40, 0.28, 1);
        this.tone("square", 90, 40, 0.12, 0.18);
        this.hiss(1400, 0.8, 0.16, 0.7);
        break;
      case "block":
        this.tone("triangle", 900, 600, 0.08, 0.25);
        this.hiss(5000, 4, 0.06, 0.3);
        break;
      case "parry":
        this.tone("triangle", 1800, 1200, 0.5, 0.35);
        this.tone("sine", 2400, 2380, 0.6, 0.2);
        break;
      case "whoosh":
        this.hiss(700, 1.5, 0.12, 0.18, 2200);
        break;
      case "whooshHeavy":
        this.hiss(400, 1.2, 0.2, 0.28, 1800);
        break;
      case "jump":
        this.hiss(1200, 2, 0.08, 0.1, 2400);
        break;
      case "land":
        this.tone("sine", 90, 50, 0.08, 0.3);
        break;
      case "roll":
        this.hiss(500, 1, 0.22, 0.15, 300);
        break;
      case "ko":
        this.tone("sawtooth", 160, 30, 0.9, 0.35);
        this.tone("sine", 60, 30, 0.9, 0.8);
        break;
      case "zap":
        for (let i = 0; i < 4; i++) this.tone("sawtooth", 900 + Math.random() * 1600, 120, 0.08 + i * 0.04, 0.12, undefined, this.ctx.currentTime + i * 0.025);
        this.hiss(6000, 2, 0.2, 0.25);
        break;
      case "wall":
        this.tone("sine", 70, 35, 0.3, 0.9);
        this.hiss(800, 0.6, 0.2, 0.5);
        break;
      case "stomp":
        this.tone("sine", 60, 25, 0.6, 1);
        this.hiss(300, 0.5, 0.5, 0.6);
        break;
      case "slowIn":
        this.tone("sine", 400, 80, 0.5, 0.3);
        break;
      case "slowOut":
        this.tone("sine", 80, 400, 0.3, 0.2);
        break;
      case "grab":
        this.hiss(900, 2, 0.06, 0.3);
        break;
      case "orb":
        this.tone("square", 600, 300, 0.2, 0.12);
        break;
      case "reflect":
        this.tone("square", 500, 1400, 0.2, 0.18);
        break;
      case "charge":
        this.tone("sawtooth", 80, 900, 0.55, 0.22);
        break;
      case "round":
        this.tone("square", 220, 220, 0.18, 0.15);
        this.tone("square", 330, 330, 0.3, 0.15, undefined, this.ctx.currentTime + 0.2);
        break;
      case "fight":
        this.tone("sawtooth", 440, 880, 0.35, 0.2);
        break;
    }
  }

  /** Schedules the beat a little ahead: kick, hats and a bass line. */
  tick(playing: boolean) {
    if (!this.ctx || !playing || !this.music) return;
    const ctx = this.ctx;
    const step = 60 / 132 / 4;
    const bass = [55, 55, 0, 55, 65.4, 0, 49, 0, 55, 55, 0, 73.4, 65.4, 0, 49, 0];
    while (this.nextBeat < ctx.currentTime + 0.2) {
      const t = this.nextBeat;
      const i = this.beat % 16;
      if (i % 4 === 0) this.tone("sine", 120, 40, 0.18, 0.9, this.music, t);
      if (i % 4 === 2) this.hiss(7000, 3, 0.04, 0.25, undefined, this.music, t);
      if (i % 8 === 4) this.hiss(1800, 0.7, 0.12, 0.35, undefined, this.music, t);
      if (bass[i]) this.tone("sawtooth", bass[i], bass[i] * 0.99, 0.16, 0.22, this.music, t);
      this.beat++;
      this.nextBeat += step;
    }
  }
}
