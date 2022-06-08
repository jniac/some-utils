export const glsl_easings = /* glsl */`

  float clamp01(float x) {
    return x < 0.0 ? 0.0 : x > 1.0 ? 1.0 : x;
  }

  float easeIn1 (float x) {
    x = clamp01(x);
    return x;
  }
  float easeIn2 (float x) {
    x = clamp01(x);
    return x * x;
  }
  float easeIn3 (float x) {
    x = clamp01(x);
    return x * x * x;
  }
  float easeIn4 (float x) {
    x = clamp01(x);
    return x * x * x * x;
  }
  float easeIn5 (float x) {
    x = clamp01(x);
    return x * x * x * x * x;
  }
  float easeIn6 (float x) {
    x = clamp01(x);
    return x * x * x * x * x * x;
  }

  float easeOut1 (float x) {
    x = clamp01(x);
    return x;
  }
  float easeOut2 (float x) {
    x = clamp01(x);
    return 1.0 - (x = 1.0 - x) * x;
  }
  float easeOut3 (float x) {
    x = clamp01(x);
    return 1.0 - (x = 1.0 - x) * x * x;
  }
  float easeOut4 (float x) {
    x = clamp01(x);
    return 1.0 - (x = 1.0 - x) * x * x * x;
  }
  float easeOut5 (float x) {
    x = clamp01(x);
    return 1.0 - (x = 1.0 - x) * x * x * x * x;
  }
  float easeOut6 (float x) {
    x = clamp01(x);
    return 1.0 - (x = 1.0 - x) * x * x * x * x * x;
  }

  float easeInout1 (float x) {
    x = clamp01(x);
    return x;
  }
  float easeInout2 (float x) {
    x = clamp01(x);
    return x < 0.5 ? 2.0 * x * x : 1.0 - 2.0 * (x = 1.0 - x) * x;
  }
  float easeInout3 (float x) {
    x = clamp01(x);
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - 4.0 * (x = 1.0 - x) * x * x;
  }
  float easeInout4 (float x) {
    x = clamp01(x);
    return x < 0.5 ? 8.0 * x * x * x * x : 1.0 - 8.0 * (x = 1.0 - x) * x * x * x;
  }
  float easeInout5 (float x) {
    x = clamp01(x);
    return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - 16.0 * (x = 1.0 - x) * x * x * x * x;
  }
  float easeInout6 (float x) {
    x = clamp01(x);
    return x < 0.5 ? 32.0 * x * x * x * x * x * x : 1.0 - 32.0 * (x = 1.0 - x) * x * x * x * x * x;
  }

`