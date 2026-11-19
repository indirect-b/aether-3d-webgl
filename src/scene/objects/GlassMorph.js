import * as THREE from 'three';
import simplexNoise from '../../shaders/noise/simplex3d.glsl';

/**
 * Abstract morphing glass torus knot.
 *
 * Uses MeshPhysicalMaterial for physically-based glass rendering:
 *  - High transmission for see-through refraction
 *  - Dispersion for chromatic aberration (RGB split)
 *  - Iridescence for rainbow rim highlights
 *  - Procedural HDR env map for realistic reflections
 *
 * Custom vertex displacement is injected via onBeforeCompile
 * using the shared simplex noise library — the mesh continuously
 * morphs with layered noise, twisting warp, and scroll reactivity.
 */

const MORPH_SPEED    = 0.18;
const MORPH_AMP      = 0.12;
const TWIST_SPEED    = 0.10;
const TWIST_STRENGTH = 0.6;
const BREATHE_SPEED  = 0.25;
const BREATHE_AMP    = 0.04;

export default class GlassMorph {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.time = experience.time;
    this.mouse3D = experience.mouse3D;

    this.scrollProgress = 0;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.targetScale = 1.0;
    this.targetRotation = new THREE.Euler(0, 0, 0);

    // Will hold the reference returned by onBeforeCompile
    this._shader = null;

