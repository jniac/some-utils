import { generics } from './tools/generics'

export const glsl_utils = /* glsl */`

  float clamp01(float x) {
    return x < 0.0 ? 0.0 : x > 1.0 ? 1.0 : x;
  }

  float sin01(float x) {
    return 0.5 + 0.5 * sin(x * 6.283185307179586);
  }

  vec2 scaleAround(vec2 p, vec2 c, float s) {
    return c + (p - c) / s;
  }

  float inverseLerpUnclamped(float a, float b, float x) {
    return (x - a) / (b - a);
  }

  float inverseLerp(float a, float b, float x) {
    return clamp01((x - a) / (b - a));
  }

  // Same as "inverseLerp", but here for backward compatibility.
  float inverseLerpClamped(float a, float b, float x) {
    return clamp01((x - a) / (b - a));
  }

  vec2 rotate(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    float x = c * p.x + s * p.y;
    float y = -s * p.x + c * p.y;
    return vec2(x, y);
  }

  vec2 rotateAround(vec2 p, float a, vec2 c) {
    return c + rotate(p - c, a);
  }

  vec2 rotateScaleAround(vec2 p, float a, float s, vec2 c) {
    return c + rotate((p - c) / s, a);
  }
  
  float positiveModulo(float x) {
    x = mod(x, 1.0);
    return x < 0.0 ? x + 1.0 : x;
  }

  float positiveModulo(float x, float modulo) {
    x = mod(x, modulo);
    return x < 0.0 ? x + modulo : x;
  }

  // Limit a value to a maximum that the function tends to reach when x -> ∞
  // https://www.desmos.com/calculator/0vewkbnscu
  float limited(float x, float maxValue) {
    return x <= 0.0 ? x : maxValue * x / (maxValue + x);
  }

  // https://www.desmos.com/calculator/0vewkbnscu
  float limited(float x, float minValue, float maxValue) {
    float d = maxValue - minValue;
    float xd = x - minValue;
    return x <= minValue ? x : minValue + d * xd / (d + xd);
  }

  float sqLength(in vec2 p) {
    return p.x * p.x + p.y * p.y;
  }

  float sqLength(in vec3 p) {
    return p.x * p.x + p.y * p.y + p.z * p.z;
  }

  ${generics('vecX', /* glsl */`
    T min3(in T a, in T b, in T c) {
      return min(min(a, b), c);
    }
  `)}

  ${generics('vecX', /* glsl */`
    T min4(in T a, in T b, in T c, in T d) {
      return min(min(a, b), min(c, d));
    }
  `)}
`