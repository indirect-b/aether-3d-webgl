uniform float uTime;
uniform float uPixelRatio;
uniform vec3  uMouse3D;
uniform float uMouseRadius;
uniform float uScrollProgress;
uniform vec3  uColorA;
uniform vec3  uColorB;

attribute vec3  aRandom;    // per-particle random seed
attribute float aScale;     // per-particle size multiplier

varying float vDistToMouse;
varying float vNoiseFactor;
varying vec3  vColor;

#include ../noise/simplex3d.glsl

void main() {
  vec3 pos = position;
  float t = uTime * 0.15;

  // Scroll factor expands and accelerates particle swirl
  float scrollBoost = 1.0 + uScrollProgress * 1.5;
  float vortexAngle = uScrollProgress * 3.14159 * 1.2;

  // Gentle scroll twist around Y axis
  float cosV = cos(vortexAngle);
  float sinV = sin(vortexAngle);
  vec3 vortexPos = pos;
  vortexPos.x = pos.x * cosV - pos.z * sinV;
  vortexPos.z = pos.x * sinV + pos.z * cosV;

  // Layered simplex displacement — organic floating drift
  vec3 noiseInput = vortexPos * 0.6 + aRandom * 2.0 + t;
  vec3 displaced = vortexPos;
  displaced.x += snoise(noiseInput)              * 0.4 * scrollBoost;
  displaced.y += snoise(noiseInput + vec3(43.0)) * 0.4 * scrollBoost;
  displaced.z += snoise(noiseInput + vec3(97.0)) * 0.4 * scrollBoost;

  // Curl noise for swirl layer
  vec3 curl = curlNoise(vortexPos * 0.3 + t * 0.5);
  displaced += curl * (0.25 + uScrollProgress * 0.25);

  // ── Mouse interaction — swirl attractor ──
  vec3 toMouse = uMouse3D - displaced;
  float dist = length(toMouse);
  float influence = smoothstep(uMouseRadius, 0.0, dist);

  // Tangential swirl: cross product gives orbit direction
  vec3 swirlAxis = normalize(cross(toMouse, vec3(0.0, 1.0, 0.0)) + 0.001);
  vec3 swirl = swirlAxis * influence * 1.4;

  // Gentle pull toward mouse
  vec3 attraction = normalize(toMouse + 0.001) * influence * 0.35;

  displaced += swirl + attraction;

  // ── Outputs ──
  vDistToMouse = influence;
  vNoiseFactor = snoise(noiseInput) * 0.5 + 0.5;

  // Color gradient between uColorA and uColorB, influenced by noise, mouse, and scroll
  float colorMix = vNoiseFactor * 0.5 + influence * 0.3 + uScrollProgress * 0.2;
  vColor = mix(uColorA, uColorB, clamp(colorMix, 0.0, 1.0));

  // ── GL output ──
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

  // Size: base + mouse proximity boost + scroll shimmer
  float size = aScale * (20.0 + influence * 25.0 + uScrollProgress * 8.0);
  gl_PointSize = size * uPixelRatio * (1.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
