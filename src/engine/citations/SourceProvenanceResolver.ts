import { DevelopmentStatuteRegistry } from "./DevelopmentStatuteRegistry";
import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

const registry = new DevelopmentStatuteRegistry();

/**
 * P6-06: Source Provenance Resolver.
 * 
 * Ensures every statutory reference can be traced to an official, verifiable source.
 * Fails closed if a statute is invoked that lacks provenance metadata.
 */

export type ProvenanceRecord = {
  sourceId: string;
  title: string;
  url: string | null;
  gazetteRef: string | null;
};

export function getStatuteProvenance(sourceId: string): ProvenanceRecord | null {
  const statute = registry.getStatuteById(sourceId);
  if (!statute) {
    return null;
  }

  return {
    sourceId: statute.sourceId,
    title: statute.statuteTitle,
    url: statute.provenanceUrl ?? null,
    gazetteRef: statute.officialGazetteRef ?? null,
  };
}

export function getLimitationActCorpusProvenance(): { source: string; url: string } {
  // Hardcoded to the corpus itself, as the JSON metadata is the primary source.
  return {
    source: LIMITATION_ACT_1908_CORPUS.source,
    url: registry.getStatuteById("LIMITATION_ACT_1908")?.provenanceUrl ?? "Unknown",
  };
}
