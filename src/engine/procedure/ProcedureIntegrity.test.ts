import { describe, expect, it } from "vitest";

import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";
import {
  assertProcedureIntegrity,
  verifyProcedureIntegrity,
} from "./ProcedureIntegrityVerifier";
import {
  assertProcedureRegistryVersion,
  getProcedureRegistryVersion,
} from "./ProcedureVersionLock";
import {
  assertProcedureCorpusHash,
  getProcedureCorpusHash,
} from "./ProcedureCorpusHasher";
import { evaluateJurisdiction } from "./JurisdictionEvaluator";
import { calculateCourtFee } from "./CourtFeeCalculator";
import { checkMaintainability } from "./MaintainabilityChecker";
import { checkFilingRequirements } from "./FilingRequirementsChecker";
import { validateReliefForSuitType } from "./ReliefValidator";
import { verifyProceduralLimitationInteraction } from "./ProceduralLimitationInteraction";
import { generateProceduralAuditTrail } from "./ProceduralAuditTrail";
import { enforceProceduralRules } from "./ProceduralEnforcementGate";

describe("P8 Procedure Integrity", () => {
  it("identifies the registry as a development fixture", () => {
    const registry = new DevelopmentProcedureRegistry();

    expect(registry.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(registry.registryVersion).toBeTruthy();
  });

  it("passes structural integrity without claiming legal authority", () => {
    expect(verifyProcedureIntegrity()).toEqual({
      isValid: true,
      errors: [],
    });

    expect(() => assertProcedureIntegrity()).not.toThrow();
  });

  it("locks the registry version to the registry metadata", () => {
    const version = getProcedureRegistryVersion();

    expect(version).toBe("1.0");
    expect(() => assertProcedureRegistryVersion(version)).not.toThrow();
    expect(() =>
      assertProcedureRegistryVersion("incorrect-version"),
    ).toThrow(/Procedure Registry Version Mismatch/);
  });

  it("produces a deterministic browser-safe corpus hash", () => {
    const first = getProcedureCorpusHash();
    const second = getProcedureCorpusHash();

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
    expect(() => assertProcedureCorpusHash(first)).not.toThrow();
  });

  it("fails closed for jurisdiction", () => {
    const result = evaluateJurisdiction(
      "POSSESSION",
      "SENIOR_ASSISTANT_JUDGE",
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/NOT_DETERMINED/);
  });

  it("fails closed for court fees", () => {
    expect(calculateCourtFee("POSSESSION", 1000000)).toBeNull();
  });

  it("fails closed for maintainability", () => {
    const result = checkMaintainability("DECLARATION", []);

    expect(result.isMaintainable).toBe(false);
    expect(result.defects.join(" ")).toMatch(/NOT_DETERMINED/);
  });

  it("fails closed for filing requirements", () => {
    const result = checkFilingRequirements([]);

    expect(result.isComplete).toBe(false);
    expect(result.missingRequirements.join(" ")).toMatch(/NOT_DETERMINED/);
  });

  it("fails closed for relief validation", () => {
    const result = validateReliefForSuitType(
      "DECLARATION",
      ["DECLARATION"],
    );

    expect(result.isValid).toBe(false);
  });

  it("fails closed for procedural/limitation interaction", () => {
    const result = verifyProceduralLimitationInteraction(
      "SPECIFIC_PERFORMANCE",
      "ARTICLE_113",
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/NOT_DETERMINED/);
  });

  it("does not read the wall clock for audit generation", () => {
    const timestamp = "1970-01-01T00:00:00.000Z";

    const result = generateProceduralAuditTrail(
      "DECLARATION",
      null,
      null,
      null,
      [],
      timestamp,
    );

    expect(result.timestamp).toBe(timestamp);
  });

  it("keeps the enforcement harness fail-closed", () => {
    const result = enforceProceduralRules({
      suitType: "DECLARATION",
      proposedCourtTier: "JOINT_DISTRICT_JUDGE",
      facts: [],
      prayedReliefs: [],
      appliedArticle: "ARTICLE_120",
    });

    expect(result.isValid).toBe(false);
    expect(
      result.defects.some((defect) =>
        defect.description.includes("NOT_DETERMINED"),
      ),
    ).toBe(true);
    expect(result.auditTrail.timestamp).toBe(
      "1970-01-01T00:00:00.000Z",
    );
  });
});
