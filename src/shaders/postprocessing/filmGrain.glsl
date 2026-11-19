uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uIntensity;
uniform float uVignette;

varying vec2 vUv;

// High-frequency pseudo-random noise generator
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 baseColor = texture2D(tDiffuse, vUv);

  // Time-animated high-frequency grain
  vec2 seed = vUv * 2.5 + vec2(sin(uTime * 12.0) * 0.1, cos(uTime * 15.0) * 0.1);
  float noise = hash(seed * 43758.5453);

  // Luminance-weighted grain: more pronounced in shadows and midtones, preserved in highlights
  float luminance = dot(baseColor.rgb, vec3(0.299, 0.587, 0.114));
  float grainWeight = (1.0 - luminance * 0.65) * uIntensity;
  vec3 grain = vec3((noise - 0.5) * grainWeight);

  // Subtle dark vignette to focus the composition
  vec2 centerDist = vUv - 0.5;
  float vig = 1.0 - dot(centerDist, centerDist) * uVignette;
  vig = clamp(vig, 0.0, 1.0);

  vec3 finalColor = (baseColor.rgb + grain) * vig;

  gl_FragColor = vec4(finalColor, baseColor.a);
}
