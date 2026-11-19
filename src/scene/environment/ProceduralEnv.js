import * as THREE from 'three';

/**
 * Generates a procedural HDR environment cubemap from a mini scene
 * of emissive orbs and gradient planes — no external .hdr file needed.
 *
 * The colored emitters create beautiful caustic-like reflections
 * and refractions inside the glass mesh.
 */
export default class ProceduralEnv {
  constructor(renderer) {
    this.renderer = renderer;
    this.envMap = null;
  }

  generate() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080810');

    const orb = new THREE.SphereGeometry(1, 24, 24);

    // ── Key light — warm white ──
    const keyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(3.0, 2.6, 2.0),
    });
    const key = new THREE.Mesh(orb, keyMat);
    key.position.set(5, 4, -3);
    key.scale.setScalar(1.6);
    scene.add(key);

    // ── Cyan accent ──
    const cyanMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.3, 2.0, 2.8),
    });
    const cyan = new THREE.Mesh(orb, cyanMat);
    cyan.position.set(-5, -1, 4);
    cyan.scale.setScalar(1.2);
    scene.add(cyan);

    // ── Violet accent ──
    const violetMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.6, 0.4, 2.8),
    });
    const violet = new THREE.Mesh(orb, violetMat);
    violet.position.set(2, -4, -5);
    violet.scale.setScalar(1.0);
    scene.add(violet);

    // ── Deep blue rim ──
    const rimMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.2, 0.3, 1.8),
    });
    const rim = new THREE.Mesh(orb, rimMat);
    rim.position.set(-3, 5, -2);
    rim.scale.setScalar(0.8);
    scene.add(rim);

    // ── Soft pink kick ──
    const pinkMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.8, 0.6, 1.2),
    });
    const pink = new THREE.Mesh(orb, pinkMat);
    pink.position.set(4, -3, 6);
    pink.scale.setScalar(0.6);
    scene.add(pink);

    // ── Large diffuse ground fill ──
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.06, 0.06, 0.1),
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -8, 0);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ── Overhead ceiling fill ──
    const ceilMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.1, 0.1, 0.15),
    });
    const ceil = new THREE.Mesh(groundGeo, ceilMat);
    ceil.position.set(0, 8, 0);
    ceil.rotation.x = Math.PI / 2;
    scene.add(ceil);

    // Generate PMREM cubemap
    this.envMap = pmrem.fromScene(scene, 0.04).texture;
    this.envMap.colorSpace = THREE.SRGBColorSpace;

    // Cleanup generator and temp scene
    pmrem.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    return this.envMap;
  }

  dispose() {
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }
  }
}
