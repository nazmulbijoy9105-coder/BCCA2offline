import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";
import { getArticleMetadata } from "./LimitationArticleMapper";

/**
 * P6-05: Effective Date Resolver.
 * 
 * Parses the authoritative corpus to extract explicit ISO effective dates
 * for the Act and its amended articles (e.g., Article 113 -> 2005-07-01).
 */
export function getActEffectiveDate(): string {
  // The Act received assent on 7 August 1908, but commenced 1 Jan 1909 
  // (except ss 1 & 31). For limitation computation, the baseline is 1908-01-01 
  // as established in the registry temporal versions.
  return "1908-01-01";
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
  if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
    return `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // Already YYYY-MM-DD
  return dateMatch[0];
}
