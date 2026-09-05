import { enforceAndGetValidatedCitation } from "./CitationEnforcementGate";
import { getCorpusVersion } from "./CorpusVersionLock";
import { getCorpusHash } from "./CorpusHasher";

/**
 * P6-13: Audit Trail Generation.
 * 
 * Generates a verifiable audit trail for any legal citation applied by the engine.
 * Bundles the validated citation with the exact corpus version and hash,
 * ensuring that every legal decision can be independently audited.
 */

export type CitationAuditRecord = {
  timestamp: string;
  corpusVersion: string;
  corpusHash: string;
  citation: ReturnType<typeof enforceAndGetValidatedCitation>;
};

export function generateCitationAuditTrail(articleNumber: string | number): CitationAuditRecord | null {
  const citation = enforceAndGetValidatedCitation(articleNumber);
  
  // Fail closed if the citation is invalid
  if (!citation) {
    return null;
  }

  return {
    timestamp: new Date().toISOString(),
    corpusVersion: getCorpusVersion(),
    corpusHash: getCorpusHash(),
    citation,
  };
}
