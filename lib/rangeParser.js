// Deterministic reference-range parsing & status computation.
// Kept intentionally separate from any AI call: whether "10.2" falls outside
// "13-17" is arithmetic, not a judgment call the model should be trusted with.

/**
 * Parse a raw reference-range string like "13-17", "13 - 17 g/dL", "< 5",
 * ">= 40", "40-", "Negative" into a normalized { low, high, raw, kind }.
 * Returns null if it can't be parsed with confidence — callers should treat
 * that as "unknown", never guess.
 */
export function parseReferenceRange(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Simple "low-high" or "low - high"
  const dash = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[-–to]+\s*(-?\d+(?:\.\d+)?)/i);
  if (dash) {
    const low = parseFloat(dash[1]);
    const high = parseFloat(dash[2]);
    if (!Number.isNaN(low) && !Number.isNaN(high)) {
      return { low, high, raw: trimmed, kind: "range" };
    }
  }

  // "< 5", "≤ 5", "up to 5"
  const upper = trimmed.match(/^(?:<|≤|<=|up to)\s*(-?\d+(?:\.\d+)?)/i);
  if (upper) {
    const high = parseFloat(upper[1]);
    if (!Number.isNaN(high)) return { low: null, high, raw: trimmed, kind: "upper_bound" };
  }

  // "> 40", "≥ 40", "40 and above"
  const lower = trimmed.match(/^(?:>|≥|>=)\s*(-?\d+(?:\.\d+)?)/i);
  if (lower) {
    const low = parseFloat(lower[1]);
    if (!Number.isNaN(low)) return { low, high: null, raw: trimmed, kind: "lower_bound" };
  }

  // Non-numeric qualitative ranges (e.g. "Negative", "Non-reactive")
  if (/^(negative|non-?reactive|not detected|absent)$/i.test(trimmed)) {
    return { low: null, high: null, raw: trimmed, kind: "qualitative_negative" };
  }

  return null; // Unrecognized shape — better to say "unknown" than guess.
}

/**
 * Compute status ('low' | 'high' | 'normal' | 'unknown' | 'abnormal') for a
 * numeric or qualitative value against a parsed reference range.
 */
export function computeStatus(value, parsedRange) {
  if (!parsedRange) return "unknown";

  if (parsedRange.kind === "qualitative_negative") {
    if (typeof value !== "string") return "unknown";
    const v = value.trim().toLowerCase();
    if (["negative", "non-reactive", "not detected", "absent", "nil"].includes(v)) {
      return "normal";
    }
    if (["positive", "reactive", "detected", "present"].includes(v)) {
      return "abnormal";
    }
    return "unknown";
  }

  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return "unknown";

  const { low, high, kind } = parsedRange;

  if (kind === "range") {
    if (num < low) return "low";
    if (num > high) return "high";
    return "normal";
  }
  if (kind === "upper_bound") {
    return num > high ? "high" : "normal";
  }
  if (kind === "lower_bound") {
    return num < low ? "low" : "normal";
  }
  return "unknown";
}

/** How far outside range, as a fraction — used to prioritize the summary and
 * flag "critical" values (e.g. >50% outside range) without any AI judgment.
 */
export function severityFraction(value, parsedRange, status) {
  if (status !== "low" && status !== "high") return 0;
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num) || !parsedRange) return 0;
  const { low, high, kind } = parsedRange;
  if (kind === "range") {
    const span = high - low || 1;
    if (status === "low") return Math.min(1, (low - num) / span);
    return Math.min(1, (num - high) / span);
  }
  if (kind === "upper_bound" && status === "high") {
    return Math.min(1, (num - high) / (high || 1));
  }
  if (kind === "lower_bound" && status === "low") {
    return Math.min(1, (low - num) / (low || 1));
  }
  return 0;
}
