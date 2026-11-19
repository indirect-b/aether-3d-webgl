uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;
uniform float uVignetteOffset;
uniform float uVignetteDarkness;

varying vec2 vUv;

// Subtle pseudo-random grain
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Subtle chromatic aberration at screen edges
  vec2 distFromCenter = uv - 0.5;
  float aberrationStrength = length(distFromCenter) * 0.003;

  float r = texture2D(tDiffuse, uv + distFromCenter * aberrationStrength).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - distFromCenter * aberrationStrength).b;
  vec3 color = vec3(r, g, b);

  // Soft cinematic vignette
  float dist = length(uv - 0.5);
  float vignette = smoothstep(uVignetteOffset, uVignetteOffset - 0.45, dist);
  color *= mix(1.0 - uVignetteDarkness, 1.0, vignette);

  // Ultra-subtle film grain (prevents color banding in dark gradients)
  float grain = (rand(uv + fract(uTime)) - 0.5) * 0.025;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
