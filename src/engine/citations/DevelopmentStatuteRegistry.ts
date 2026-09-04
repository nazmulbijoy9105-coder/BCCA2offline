import type {
  StatuteRegistry,
  StatuteSource,
} from "./StatuteContracts";

/**
 * Development Statute Registry.
 * P6-01: Authoritative source of truth for all statutory references.
 */
const STATUTE_CORPUS: readonly StatuteSource[] = [
  {
    sourceId: "LIMITATION_ACT_1908",
    statuteTitle: "The Limitation Act, 1908",
    formalCitation: "Act No. IX of 1908",
    jurisdiction: "BANGLADESH",
    effectiveDate: "1908-01-01",
    status: "IN_FORCE",
    provenanceUrl: "http://bdlaws.minlaw.gov.bd/act-329.html",
    officialGazetteRef: "Gazette of India, 1908",
  },
  {
    sourceId: "CIVIL_PROCEDURE_CODE_1908",
    statuteTitle: "The Code of Civil Procedure, 1908",
    formalCitation: "Act No. V of 1908",
    jurisdiction: "BANGLADESH",
    effectiveDate: "1909-01-01",
    status: "IN_FORCE",
    provenanceUrl: "http://bdlaws.minlaw.gov.bd/act-367.html",
  },
];

export class DevelopmentStatuteRegistry implements StatuteRegistry {
  getStatutes(): readonly StatuteSource[] {
    return STATUTE_CORPUS;
  }

  getStatuteById(sourceId: string): StatuteSource | null {
    return STATUTE_CORPUS.find((s) => s.sourceId === sourceId) ?? null;
  }
}
