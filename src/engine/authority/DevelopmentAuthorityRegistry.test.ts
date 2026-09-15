import { describe, expect, it } from "vitest";
import { DevelopmentAuthorityRegistry } from "./DevelopmentAuthorityRegistry";
import { isProductionAuthority } from "./AuthorityRegistry";

describe("N4-02: Development Authority Registry", () => {
  it("exposes an explicit development authority status", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(isProductionAuthority(registry.authorityStatus)).toBe(false);
  });

  it("exposes deterministic development identity fields", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.identity.authorityRegistryVersion).toBe(
      "DEVELOPMENT-AUTHORITY-1.0.0",
    );
    expect(registry.identity.authorityRegistryDigest).toBe(
      "DEVELOPMENT-NOT-VERIFIED",
    );
  });

  it("resolves authorities by stable authority id", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const authority = registry.getAuthorityById(
      "AUTH-STATUTE-LIMITATION-ACT-1908",
    );

    expect(authority).not.toBeNull();
    expect(authority?.sourceId).toBe("LIMITATION_ACT_1908");
    expect(authority?.validationStatus).toBe("DEVELOPMENT_FIXTURE");
  });

  it("resolves authorities by canonical source id", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const authority = registry.getAuthorityBySourceId(
      "CIVIL_PROCEDURE_CODE_1908",
    );

    expect(authority).not.toBeNull();
    expect(authority?.authorityId).toBe("AUTH-STATUTE-CPC-1908");
  });

  it("fails closed for unresolved authorities", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.getAuthorityById("DOES-NOT-EXIST")).toBeNull();
    expect(
      registry.getAuthorityBySourceId("DOES-NOT-EXIST"),
    ).toBeNull();
  });

  it("does not expose runtime timestamps through authority identity", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(
      Object.prototype.hasOwnProperty.call(registry.identity, "timestamp"),
    ).toBe(false);

    expect(
      Object.prototype.hasOwnProperty.call(
        registry.identity,
        "auditTimestamp",
      ),
    ).toBe(false);
  });

  it("marks every development authority as a development fixture", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.getAuthorities().length).toBeGreaterThan(0);

    for (const authority of registry.getAuthorities()) {
      expect(authority.validationStatus).toBe("DEVELOPMENT_FIXTURE");
    }
  });

  it("does not invent authorities absent from the canonical statute registry", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(
      registry.getAuthorityBySourceId("SPECIFIC_RELIEF_ACT_1877"),
    ).toBeNull();

    expect(
      registry.getAuthorityBySourceId("COURT_FEES_ACT_1870"),
    ).toBeNull();
  });
});
