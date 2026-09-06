/**
 * P6-01: Legal Citation & Corpus Integrity Contracts.
 * 
 * Establishes the authoritative statute/source registry types.
 * No legal rule may reference a statute string that is not registered here.
 */

export type StatuteJurisdiction = "BANGLADESH" | "INDIA" | "PAKISTAN" | "UK" | "OTHER";

export type StatuteStatus = "IN_FORCE" | "REPEALED" | "AMENDED" | "SUSPENDED";

export type StatuteSource = {
  sourceId: string;
  statuteTitle: string;
  formalCitation: string;
  jurisdiction: StatuteJurisdiction;
  effectiveDate: string;
  status: StatuteStatus;
  // Provenance fields required for P6-01 forensic gate
  provenanceUrl?: string;
  officialGazetteRef?: string;
};

export type StatuteRegistry = {
  getStatutes(): readonly StatuteSource[];
  getStatuteById(sourceId: string): StatuteSource | null;
};
