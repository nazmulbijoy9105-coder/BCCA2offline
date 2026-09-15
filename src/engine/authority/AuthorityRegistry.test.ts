import { describe, expect, it } from "vitest";
import {
  isProductionAuthority,
  type AuthorityRegistry,
  type AuthorityRecord,
} from "./AuthorityRegistry";

const developmentAuthority: AuthorityRecord = {
  authorityId: "AUTH-LIMITATION-ACT-1908",
  kind: "STATUTE",
  actOrStatute: "The Limitation Act, 1908",
  sectionOrRule: "113",
  sourceId: "LIMITATION_ACT_1908",
  citation: "The Limitation Act, 1908, Article 113",
  provenance: {
    sourceId: "LIMITATION_ACT_1908",
    citation: "Act No. IX of 1908",
  },
  validationStatus: "DEVELOPMENT_FIXTURE",
};

const developmentRegistry: AuthorityRegistry = {
  identity: {
    authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
    authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
  },
  authorityStatus: "DEVELOPMENT_FIXTURE",
  getAuthorities: () => [developmentAuthority],
  getAuthorityById: (authorityId) =>
    developmentAuthority.authorityId === authorityId
      ? developmentAuthority
      : null,
  getAuthorityBySourceId: (sourceId) =>
    developmentAuthority.sourceId === sourceId
      ? developmentAuthority
      : null,
};

describe("N4-01: Canonical Authority Registry Contract", () => {
  it("represents authority provenance explicitly", () => {
    const authority = developmentRegistry.getAuthorityById(
      "AUTH-LIMITATION-ACT-1908",
    );

    expect(authority).not.toBeNull();
    expect(authority?.sourceId).toBe("LIMITATION_ACT_1908");
    expect(authority?.provenance.sourceId).toBe("LIMITATION_ACT_1908");
    expect(authority?.citation).toContain("Article 113");
  });

  it("explicitly identifies development authority", () => {
    expect(developmentRegistry.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(
      developmentRegistry.identity.authorityRegistryVersion,
    ).toBe("DEVELOPMENT-AUTHORITY-1.0.0");
  });

  it("does not treat development authority as production authority", () => {
    expect(isProductionAuthority("DEVELOPMENT_FIXTURE")).toBe(false);
    expect(isProductionAuthority("SOURCE_VERIFIED")).toBe(false);
    expect(isProductionAuthority("LEGALLY_VALIDATED")).toBe(false);
    expect(isProductionAuthority("INDEPENDENTLY_VALIDATED")).toBe(false);
  });

  it("recognizes only VALIDATED_PRODUCTION as production authority", () => {
    expect(isProductionAuthority("VALIDATED_PRODUCTION")).toBe(true);
  });

  it("provides deterministic identity fields", () => {
    expect(
      developmentRegistry.identity.authorityRegistryVersion,
    ).toBeTruthy();

    expect(
      developmentRegistry.identity.authorityRegistryDigest,
    ).toBeTruthy();
  });

  it("does not include an audit timestamp in authority identity", () => {
    expect(
      Object.keys(developmentRegistry.identity),
    ).not.toContain("timestamp");

    expect(
      Object.keys(developmentRegistry.identity),
    ).not.toContain("auditTimestamp");
  });

  it("fails closed when an authority cannot be resolved", () => {
    expect(
      developmentRegistry.getAuthorityById("UNKNOWN-AUTHORITY"),
    ).toBeNull();

    expect(
      developmentRegistry.getAuthorityBySourceId("UNKNOWN-SOURCE"),
    ).toBeNull();
  });
});
