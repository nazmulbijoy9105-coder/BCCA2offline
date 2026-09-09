/**
 * P7-09: Evidence Redaction.
 * 
 * Ensures that Personally Identifiable Information (PII) such as NIDs, 
 * phone numbers, or emails are masked before being logged or sent to an LLM.
 */

const NID_PATTERN = /\b(?:\d{10}|\d{13}|\d{17})\b/g;
const PHONE_PATTERN = /(\+?880|0)?1[3-9]\d{8}\b/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Redacts sensitive PII from a text segment.
 * Replaces matches with [REDACTED].
 */
export function redactPii(text: string): string {
  if (!text) return text;
  
  return text
    .replace(NID_PATTERN, "[REDACTED_NID]")
    .replace(PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
}

/**
 * Redacts PII from an array of facts' segments.
 */
export function redactFactSegments<T extends { source?: { segment?: string } }>(facts: readonly T[]): readonly T[] {
  return facts.map(fact => {
    if (!fact.source || !fact.source.segment) return fact;
    return {
      ...fact,
      source: {
        ...fact.source,
        segment: redactPii(fact.source.segment)
      }
    };
  });
}
