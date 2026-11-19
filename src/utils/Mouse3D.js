import * as THREE from 'three';

/**
 * Tracks the mouse position projected into 3D world space
 * via a raycaster against an invisible plane.
 */
export default class Mouse3D {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.sizes = experience.sizes;

    // Normalized device coordinates
    this.ndc = new THREE.Vector2(0, 0);

    // 3D world-space position (on a plane at z = 0)
    this.position = new THREE.Vector3(0, 0, 0);

    // Smoothed position for buttery interpolation
    this.smoothed = new THREE.Vector3(0, 0, 0);
    this.lerpFactor = 0.08;

    // Raycaster + invisible plane
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this._intersectPoint = new THREE.Vector3();

    // Listen
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: true });
  }

  _onMouseMove(e) {
    this.ndc.x = (e.clientX / this.sizes.width) * 2 - 1;
    this.ndc.y = -(e.clientY / this.sizes.height) * 2 + 1;
    this._project();
  }

  _onTouchMove(e) {
    if (e.touches.length > 0) {
      this.ndc.x = (e.touches[0].clientX / this.sizes.width) * 2 - 1;
      this.ndc.y = -(e.touches[0].clientY / this.sizes.height) * 2 + 1;
      this._project();
    }
  }

  _project() {
    this.raycaster.setFromCamera(this.ndc, this.camera.instance);
    this.raycaster.ray.intersectPlane(this.plane, this._intersectPoint);
    if (this._intersectPoint) {
      this.position.copy(this._intersectPoint);
    }
  }

  update() {
    // Smooth interpolation toward raw position
    this.smoothed.lerp(this.position, this.lerpFactor);
  }
}
