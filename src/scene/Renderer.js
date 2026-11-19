import * as THREE from 'three';

/**
 * WebGL renderer with anti-aliasing, tone mapping, and sRGB output.
 */
export default class Renderer {
  constructor(experience) {
    this.experience = experience;
    this.sizes = experience.sizes;
    this.scene = experience.scene;
    this.camera = experience.camera;
    this.canvas = experience.canvas;

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.instance.setClearColor('#050508');
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.0;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    // When post-processing is active, rendering is handled there.
    // This is a fallback direct render.
    if (!this.experience.postProcessing?.enabled) {
      this.instance.render(this.scene, this.camera.instance);
    }
  }
}
