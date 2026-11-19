import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * OrbitControls wrapper for debugging and free canvas inspection.
 * Damping enabled for silky movement. Automatically yields control
 * to GSAP scroll timelines when the user is scrolling.
 */
export default class Controls {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.canvas = experience.canvas;

    this.instance = new OrbitControls(this.camera.instance, this.canvas);
    this.instance.enableDamping = true;
    this.instance.dampingFactor = 0.05;
    this.instance.enableZoom = true;
    this.instance.enablePan = false;
    this.instance.minDistance = 2.0;
    this.instance.maxDistance = 12.0;

    this.isUserInteracting = false;

    this.instance.addEventListener('start', () => {
      this.isUserInteracting = true;
    });

    this.instance.addEventListener('end', () => {
      // Small cooldown before allowing scroll timeline to gently regain custody
      setTimeout(() => {
        this.isUserInteracting = false;
      }, 600);
    });
  }

  update() {
    if (this.isUserInteracting) {
      this.instance.update();
    }
  }
}
