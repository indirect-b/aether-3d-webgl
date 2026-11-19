import * as THREE from 'three';
import vertexShader from '../../shaders/vertex.glsl';
import fragmentShader from '../../shaders/fragment.glsl';

/**
 * Example custom shader mesh — an icosahedron with animated displacement.
 */
export default class ExampleMesh {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.time = experience.time;

    this.uniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uColor: { value: new THREE.Color('#1a1a2e') },
    };

    this._createGeometry();
    this._createMaterial();
    this._createMesh();
  }

  _createGeometry() {
    this.geometry = new THREE.IcosahedronGeometry(1.5, 64);
  }

  _createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      wireframe: false,
      side: THREE.DoubleSide,
    });
  }

  _createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  update() {
    this.uniforms.uTime.value = this.time.elapsed * 0.001;
    this.mesh.rotation.y += 0.002;
    this.mesh.rotation.x += 0.001;
  }

  /**
   * @param {number} progress — normalized scroll progress [0, 1]
   */
  setScrollProgress(progress) {
    this.uniforms.uScrollProgress.value = progress;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
  }
}
