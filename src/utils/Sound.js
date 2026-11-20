/**
 * Synthesized Web Audio Engine (Active Theory Style)
 * Generates an ethereal procedural ambient soundscape and
 * interactive micro-SFX entirely in-browser — zero external assets required.
 */
export default class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.filter = null;
    this.oscillators = [];
    this.lfo = null;

    // Chord frequencies for a rich, celestial minor-9th ambient drone (D-A-C-E-F)
    this.notes = [146.83, 220.0, 261.63, 329.63, 349.23];
  }

  _initContext() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Filter for warm, deep analog tone
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // Low Frequency Oscillator for subtle breathing filter sweep
    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // slow pulse
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Ambient gain
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.ambientGain.connect(this.filter);

    // Polyphonic Drone Oscillators
    this.notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      // Alternate between sine and warm triangle
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Micro-detuning for lush stereo chorus effect
      osc.detune.setValueAtTime((i - 2) * 4.5, this.ctx.currentTime);

      // Subdued individual levels
      oscGain.gain.setValueAtTime(0.12 / this.notes.length, this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.ambientGain);
      osc.start();
      this.oscillators.push(osc);
    });
  }

  toggle() {
    if (!this.ctx) {
      this._initContext();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      // Fade in smoothly
      this.masterGain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 1.2);
    } else {
      // Fade out smoothly
      this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
    }

    return this.isPlaying;
  }

  /**
   * High-tech, glass-like UI hover ping
   */
  playHover() {
    if (!this.isPlaying || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Harmonic high frequency
      const freq = 1200 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Silent catch
    }
  }

  /**
   * Tactile digital UI click sound
   */
  playClick() {
    if (!this.isPlaying || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Silent catch
    }
  }

  /**
   * Modulate filter based on scroll velocity
   */
  setScrollVelocity(vel) {
    if (!this.isPlaying || !this.filter) return;
    const clamped = Math.min(Math.abs(vel) * 40, 600);
    this.filter.frequency.setTargetAtTime(450 + clamped, this.ctx.currentTime, 0.1);
  }
}
