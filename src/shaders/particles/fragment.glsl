varying float vDistToMouse;
varying float vNoiseFactor;
varying vec3  vColor;

void main() {
  // Soft circular point sprite
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);

  // Discard outside circle
  if (d > 0.5) discard;

  // Soft glow falloff — exponential + linear blend
  float glow = exp(-d * 6.0) * 0.6 + smoothstep(0.5, 0.0, d) * 0.4;

  // Boost glow near mouse
  glow *= 1.0 + vDistToMouse * 2.0;

  // Core brightness at center
  float core = exp(-d * 14.0) * 0.5;

  // Compose final color
  vec3 color = vColor * glow + vec3(1.0) * core;

  // Opacity: glow-based with noise shimmer
  float alpha = glow * (0.5 + vNoiseFactor * 0.5);
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
