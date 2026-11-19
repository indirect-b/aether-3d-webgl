import * as THREE from 'three';

/**
 * Perspective camera with responsive resize handling
 * and GSAP-animatable position & lookAt target.
 */
export default class Camera {
  constructor(experience) {
    this.experience = experience;
    this.sizes = experience.sizes;
    this.scene = experience.scene;

    this.instance = new THREE.PerspectiveCamera(
      35,
      this.sizes.aspect,
      0.1,
      1000
    );
    this.instance.position.set(0, 0, 6);
    this.lookAtTarget = new THREE.Vector3(0, 0, 0);

    this.scene.add(this.instance);
  }

  resize() {
    this.instance.aspect = this.sizes.aspect;
    this.instance.updateProjectionMatrix();
  }

  update() {
    // Only lock lookAt if user is not actively orbiting
    if (this.experience.controls && !this.experience.controls.isUserInteracting) {
      this.instance.lookAt(this.lookAtTarget);
      this.experience.controls.instance.target.copy(this.lookAtTarget);
    }
  }
}
