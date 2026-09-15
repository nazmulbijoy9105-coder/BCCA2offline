import { describe, expect, it } from "vitest";
import {
  assertProceduralProvenance,
  getProceduralProvenance,
} from "./ProceduralProvenanceResolver";

describe("N4-04 Procedure Provenance Binding", () => {
  it("binds an existing procedure rule to deterministic authority identity", () => {
    const result = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );

    expect(result).not.toBeNull();
    expect(result?.authorityId).toBe(
      "AUTH-PROCEDURE-BD-PROC-SUIT-POSSESSION-SEC8",
    );
    expect(result?.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(result?.provenance.sourceId).toBe("SPECIFIC_RELIEF_ACT_1877");
    expect(result?.provenance.citation).toBe(
      "Court Fees Act 1870, Schedule II, Article 1(iii)",
    );
  });

  it("binds procedure provenance to the canonical development authority registry identity", () => {
    const result = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );

    expect(result?.authorityRegistryIdentity).toEqual({
      authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
      authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
    });
  });

  it("keeps procedure authority registry identity deterministic and runtime-independent", () => {
    const first = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );
    const second = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );

    expect(first?.authorityRegistryIdentity).toEqual(
      second?.authorityRegistryIdentity,
    );

    expect(
      Object.prototype.hasOwnProperty.call(
        first?.authorityRegistryIdentity ?? {},
        "timestamp",
      ),
    ).toBe(false);
  });

  it("preserves the existing procedure rule metadata", () => {
    const result = getProceduralProvenance(
      "BD-PROC-SUIT-DECLARATION-SEC42",
    );

    expect(result?.ruleId).toBe("BD-PROC-SUIT-DECLARATION-SEC42");
    expect(result?.statute).toBe("SPECIFIC_RELIEF_ACT_1877");
    expect(result?.actRef).toBe(
      "Court Fees Act 1870, Schedule II, Article 17(iii)",
    );
    expect(result?.description).toContain("Section 42");
  });

  it("returns null for an unknown procedure rule", () => {
    expect(
      getProceduralProvenance("UNKNOWN-PROCEDURE-RULE"),
    ).toBeNull();
  });

  it("fails closed for an unknown procedure rule", () => {
    expect(() =>
      assertProceduralProvenance("UNKNOWN-PROCEDURE-RULE"),
    ).toThrow(/Procedural Provenance Violation/);
  });

  it("does not claim production authority", () => {
    const result = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );

    expect(result?.authorityStatus).not.toBe("VALIDATED_PRODUCTION");
  });

  it("is deterministic across repeated resolution", () => {
    const first = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );
    const second = getProceduralProvenance(
      "BD-PROC-SUIT-POSSESSION-SEC8",
    );

    expect(first).toEqual(second);
  });
});
