import { EventEmitter } from './EventEmitter.js';

/**
 * High-precision animation clock.
 * Emits 'tick' every frame with delta and elapsed time.
 */
export default class Time extends EventEmitter {
  constructor() {
    super();

    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16; // ~60fps initial

    // Wait one frame before starting the loop
    window.requestAnimationFrame(() => this._tick());
  }

  _tick() {
    const now = Date.now();
    this.delta = now - this.current;
    this.current = now;
    this.elapsed = this.current - this.start;

    this.emit('tick');

    window.requestAnimationFrame(() => this._tick());
  }
}
