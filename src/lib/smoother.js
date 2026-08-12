import { SMOOTHING_CONFIG } from './constants.js';

/**
 * One Euro Filter — adaptive low-pass filter.
 * Smooth when slow, responsive when fast.
 * Paper: http://cristal.univ-lille.fr/~casiez/1euro/
 */
class LowPassFilter {
  constructor(alpha) {
    this.alpha = alpha;
    this.initialized = false;
    this.raw = 0;
    this.filtered = 0;
  }

  filter(value) {
    if (!this.initialized) {
      this.initialized = true;
      this.raw = value;
      this.filtered = value;
      return value;
    }
    this.raw = value;
    this.filtered = this.alpha * value + (1 - this.alpha) * this.filtered;
    return this.filtered;
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  lastValue() {
    return this.filtered;
  }
}

class OneEuroFilter {
  constructor(freq, minCutoff, beta, dCutoff) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter(this._alpha(minCutoff));
    this.dxFilter = new LowPassFilter(this._alpha(dCutoff));
    this.lastTime = null;
  }

  _alpha(cutoff) {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value, timestamp) {
    if (this.lastTime !== null && timestamp > this.lastTime) {
      this.freq = 1.0 / (timestamp - this.lastTime);
    }
    this.lastTime = timestamp;

    const dValue = this.xFilter.initialized
      ? (value - this.xFilter.lastValue()) * this.freq
      : 0;

    const edValue = this.dxFilter.filter(dValue);
    const cutoff = this.minCutoff + this.beta * Math.abs(edValue);

    this.xFilter.setAlpha(this._alpha(cutoff));
    return this.xFilter.filter(value);
  }
}

/**
 * Manages One Euro Filters for all landmarks of all tracked persons.
 * Key: `${personId}-${landmarkIndex}-${axis}` → OneEuroFilter
 */
export class LandmarkSmoother {
  constructor() {
    this.filters = new Map();
  }

  /**
   * Smooths landmarks for a set of tracked persons.
   * Returns new array with smoothed positions.
   */
  smooth(trackedPersons, timestamp) {
    const ts = timestamp / 1000; // convert ms → seconds

    return trackedPersons.map((person) => {
      const smoothedLandmarks = person.landmarks.map((lm, i) => {
        if (!lm || lm.visibility < 0.3) return lm;

        const xKey = `${person.id}-${i}-x`;
        const yKey = `${person.id}-${i}-y`;
        const zKey = `${person.id}-${i}-z`;

        const xf = this._getFilter(xKey);
        const yf = this._getFilter(yKey);
        const zf = this._getFilter(zKey);

        return {
          x: xf.filter(lm.x, ts),
          y: yf.filter(lm.y, ts),
          z: zf.filter(lm.z || 0, ts),
          visibility: lm.visibility,
        };
      });

      return { ...person, landmarks: smoothedLandmarks };
    });
  }

  _getFilter(key) {
    if (!this.filters.has(key)) {
      this.filters.set(
        key,
        new OneEuroFilter(
          SMOOTHING_CONFIG.frequency,
          SMOOTHING_CONFIG.minCutoff,
          SMOOTHING_CONFIG.beta,
          SMOOTHING_CONFIG.dCutoff
        )
      );
    }
    return this.filters.get(key);
  }

  /** Remove filters for persons no longer tracked */
  prune(activeIds) {
    const activeSet = new Set(activeIds.map(String));
    for (const key of this.filters.keys()) {
      const personId = key.split('-')[0];
      if (!activeSet.has(personId)) {
        this.filters.delete(key);
      }
    }
  }

  reset() {
    this.filters.clear();
  }
}
