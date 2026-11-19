import * as THREE from 'three';
import gsap from 'gsap';
import Sizes from '../utils/Sizes.js';
import Time from '../utils/Time.js';
import Mouse3D from '../utils/Mouse3D.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Controls from './Controls.js';
import ProceduralEnv from './environment/ProceduralEnv.js';
import GlassMorph from './objects/GlassMorph.js';
import Particles from './objects/Particles.js';
import PostProcessing from '../postprocessing/PostProcessing.js';

export const PALETTES = [
  {
    name: 'Cyan/Violet',
    colorA: '#00e5ff',
    colorB: '#a855f7',
    attenuation: '#b0d0ff',
  },
  {
    name: 'Solar Amber',
    colorA: '#ff9100',
    colorB: '#ff1744',
    attenuation: '#ffe0b2',
  },
  {
    name: 'Emerald Gold',
    colorA: '#00e676',
    colorB: '#ffd600',
    attenuation: '#b9f6ca',
  },
];

// Camera trajectory across the 4 full-viewport HTML sections
const CAMERA_STAGES = [
  { pos: new THREE.Vector3(0, 0, 6.0),       target: new THREE.Vector3(0, 0, 0) },        // 01: Hero
  { pos: new THREE.Vector3(1.7, 0.35, 4.8),  target: new THREE.Vector3(0.3, 0, 0) },      // 02: Morphology
  { pos: new THREE.Vector3(-1.9, -0.4, 4.6), target: new THREE.Vector3(-0.3, 0, 0) },    // 03: Chromatics
  { pos: new THREE.Vector3(0, 1.15, 3.85),   target: new THREE.Vector3(0, 0, 0) },        // 04: Convergence
];

/**
 * Central experience manager — coordinates camera, scene graph,
 * physical glass mesh, reactive particles, and post-processing.
 */
export default class Experience {
  constructor(canvas) {
    if (Experience.instance) return Experience.instance;
    Experience.instance = this;

    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Utils
    this.sizes = new Sizes();
    this.time = new Time();

    // Core
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);
    this.controls = new Controls(this);

    // Camera scroll tracking targets
    this.targetCameraPos = new THREE.Vector3(0, 0, 6.0);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);

    // Input
    this.mouse3D = new Mouse3D(this);

    // ── Procedural HDR environment ──
    const proceduralEnv = new ProceduralEnv(this.renderer.instance);
    this.envMap = proceduralEnv.generate();
    this.scene.environment = this.envMap;

    // ── Objects ──
    this.glassMorph = new GlassMorph(this);
    this.particles = new Particles(this);

    // ── Post-processing ──
    this.postProcessing = new PostProcessing(this);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight('#b0c4de', 0.25);
    this.scene.add(ambientLight);

    const keyLight = new THREE.PointLight('#ffe8d0', 3.0, 25);
    keyLight.position.set(3, 4, 4);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight('#00e5ff', 1.5, 18);
    cyanRim.position.set(-4, 1, 2);
    this.scene.add(cyanRim);

    const violetFill = new THREE.PointLight('#9c27b0', 1.0, 15);
    violetFill.position.set(1, -3, -3);
    this.scene.add(violetFill);

    this.paletteIndex = 0;

    // Event listeners
    this.sizes.on('resize', () => this._onResize());
    this.time.on('tick', () => this._onTick());
  }

  _onResize() {
    this.camera.resize();
    this.renderer.resize();
    this.postProcessing.resize();
  }

  _onTick() {
    // Smooth camera trajectory when not user-orbiting
    if (this.controls && !this.controls.isUserInteracting) {
      this.camera.instance.position.lerp(this.targetCameraPos, 0.05);
      this.camera.lookAtTarget.lerp(this.targetCameraLookAt, 0.05);
    }

    this.controls.update();
    this.camera.update();
    this.mouse3D.update();
    this.glassMorph.update();
    this.particles.update();
    this.renderer.update();
    this.postProcessing.update();
  }

  /**
   * Drives camera trajectory, glass morphology, and particle color shifting
   * via scroll progress [0, 1] across the 4 sections.
   */
  setScrollProgress(progress) {
    this.glassMorph.setScrollProgress(progress);
    this.particles.setScrollProgress(progress);

    // Compute interpolated camera position across 4 stages
    if (this.controls && !this.controls.isUserInteracting) {
      const scaled = Math.min(Math.max(progress, 0), 0.999) * (CAMERA_STAGES.length - 1);
      const idx = Math.floor(scaled);
      const frac = scaled - idx;

      this.targetCameraPos.copy(CAMERA_STAGES[idx].pos).lerp(CAMERA_STAGES[idx + 1].pos, frac);
      this.targetCameraLookAt.copy(CAMERA_STAGES[idx].target).lerp(CAMERA_STAGES[idx + 1].target, frac);
    }
  }

  cyclePalette() {
    this.paletteIndex = (this.paletteIndex + 1) % PALETTES.length;
    const pal = PALETTES[this.paletteIndex];
    this.particles.setColors(pal.colorA, pal.colorB);
    this.glassMorph.setAttenuationColor(pal.attenuation);
    return pal;
  }

  toggleWireframe() {
    return this.glassMorph.toggleWireframe();
  }

  toggleBloom() {
    return this.postProcessing.toggleBloom();
  }

  resetCamera() {
    this.targetCameraPos.set(0, 0, 6.0);
    this.targetCameraLookAt.set(0, 0, 0);

    gsap.to(this.camera.instance.position, {
      x: 0,
      y: 0,
      z: 6,
      duration: 1.2,
      ease: 'power3.inOut',
    });
    gsap.to(this.controls.instance.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: 'power3.inOut',
    });
  }
}