    this._createGeometry();
    this._createMaterial();
    this._createMesh();
  }

  // ─── Geometry ──────────────────────────────────────────
  _createGeometry() {
    this.geometry = new THREE.TorusKnotGeometry(
      1.0,   // radius
      0.32,  // tube radius
      220,   // tubular segments — high for smooth displacement
      54,    // radial segments
      2,     // p — winds around axis of symmetry
      3      // q — winds around interior of torus
    );
  }

  // ─── Material ──────────────────────────────────────────
  _createMaterial() {
    const envMap = this.experience.envMap;

    this.material = new THREE.MeshPhysicalMaterial({
      // ── Glass transmission ──
      transmission:  0.97,
      roughness:     0.05,
      thickness:     1.5,
      ior:           1.45,
      attenuationDistance: 3.0,
      attenuationColor:   new THREE.Color('#b0d0ff'),

      // ── Chromatic aberration (Three.js r163+) ──
      dispersion: 5.0,

      // ── Iridescence (rim rainbow) ──
      iridescence:    1.0,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [100, 500],

      // ── Surface ──
      metalness:  0.0,
      clearcoat:  0.4,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,

      // ── Environment ──
      envMap: envMap,
      envMapIntensity: 2.0,

      // ── Misc ──
      color: new THREE.Color('#ffffff'),
      side:  THREE.DoubleSide,
    });

    // ── Inject vertex displacement into the built-in shader ──
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uScrollProgress = { value: 0 };

      shader.vertexShader = /* glsl */ `
        uniform float uTime;
        uniform float uScrollProgress;
        ${simplexNoise}
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>

        float t = uTime;
        float sProg = uScrollProgress;

        // Layer 1: Simplex noise morphing amplified by scroll
        float noiseAmp = ${MORPH_AMP.toFixed(4)} * (1.0 + sProg * 1.2);
        vec3 noiseCoord = transformed * (1.8 + sProg * 0.8) + t * ${MORPH_SPEED.toFixed(4)};
        float n1 = snoise(noiseCoord);
        float n2 = snoise(noiseCoord + vec3(43.0, 17.0, 91.0));
        float n3 = snoise(noiseCoord + vec3(71.0, 53.0, 29.0));
        vec3 noiseDisp = vec3(n1, n2, n3) * noiseAmp;
        transformed += objectNormal * (n1 * noiseAmp);
        transformed += noiseDisp * 0.5;

        // Layer 2: Twisting warp along Y axis
        float twistFactor = ${TWIST_STRENGTH.toFixed(4)} + sProg * 1.1;
        float twistAngle = transformed.y * twistFactor + t * ${TWIST_SPEED.toFixed(4)};
        float cs = cos(twistAngle);
        float sn = sin(twistAngle);
        vec3 twisted = transformed;
        twisted.x = transformed.x * cs - transformed.z * sn;
        twisted.z = transformed.x * sn + transformed.z * cs;
        transformed = twisted;

        // Layer 3: Gentle breathing pulse
        float breathe = 1.0 + sin(t * ${BREATHE_SPEED.toFixed(4)}) * ${BREATHE_AMP.toFixed(4)};
        transformed *= breathe;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        #include <beginnormal_vertex>

        float tN = uTime;
        float sProgN = uScrollProgress;
        float twistFactorN = ${TWIST_STRENGTH.toFixed(4)} + sProgN * 1.1;
        float twistN = position.y * twistFactorN + tN * ${TWIST_SPEED.toFixed(4)};
        float csN = cos(twistN);
        float snN = sin(twistN);
        vec3 twistedNormal = objectNormal;
        twistedNormal.x = objectNormal.x * csN - objectNormal.z * snN;
        twistedNormal.z = objectNormal.x * snN + objectNormal.z * csN;
        objectNormal = twistedNormal;
        `
      );

      this._shader = shader;
    };

    this.material.customProgramCacheKey = () => 'glassMorph_v3';
  }

  // ─── Mesh ──────────────────────────────────────────────
  _createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
  }

  toggleWireframe() {
    this.material.wireframe = !this.material.wireframe;
    return this.material.wireframe;
  }

  setAttenuationColor(hex) {
    this.material.attenuationColor.set(hex);
  }

  // ─── Scroll Morph Choreography Across 4 Sections ───────
  setScrollProgress(progress) {
    this.scrollProgress = progress;
    if (this._shader) {
      this._shader.uniforms.uScrollProgress.value = progress;
    }

    // Dynamic optical dispersion boost during middle exploration
    this.material.dispersion = 5.0 + Math.sin(progress * Math.PI) * 6.0;

    // Spatial and topological choreography across sections:
    // Section 1 (0 -> 0.33): Centered, baseline scale 1.0
    // Section 2 (0.33 -> 0.66): Floats left/right opposite text, twists deeper
    // Section 3 (0.66 -> 1.0): Shifts position, scales up, high rotation
    if (progress < 0.33) {
      const p = progress / 0.33;
      this.targetPosition.set(p * 1.3, p * 0.1, p * 0.2);
      this.targetScale = 1.0 - p * 0.1;
    } else if (progress < 0.66) {
      const p = (progress - 0.33) / 0.33;
      this.targetPosition.set(1.3 - p * 2.6, 0.1 - p * 0.2, 0.2 + p * 0.2);
      this.targetScale = 0.9 + p * 0.25;
    } else {
      const p = (progress - 0.66) / 0.34;
      this.targetPosition.set(-1.3 + p * 1.3, -0.1 + p * 0.2, 0.4 - p * 0.2);
      this.targetScale = 1.15 + p * 0.15;
    }
  }

  // ─── Per-frame update ─────────────────────────────────
  update() {
    const elapsed = this.time.elapsed * 0.001;

    // Update injected uniform
    if (this._shader) {
      this._shader.uniforms.uTime.value = elapsed;
    }

    // Smooth position & scale interpolation
    this.mesh.position.lerp(this.targetPosition, 0.06);

    const curScale = this.mesh.scale.x;
    const nextScale = curScale + (this.targetScale - curScale) * 0.06;
    this.mesh.scale.setScalar(nextScale);

    // Continuous idle rotation + scroll-driven rotation scrub
    this.mesh.rotation.y = elapsed * 0.08 + this.scrollProgress * Math.PI * 2.5;
    this.mesh.rotation.x = Math.sin(elapsed * 0.12) * 0.15 + Math.sin(this.scrollProgress * Math.PI) * 0.5;
    this.mesh.rotation.z = Math.cos(elapsed * 0.09) * 0.1;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
  }
}
