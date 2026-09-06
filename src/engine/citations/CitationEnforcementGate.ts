import { getArticleMetadata } from "./LimitationArticleMapper";
import { isArticleAmended, getArticleAmendmentNote } from "./AmendmentTracker";
import { getArticleEffectiveDate } from "./EffectiveDateResolver";
import { getStatuteProvenance, ProvenanceRecord } from "./SourceProvenanceResolver";
import { isArticleObsolete, getObsoleteReason } from "./ObsoleteLawProtector";

/**
 * P6-08: Citation Enforcement Gate.
 * 
 * Single source of truth for validating and compiling a legal citation.
 * Fails closed (returns null) if the article is obsolete or not found,
 * allowing the engine to gracefully degrade to INDETERMINATE.
 */

export type ValidatedCitation = {
  articleNumber: string;
  description: string;
  period: string;
  accrualTrigger: string;
  isAmended: boolean;
  amendmentNote: string | null;
  effectiveDate: string | null;
  provenance: ProvenanceRecord | null;
};

export function enforceAndGetValidatedCitation(articleNumber: string | number): ValidatedCitation | null {
  // 1. Fail closed if the article is obsolete/repealed
  if (isArticleObsolete(articleNumber)) {
    const reason = getObsoleteReason(articleNumber);
    console.error(`Citation Gate: Attempted to apply obsolete Article ${articleNumber}. Reason: ${reason}`);
    return null; 
  }
  
  const meta = getArticleMetadata(articleNumber);

  // 2. Fail closed if the article doesn't exist in the corpus
  if (!meta) {
    return null;
  }

  // 3. Compile deterministic metadata from P6 utilities
  return {
    articleNumber: meta.a,
    description: meta.d,
    period: meta.p,
    accrualTrigger: meta.s,
    isAmended: isArticleAmended(articleNumber),
    amendmentNote: getArticleAmendmentNote(articleNumber),
    effectiveDate: getArticleEffectiveDate(articleNumber),
    provenance: getStatuteProvenance("LIMITATION_ACT_1908"), 
  };
}
