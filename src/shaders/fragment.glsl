uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Fresnel-style rim lighting
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);

  // Base color with time-based hue shift
  vec3 color = uColor + 0.15 * sin(uTime * 0.3 + vUv.y * 6.2831);

  // Mix fresnel rim glow
  vec3 rimColor = vec3(0.4, 0.6, 1.0);
  color = mix(color, rimColor, fresnel * 0.6);

  // Scroll-driven opacity fade (subtle)
  float alpha = 1.0 - uScrollProgress * 0.3;

  gl_FragColor = vec4(color, alpha);
}
