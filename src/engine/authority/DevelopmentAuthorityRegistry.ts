import type {
  AuthorityRecord,
  AuthorityRegistry,
} from "./AuthorityRegistry";

const DEVELOPMENT_AUTHORITIES: readonly AuthorityRecord[] = [
  {
    authorityId: "AUTH-STATUTE-LIMITATION-ACT-1908",
    kind: "STATUTE",
    actOrStatute: "The Limitation Act, 1908",
    sourceId: "LIMITATION_ACT_1908",
    citation: "Act No. IX of 1908",
    provenance: {
      sourceId: "LIMITATION_ACT_1908",
      citation: "Act No. IX of 1908",
      provenanceUrl: "http://bdlaws.minlaw.gov.bd/act-329.html",
      officialGazetteRef: "Gazette of India, 1908",
    },
    validationStatus: "DEVELOPMENT_FIXTURE",
  },
  {
    authorityId: "AUTH-STATUTE-CPC-1908",
    kind: "STATUTE",
    actOrStatute: "The Code of Civil Procedure, 1908",
    sourceId: "CIVIL_PROCEDURE_CODE_1908",
    citation: "Act No. V of 1908",
    provenance: {
      sourceId: "CIVIL_PROCEDURE_CODE_1908",
      citation: "Act No. V of 1908",
      provenanceUrl: "http://bdlaws.minlaw.gov.bd/act-367.html",
    },
    validationStatus: "DEVELOPMENT_FIXTURE",
  },

];

export class DevelopmentAuthorityRegistry implements AuthorityRegistry {
  readonly identity = {
    authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
    authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
  } as const;

  readonly authorityStatus = "DEVELOPMENT_FIXTURE" as const;

  getAuthorities(): readonly AuthorityRecord[] {
    return DEVELOPMENT_AUTHORITIES;
  }

  getAuthorityById(authorityId: string): AuthorityRecord | null {
    return (
      DEVELOPMENT_AUTHORITIES.find(
        (authority) => authority.authorityId === authorityId,
      ) ?? null
    );
  }

  getAuthorityBySourceId(sourceId: string): AuthorityRecord | null {
    return (
      DEVELOPMENT_AUTHORITIES.find(
        (authority) => authority.sourceId === sourceId,
      ) ?? null
    );
  }
}
