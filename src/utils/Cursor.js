/**
 * Active Theory Magnetic Cursor
 * Smooth lerped custom cursor with dual-layer physics (inner dot + lagging outer ring),
 * magnetic pull toward interactive targets, and scaling transitions.
 */
export default class MagneticCursor {
  constructor(soundEngine) {
    this.sound = soundEngine;

    this.mouse = { x: -100, y: -100 };
    this.pos = { x: -100, y: -100 };
    this.targetPos = { x: -100, y: -100 };

    this.isHovering = false;
    this.isMagnetic = false;
    this.magneticTarget = null;
    this.magneticStrength = 0.35;

    this._createDOM();
    this._bindEvents();
    this._render();
  }

  _createDOM() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-cursor';

    this.dotEl = document.createElement('div');
    this.dotEl.className = 'cursor-dot';

    this.ringEl = document.createElement('div');
    this.ringEl.className = 'cursor-ring';

    this.cursorEl.appendChild(this.dotEl);
    this.cursorEl.appendChild(this.ringEl);
    document.body.appendChild(this.cursorEl);
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      if (!this.isMagnetic) {
        this.targetPos.x = e.clientX;
        this.targetPos.y = e.clientY;
      }
    });

    window.addEventListener('mousedown', () => {
      this.cursorEl.classList.add('cursor-down');
      if (this.sound) this.sound.playClick();
    });

    window.addEventListener('mouseup', () => {
      this.cursorEl.classList.remove('cursor-down');
    });

    // Delegate magnetic hover on interactive elements
    this.refreshInteractives();
  }

  refreshInteractives() {
    const targets = document.querySelectorAll(
      'button, a, .glass-card, [data-magnetic]'
    );

    targets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        this.cursorEl.classList.add('cursor-hover');
        if (this.sound) this.sound.playHover();

        if (el.hasAttribute('data-magnetic') || el.tagName === 'BUTTON') {
          this.isMagnetic = true;
          this.magneticTarget = el;
        }
      });

      el.addEventListener('mouseleave', () => {
        this.cursorEl.classList.remove('cursor-hover');
        this.isMagnetic = false;
        this.magneticTarget = null;
        el.style.transform = '';
      });

      el.addEventListener('mousemove', (e) => {
        if (this.isMagnetic && this.magneticTarget === el) {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const deltaX = (e.clientX - centerX) * this.magneticStrength;
          const deltaY = (e.clientY - centerY) * this.magneticStrength;

          this.targetPos.x = centerX + deltaX * 0.5;
          this.targetPos.y = centerY + deltaY * 0.5;

          // Magnetic tug on the element itself
          el.style.transform = `translate3d(${deltaX * 0.4}px, ${deltaY * 0.4}px, 0)`;
        }
      });
    });
  }

  _render() {
    // Sharp immediate follow for inner dot
    this.dotEl.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;

    // Silky spring lag for outer ring
    this.pos.x += (this.targetPos.x - this.pos.x) * 0.16;
    this.pos.y += (this.targetPos.y - this.pos.y) * 0.16;

    this.ringEl.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;

    requestAnimationFrame(() => this._render());
  }
}
