import { newId } from "./id";
import { canonicalizeParameter } from "./parameterAliases";
import { parseReferenceRange, computeStatus, severityFraction } from "./rangeParser";

export function buildStructuredRecord(rawParameters) {
  return (rawParameters || []).map((p) => {
    const { canonical, wasAliased } = canonicalizeParameter(p.parameter);
    const parsedRange = parseReferenceRange(p.referenceRangeRaw);
    const status = computeStatus(p.value, parsedRange);
    const severity = severityFraction(p.value, parsedRange, status);
    return {
      id: newId("param"),
      parameter: p.parameter,
      canonicalParameter: canonical,
      aliasApplied: wasAliased,
      value: p.value,
      unit: p.unit || null,
      referenceRange: parsedRange,
      status,
      severity,
      confidence: p.confidence || "medium",
      source: "ai_extracted",
      rawSnippet: p.rawSnippet || "",
    };
  });
}
