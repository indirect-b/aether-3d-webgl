import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import fluidShader from '../shaders/postprocessing/fluidDistortion.glsl';
import filmGrainShader from '../shaders/postprocessing/filmGrain.glsl';

/**
 * Active Theory Post-Processing Pipeline:
 *  1. RenderPass — Base HalfFloat HDR scene
 *  2. UnrealBloomPass — Specular caustic glow
 *  3. FluidDistortionPass — Liquid mouse ripple trail & chromatic aberration
 *  4. FilmGrainPass — Time-animated micro film grain with vignette
 *  5. OutputPass — ACES Filmic tone mapping & sRGB output
 */
export default class PostProcessing {
  constructor(experience) {
    this.experience = experience;
    this.renderer = experience.renderer;
    this.scene = experience.scene;
    this.camera = experience.camera;
    this.sizes = experience.sizes;
    this.time = experience.time;

    this.enabled = true;
    this.bloomEnabled = true;

    // Mouse velocity & position tracking for fluid ripples
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.prevMouse = new THREE.Vector2(0.5, 0.5);
    this.targetVelocity = 0;
    this.velocity = 0;
    this.scrollVelocity = 0;

    this._setupComposer();
    this._bindEvents();
  }

  _setupComposer() {
    const renderTarget = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        type: THREE.HalfFloatType,
        samples: 2,
      }
    );

    this.composer = new EffectComposer(this.renderer.instance, renderTarget);

    // 1. Base Scene Pass
    const renderPass = new RenderPass(this.scene, this.camera.instance);
    this.composer.addPass(renderPass);

    // 2. Subtle Unreal Bloom Pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.35,  // strength
      0.55,  // radius
      0.82   // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Active Theory Fluid Distortion & Liquid Ripple Pass
    this.fluidPass = new ShaderPass({
      uniforms: {
        tDiffuse:        { value: null },
        uMouse:          { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse:      { value: new THREE.Vector2(0.5, 0.5) },
        uVelocity:       { value: 0 },
        uScrollVelocity: { value: 0 },
        uTime:           { value: 0 },
        uAspect:         { value: this.sizes.aspect },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fluidShader,
    });
    this.composer.addPass(this.fluidPass);

    // 4. Custom Film Grain & Vignette Pass
    this.filmGrainPass = new ShaderPass({
      uniforms: {
        tDiffuse:   { value: null },
        uTime:      { value: 0 },
        uIntensity: { value: 0.05 },
        uVignette:  { value: 0.9 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: filmGrainShader,
    });
    this.composer.addPass(this.filmGrainPass);

    // 5. Output Pass
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      // UV coordinates: [0, 1] with Y flipped for GLSL
      const uvX = e.clientX / this.sizes.width;
      const uvY = 1.0 - e.clientY / this.sizes.height;

      const deltaX = uvX - this.mouse.x;
      const deltaY = uvY - this.mouse.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      this.targetVelocity = Math.min(dist * 25.0, 1.8);

      this.prevMouse.copy(this.mouse);
      this.mouse.set(uvX, uvY);
    });
  }

  setScrollVelocity(vel) {
    this.scrollVelocity = Math.min(Math.max(vel * 0.02, -1.5), 1.5);
  }

  toggleBloom() {
    this.bloomEnabled = !this.bloomEnabled;
    this.bloomPass.enabled = this.bloomEnabled;
    return this.bloomEnabled;
  }

  resize() {
    this.composer.setSize(this.sizes.width, this.sizes.height);
    this.composer.setPixelRatio(this.sizes.pixelRatio);
    this.bloomPass.resolution.set(this.sizes.width, this.sizes.height);
    if (this.fluidPass) {
      this.fluidPass.uniforms.uAspect.value = this.sizes.aspect;
    }
  }

  update() {
    const timeSec = this.time.elapsed * 0.001;

    // Smoothly decay mouse ripple velocity
    this.velocity += (this.targetVelocity - this.velocity) * 0.12;
    this.targetVelocity *= 0.88;

    // Decay scroll ripple velocity
    this.scrollVelocity *= 0.92;

    if (this.fluidPass) {
      this.fluidPass.uniforms.uTime.value = timeSec;
      this.fluidPass.uniforms.uMouse.value.copy(this.mouse);
      this.fluidPass.uniforms.uPrevMouse.value.copy(this.prevMouse);
      this.fluidPass.uniforms.uVelocity.value = this.velocity;
      this.fluidPass.uniforms.uScrollVelocity.value = this.scrollVelocity;
    }

    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.uTime.value = timeSec;
    }

    if (this.enabled) {
      this.composer.render();
    }
  }
}
