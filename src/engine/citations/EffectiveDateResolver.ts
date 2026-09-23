import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";
import { getArticleMetadata } from "./LimitationArticleMapper";
import { isISODateString } from "../../utils/isoDate";

/**
 * P6-05: Effective Date Resolver.
 *
 * Parses the authoritative corpus to extract explicit ISO effective dates
 * for the Act and its amended articles (e.g., Article 113 -> 2005-07-01).
 */
export function getActEffectiveDate(): string {
  // Act No. IX of 1908 (assent: 7 August 1908). By s.1(2), ss.1 & 31 came
  // into force at once; the remainder of the Act — including s.3 and the
  // First Schedule — came into force on 1 January 1909. For limitation
  // computation the operative baseline is the Schedule commencement:
  // 1909-01-01. (Previously returned 1908-01-01 via a circular reference
  // to the registry's own temporal versions — corrected P4-04 Batch 1.)
  return "1909-01-01";
}

/**
 * Extracts the explicit effective date of an amendment for a specific article.
 * E.g., Article 113 will return "2005-07-01" based on the 2004 Amendment note.
 */
export function getArticleEffectiveDate(articleNumber: string | number): string | null {
  const meta = getArticleMetadata(articleNumber);
  if (!meta || !meta.note) {
    return null;
  }

  // Match patterns like "01-07-2005" (DD-MM-YYYY) or "2005-07-01" (YYYY-MM-DD)
  const dateMatch = meta.note.match(/(\d{2})-(\d{2})-(\d{4})|(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) {
    return null;
  }

  // If it matched DD-MM-YYYY, convert to YYYY-MM-DD
  let resolved: string | null = null;
  if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
    resolved = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  } else if (dateMatch[0]) {
    // Already YYYY-MM-DD
    resolved = dateMatch[0];
  }

  // Fail-closed: a shape-matching but calendar-invalid date is rejected.
  return resolved !== null && isISODateString(resolved) ? resolved : null;
}
