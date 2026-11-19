import * as THREE from 'three';
import vertexShader from '../../shaders/particles/vertex.glsl';
import fragmentShader from '../../shaders/particles/fragment.glsl';

const PARTICLE_COUNT = 2500;
const SPREAD = 5.2;        // spatial spread radius
const MOUSE_RADIUS = 2.6;  // interaction radius in world units

// 4 distinct spectral palettes for the 4 scroll sections
const SCROLL_COLOR_STAGES = [
  { a: new THREE.Color('#00e5ff'), b: new THREE.Color('#3b82f6') }, // Section 1: Pure Cyan & Electric Blue
  { a: new THREE.Color('#a855f7'), b: new THREE.Color('#f43f5e') }, // Section 2: Vivid Violet & Neon Rose
  { a: new THREE.Color('#fb923c'), b: new THREE.Color('#facc15') }, // Section 3: Solar Amber & Radiant Gold
  { a: new THREE.Color('#10b981'), b: new THREE.Color('#06b6d4') }, // Section 4: Mint Emerald & Holographic Cyan
];

/**
 * GPU-driven particle system.
 * 2 500 glowing micro-particles with Simplex noise movement,
 * scroll dynamics, smooth spectral shifting across 4 sections,
 * and 3D mouse-reactive swirling.
 */
export default class Particles {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.time = experience.time;
    this.mouse3D = experience.mouse3D;
    this.sizes = experience.sizes;

    this.scrollProgress = 0;
    this.manualOverride = false;

    this._createGeometry();
    this._createMaterial();
    this._createPoints();
  }

  // ─── Geometry ──────────────────────────────────────────
  _createGeometry() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randoms   = new Float32Array(PARTICLE_COUNT * 3);
    const scales    = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Distribute in a soft sphere (cube-root for uniform volume)
      const r     = Math.cbrt(Math.random()) * SPREAD;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      positions[i3    ] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Unique random seed per particle (for noise offset)
      randoms[i3    ] = Math.random() * 2 - 1;
      randoms[i3 + 1] = Math.random() * 2 - 1;
      randoms[i3 + 2] = Math.random() * 2 - 1;

      // Random size multiplier [0.35 → 1.1]
      scales[i] = 0.35 + Math.random() * 0.75;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 3));
    this.geometry.setAttribute('aScale',   new THREE.BufferAttribute(scales, 1));
  }

  // ─── Material ──────────────────────────────────────────
  _createMaterial() {
    this.uniforms = {
      uTime:           { value: 0 },
      uPixelRatio:     { value: this.sizes.pixelRatio },
      uMouse3D:        { value: new THREE.Vector3(0, 0, 0) },
      uMouseRadius:    { value: MOUSE_RADIUS },
      uScrollProgress: { value: 0 },
      uColorA:         { value: SCROLL_COLOR_STAGES[0].a.clone() },
      uColorB:         { value: SCROLL_COLOR_STAGES[0].b.clone() },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  // ─── Points mesh ──────────────────────────────────────
  _createPoints() {
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  // ─── Manual Color Override (Dock Palette) ──────────────
  setColors(hexA, hexB) {
    this.manualOverride = true;
    this.uniforms.uColorA.value.set(hexA);
    this.uniforms.uColorB.value.set(hexB);
  }

  // ─── Scroll Reactivity & Smooth Color Shift ────────────
  setScrollProgress(progress) {
    this.scrollProgress = progress;
    this.uniforms.uScrollProgress.value = progress;

    // Smoothly shift particle colors between the 4 sections
    if (!this.manualOverride) {
      const scaled = Math.min(Math.max(progress, 0), 0.999) * (SCROLL_COLOR_STAGES.length - 1);
      const idx = Math.floor(scaled);
      const frac = scaled - idx;

      const stageCur = SCROLL_COLOR_STAGES[idx];
      const stageNext = SCROLL_COLOR_STAGES[idx + 1];

      this.uniforms.uColorA.value.copy(stageCur.a).lerp(stageNext.a, frac);
      this.uniforms.uColorB.value.copy(stageCur.b).lerp(stageNext.b, frac);
    }
  }

  // ─── Per-frame update ─────────────────────────────────
  update() {
    this.uniforms.uTime.value = this.time.elapsed * 0.001;
    this.uniforms.uPixelRatio.value = this.sizes.pixelRatio;

    // Feed smoothed mouse position to shader
    if (this.mouse3D) {
      this.uniforms.uMouse3D.value.copy(this.mouse3D.smoothed);
    }
  }

  // ─── Cleanup ──────────────────────────────────────────
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}
