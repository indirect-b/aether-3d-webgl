uniform sampler2D tDiffuse;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uVelocity;
uniform float uScrollVelocity;
uniform float uTime;
uniform float uAspect;

varying vec2 vUv;

// Simplex pseudo noise
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;

  // Aspect-corrected coordinate space for circular mouse ripple
  vec2 aspectUV = uv;
  aspectUV.x *= uAspect;
  vec2 mouseAspect = uMouse;
  mouseAspect.x *= uAspect;

  // Distance from current and previous mouse trail
  float distToMouse = length(aspectUV - mouseAspect);

  // Mouse fluid ripple: smooth wave crest radiating outwards
  float rippleRadius = 0.22;
  float rippleWave = sin(distToMouse * 38.0 - uTime * 6.0);
  float rippleFalloff = smoothstep(rippleRadius, 0.0, distToMouse);
  float rippleStrength = rippleWave * rippleFalloff * uVelocity * 0.035;

  // Direction vector pointing away from mouse
  vec2 rippleDir = normalize(aspectUV - mouseAspect + 0.0001);

  // Scroll fluid distortion: vertical waves along Y axis
  float scrollDistort = sin(uv.y * 14.0 + uTime * 3.0) * uScrollVelocity * 0.008;

  // Combined UV displacement
  vec2 offset = rippleDir * rippleStrength;
  offset.y += scrollDistort;

  // Chromatic dispersion during liquid ripple
  float chromOffset = (uVelocity * 0.008 + abs(uScrollVelocity) * 0.006) * rippleFalloff;

  float r = texture2D(tDiffuse, uv + offset + vec2(chromOffset, 0.0)).r;
  float g = texture2D(tDiffuse, uv + offset).g;
  float b = texture2D(tDiffuse, uv + offset - vec2(chromOffset, 0.0)).b;
  float a = texture2D(tDiffuse, uv + offset).a;

  gl_FragColor = vec4(r, g, b, a);
}
