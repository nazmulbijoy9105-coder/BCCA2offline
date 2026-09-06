import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";
import { getArticleMetadata } from "./LimitationArticleMapper";

/**
 * P6-04: Statutory Amendment & Version Control Tracker.
 * 
 * Provides deterministic access to the amendment history of the Limitation Act 1908.
 * Allows the engine to audit and prove why a specific temporal version applies.
 */

export function getActAmendmentHistory(): readonly string[] {
  return LIMITATION_ACT_1908_CORPUS.metadata.amendments;
}

/**
 * Returns the specific amendment note for a given article, if any.
 * E.g., Article 113 will return the note regarding the 2004 Amendment (1-year change).
 */
export function getArticleAmendmentNote(articleNumber: string | number): string | null {
  const meta = getArticleMetadata(articleNumber);
  if (!meta || !meta.note) {
    return null;
  }
  return meta.note;
}

/**
 * Checks if a specific article's limitation period was altered by an amendment.
 */
export function isArticleAmended(articleNumber: string | number): boolean {
  return getArticleAmendmentNote(articleNumber) !== null;
}
