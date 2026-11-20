/**
 * Active Theory 3D Card Tilt & Dynamic Specular Sheen
 * Computes precise Euler perspective tilt (Pitch & Roll) and specular
 * light sheen tracking mouse coordinates on interactive cards.
 */
export default class TiltCards {
  constructor() {
    this.cards = document.querySelectorAll('.glass-card');
    this.init();
  }

  init() {
    this.cards.forEach((card) => {
      // Add specular sheen overlay element if not present
      let sheen = card.querySelector('.card-sheen');
      if (!sheen) {
        sheen = document.createElement('div');
        sheen.className = 'card-sheen';
        card.appendChild(sheen);
      }

      card.addEventListener('mousemove', (e) => this._onMouseMove(e, card, sheen));
      card.addEventListener('mouseleave', () => this._onMouseLeave(card, sheen));
    });
  }

  _onMouseMove(e, card, sheen) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalised coordinates between -1 and +1
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Max 14 degree tilt
    const rotateX = -normY * 12;
    const rotateY = normX * 12;

    card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

    // Position specular sheen highlight
    if (sheen) {
      sheen.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 229, 255, 0.22) 0%, rgba(168, 85, 247, 0.08) 40%, transparent 70%)`;
      sheen.style.opacity = '1';
    }
  }

  _onMouseLeave(card, sheen) {
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (sheen) {
      sheen.style.opacity = '0';
    }
  }
}
