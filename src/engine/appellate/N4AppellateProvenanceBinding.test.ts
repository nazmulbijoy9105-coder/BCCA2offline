import { describe, expect, it } from "vitest";
import {
  assertAppellateProvenance,
  getAppellateProvenance,
} from "./AppellateProvenanceResolver";

describe("N4-04 Appellate Provenance Binding", () => {
  it("binds an existing appellate rule to deterministic authority identity", () => {
    const result = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );

    expect(result).not.toBeNull();
    expect(result?.authorityId).toBe(
      "AUTH-APPELLATE-BD-APPEAL-FIRST-APPEAL-DJ",
    );
    expect(result?.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(result?.provenance.sourceId).toBe("CIVIL_PROCEDURE_CODE_1908");
    expect(result?.provenance.citation).toBe("ARTICLE_152");
  });

  it("binds appellate provenance to the canonical development authority registry identity", () => {
    const result = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );

    expect(result?.authorityRegistryIdentity).toEqual({
      authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
      authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
    });
  });

  it("keeps appellate authority registry identity deterministic and runtime-independent", () => {
    const first = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );
    const second = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
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

  it("preserves existing appellate metadata", () => {
    const result = getAppellateProvenance(
      "BD-APPEAL-SECOND-APPEAL-HCD",
    );

    expect(result?.ruleId).toBe("BD-APPEAL-SECOND-APPEAL-HCD");
    expect(result?.statute).toBe("CIVIL_PROCEDURE_CODE_1908");
    expect(result?.limitationArticle).toBe("ARTICLE_156");
    expect(result?.description).toContain("Second appeal");
  });

  it("returns null for an unknown appellate rule", () => {
    expect(
      getAppellateProvenance("UNKNOWN-APPELLATE-RULE"),
    ).toBeNull();
  });

  it("fails closed for an unknown appellate rule", () => {
    expect(() =>
      assertAppellateProvenance("UNKNOWN-APPELLATE-RULE"),
    ).toThrow(/Appellate Provenance Violation/);
  });

  it("does not claim production authority", () => {
    const result = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );

    expect(result?.authorityStatus).not.toBe("VALIDATED_PRODUCTION");
  });

  it("is deterministic across repeated resolution", () => {
    const first = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );
    const second = getAppellateProvenance(
      "BD-APPEAL-FIRST-APPEAL-DJ",
    );

    expect(first).toEqual(second);
  });
});
