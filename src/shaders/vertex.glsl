uniform float uTime;
uniform float uScrollProgress;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);

  vec3 pos = position;

  // Subtle vertex displacement driven by time
  pos += normal * sin(pos.y * 4.0 + uTime * 0.5) * 0.05;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
