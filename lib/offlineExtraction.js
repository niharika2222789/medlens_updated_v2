// Pattern-matching fallback extractor. Used automatically whenever the
// Anthropic API call fails for any reason (no key configured, insufficient
// balance, rate limit, network issue) so the app keeps working end-to-end in
// a judging/demo environment without a live key. It is deliberately simpler
// and less capable than the AI extractor, and every record produced this way
// is tagged mode: "offline" so the UI can show a clear banner about it.

const LINE_PATTERN =
  /^([A-Za-z][A-Za-z0-9 /()%.\-]{1,40}?)[\s:]{1,3}([<>]?\s?-?\d+(?:\.\d+)?)\s*([A-Za-z/%µμ]{0,10})?\s*(?:\(|\[)?\s*(?:ref(?:erence)?(?:\s*range)?[:\s]*)?([\d.\-–\stoTO<>≤≥=]+)?\)?\]?\s*$/;

export function offlineExtract(reportText) {
  const lines = (reportText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parameters = [];

  for (const line of lines) {
    const match = line.match(LINE_PATTERN);
    if (!match) continue;
    const [, rawParam, rawValue, unit, rawRange] = match;

    // Skip lines that are obviously headers/labels, not data rows.
    if (/^(name|age|sex|gender|patient|date|report|lab|doctor|address)\b/i.test(rawParam)) {
      continue;
    }
    if (!/\d/.test(rawValue)) continue;

    parameters.push({
      parameter: rawParam.trim(),
      value: rawValue.trim(),
      unit: unit ? unit.trim() : null,
      referenceRangeRaw: rawRange ? rawRange.trim() : null,
      confidence: rawRange ? "medium" : "low",
      rawSnippet: line,
    });
  }

  return {
    parameters,
    reportMeta: { reportDateRaw: null, labNameRaw: null },
    mode: "offline",
  };
}
