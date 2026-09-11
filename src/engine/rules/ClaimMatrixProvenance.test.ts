import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_CLAIM_REGISTRY,
  ENTERPRISE_CLAIM_REGISTRY_HASH,
} from "./EnterpriseClaimMatrix";
import {
  assertClaimDefinitionHash,
  assertClaimDefinitionProvenance,
  calculateClaimDefinitionHash,
  calculateClaimRegistryHash,
  type ProvenancedEnterpriseClaimDefinition,
} from "./ClaimMatrixProvenance";

describe("Enterprise Claim Matrix provenance integrity", () => {
  it("contains provenance for every claim definition", () => {
    expect(ENTERPRISE_CLAIM_REGISTRY).toHaveLength(5);

    for (const definition of ENTERPRISE_CLAIM_REGISTRY) {
      expect(definition.provenance.authorities.length).toBeGreaterThan(0);

      for (const authority of definition.provenance.authorities) {
        expect(authority.authorityId).toBeTruthy();
        expect(authority.act).toBeTruthy();
        expect(authority.section).toBeTruthy();
        expect(authority.sourceId).toBeTruthy();
        expect(authority.validationStatus).toBe("SOURCE_VERIFIED");
      }
    }
  });

  it("does not falsely mark the current matrix as production approved", () => {
    for (const definition of ENTERPRISE_CLAIM_REGISTRY) {
      expect(definition.provenance.validation.scoped).toBe(true);
      expect(definition.provenance.validation.authoritative).toBe(false);
      expect(definition.provenance.validation.legallyValidated).toBe(false);
      expect(definition.provenance.validation.independentlyValidated).toBe(false);
      expect(definition.provenance.validation.productionApproved).toBe(false);
    }
  });

  it("stores a valid deterministic hash for every claim definition", () => {
    for (const definition of ENTERPRISE_CLAIM_REGISTRY) {
      expect(definition.definitionHash).toMatch(/^[A-Fa-f0-9]+$/);
      expect(() =>
        assertClaimDefinitionHash(definition),
      ).not.toThrow();
    }
  });

  it("produces the same definition hash when calculated repeatedly", () => {
    for (const definition of ENTERPRISE_CLAIM_REGISTRY) {
      const first = calculateClaimDefinitionHash(definition);
      const second = calculateClaimDefinitionHash(definition);

      expect(first).toBe(second);
      expect(first).toBe(definition.definitionHash);
    }
  });

  it("detects tampering with a claim definition", () => {
    const original = ENTERPRISE_CLAIM_REGISTRY[0];

    const tampered: ProvenancedEnterpriseClaimDefinition = {
      ...original,
      claimName: `${original.claimName} TAMPERED`,
    };

    expect(() => assertClaimDefinitionHash(tampered)).toThrow(
      "Claim Matrix Definition Hash Mismatch",
    );
  });

  it("produces the exported registry hash deterministically", () => {
    const calculated = calculateClaimRegistryHash(ENTERPRISE_CLAIM_REGISTRY);

    expect(calculated).toBe(ENTERPRISE_CLAIM_REGISTRY_HASH);
    expect(calculated).toMatch(/^[A-Fa-f0-9]+$/);
  });

  it("detects incomplete authority provenance", () => {
    const original = ENTERPRISE_CLAIM_REGISTRY[0];

    const invalid: ProvenancedEnterpriseClaimDefinition = {
      ...original,
      provenance: {
        ...original.provenance,
        authorities: [
          {
            ...original.provenance.authorities[0],
            sourceId: "",
          },
        ],
      },
    };

    expect(() => assertClaimDefinitionProvenance(invalid)).toThrow(
      "incomplete authority provenance",
    );
  });

  it("rejects production approval without prerequisite validation states", () => {
    const original = ENTERPRISE_CLAIM_REGISTRY[0];

    const invalid: ProvenancedEnterpriseClaimDefinition = {
      ...original,
      provenance: {
        ...original.provenance,
        validation: {
          ...original.provenance.validation,
          productionApproved: true,
          independentlyValidated: false,
        },
      },
    };

    expect(() => assertClaimDefinitionProvenance(invalid)).toThrow(
      "cannot be production approved",
    );
  });
});
