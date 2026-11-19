import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import filmGrainShader from '../shaders/postprocessing/filmGrain.glsl';

/**
 * Modern EffectComposer post-processing pipeline:
 *  1. RenderPass — renders base scene into HalfFloatType HDR buffer
 *  2. UnrealBloomPass — subtle, ethereal glow on caustics and glowing particles
 *  3. FilmGrainPass — custom time-animated film grain with luminance weighting
 *  4. OutputPass — official Three.js tone-mapping (ACES Filmic) and sRGB color space conversion
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

    this._setupComposer();
  }

  _setupComposer() {
    // Render target with half-float for HDR bloom & smooth gradient handling
    const renderTarget = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        type: THREE.HalfFloatType,
        samples: 2,
      }
    );

    this.composer = new EffectComposer(this.renderer.instance, renderTarget);

    // 1. Render Pass
    const renderPass = new RenderPass(this.scene, this.camera.instance);
    this.composer.addPass(renderPass);

    // 2. Subtle Unreal Bloom Pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.35,  // subtle strength
      0.55,  // radius
      0.82   // threshold — only high-luminance elements glow
    );
    this.composer.addPass(this.bloomPass);

    // 3. Custom Film Grain Shader Pass
    this.filmGrainPass = new ShaderPass({
      uniforms: {
        tDiffuse:   { value: null },
        uTime:      { value: 0 },
        uIntensity: { value: 0.055 }, // fine, filmic texture
        uVignette:  { value: 0.9 },   // subtle edge darkening
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

    // 4. Output Pass (sRGB and Tone Mapping)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
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
  }

  update() {
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.uTime.value = this.time.elapsed * 0.001;
    }

    if (this.enabled) {
      this.composer.render();
    }
  }
}
