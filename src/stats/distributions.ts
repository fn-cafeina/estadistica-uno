const EPS = 1e-14;
const FPMIN = 1e-300;
const MAX_ITERATIONS = 1000;

const LANCZOS_COEFFICIENTS = [
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
];

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.min(1, Math.max(0, value));
}

export function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  const shifted = z - 1;
  let series = 0.9999999999998099;
  for (let index = 0; index < LANCZOS_COEFFICIENTS.length; index += 1) {
    series += (LANCZOS_COEFFICIENTS[index] ?? 0) / (shifted + index + 1);
  }
  const t = shifted + LANCZOS_COEFFICIENTS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(series);
}

function gammaSeries(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let term = sum;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
    ap += 1;
    term *= x / ap;
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * EPS) break;
  }

  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / Math.max(Math.abs(b), FPMIN) * Math.sign(b || 1);
  let h = d;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
    const an = -iteration * (iteration - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

export function regularizedGammaP(a: number, x: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(x) || a <= 0 || x < 0) return Number.NaN;
  if (x === 0) return 0;
  if (x < a + 1) return clampProbability(gammaSeries(a, x));
  return clampProbability(1 - gammaContinuedFraction(a, x));
}

export function regularizedGammaQ(a: number, x: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(x) || a <= 0 || x < 0) return Number.NaN;
  if (x === 0) return 1;
  if (x < a + 1) return clampProbability(1 - gammaSeries(a, x));
  return clampProbability(gammaContinuedFraction(a, x));
}

export function chiSquarePValue(statistic: number, degreesOfFreedom: number): number {
  if (!Number.isFinite(statistic) || !Number.isFinite(degreesOfFreedom)) return Number.NaN;
  if (degreesOfFreedom <= 0 || statistic < 0) return Number.NaN;
  if (statistic === 0) return 1;
  return clampProbability(regularizedGammaQ(degreesOfFreedom / 2, statistic / 2));
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
    const m2 = 2 * iteration;
    let aa = (iteration * (b - iteration) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + iteration) * (qab + iteration) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < EPS) break;
  }

  return h;
}

export function regularizedBeta(a: number, b: number, x: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0 || x < 0 || x > 1) {
    return Number.NaN;
  }
  if (x === 0) return 0;
  if (x === 1) return 1;

  const beta = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );

  if (x < (a + 1) / (a + b + 2)) {
    return clampProbability((beta * betaContinuedFraction(a, b, x)) / a);
  }

  return clampProbability(1 - (beta * betaContinuedFraction(b, a, 1 - x)) / b);
}

export function tTwoSidedPValue(t: number, degreesOfFreedom: number): number {
  if (!Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0 || Number.isNaN(t)) {
    return Number.NaN;
  }
  if (!Number.isFinite(t)) return 0;
  if (t === 0) return 1;
  const x = degreesOfFreedom / (degreesOfFreedom + t * t);
  return clampProbability(regularizedBeta(degreesOfFreedom / 2, 0.5, x));
}
