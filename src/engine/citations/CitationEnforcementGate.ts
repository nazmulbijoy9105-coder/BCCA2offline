import { getArticleMetadata } from "./LimitationArticleMapper";
import { isArticleAmended, getArticleAmendmentNote } from "./AmendmentTracker";
import { getArticleEffectiveDate } from "./EffectiveDateResolver";
import { getStatuteProvenance, ProvenanceRecord } from "./SourceProvenanceResolver";
import { assertArticleNotObsolete } from "./ObsoleteLawProtector";

/**
 * P6-08: Citation Enforcement Gate.
 * 
 * Single source of truth for validating and compiling a legal citation.
 * Any engine module requesting article metadata must pass through this gate.
 * Fails closed if the article is obsolete or not found in the authoritative corpus.
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
  // 1. Hard fail-closed if the article is obsolete/repealed
  assertArticleNotObsolete(articleNumber);
  
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
    // Hardcoded to LIMITATION_ACT_1908 as it's the only corpus currently mapped
    provenance: getStatuteProvenance("LIMITATION_ACT_1908"), 
  };
}
