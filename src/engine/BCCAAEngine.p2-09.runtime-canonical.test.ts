import { describe, expect, it } from "vitest";
import {
  BCCAAEngine,
  NoOpFactValidationProvider,
} from "./BCCAAEngine";
import { makeAnalyzeRequest } from "./testFixtures";

function makeEngine() {
  return new BCCAAEngine({
    licenseValidator: {
      validate: async () => ({
        valid: true,
        licenseId: "TEST",
        issuedTo: "TEST",
      }),
    },
    factValidationProvider: new NoOpFactValidationProvider(),
  });
}

describe("P2-09 — runtime canonical binding", () => {
  it("uses canonical specific-performance binding rather than the full legacy rule family", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-SP",
        factPattern:
          "The plaintiff seeks specific performance of a bainapatra and the defendant refused to execute the sale deed.",
      }),
    );

    expect(response.claimType).toBe("SPECIFIC_PERFORMANCE");

    const executedRuleIds =
      (response.stage8.ruleExecutionResults ?? []).map(
        result => result.ruleId,
      );

    expect(executedRuleIds).toContain(
      "SP-ELEMENT-REGISTRATION",
    );

    expect(executedRuleIds).not.toContain(
      "SP-ELEMENT-DEPOSIT",
    );
  });

  it("executes the canonical inheritance binding", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-INHERITANCE",
        factPattern:
          "The plaintiff claims inheritance from an ancestor who died before the succession opened.",
      }),
    );

    expect(response.claimType).toBe(
      "INHERITANCE_CONSULTATION",
    );

    const executedRuleIds =
      (response.stage8.ruleExecutionResults ?? []).map(
        result => result.ruleId,
      );

    expect(executedRuleIds).toEqual([
      "SUCCESSION-DEATH-ELEMENT",
    ]);
  });

  it("does not fall back to legacy declaration rules for Section 8 possession recovery", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-SEC8",
        factPattern:
          "The plaintiff seeks recovery of possession under Section 8 of the Specific Relief Act after dispossession.",
      }),
    );

    expect(response.outcome).toBe("INDETERMINATE");

    expect(response.stage8.ruleExecutionResults).toEqual([]);

    expect(
      response.stage8.unknownElements,
    ).toContain(
      "CANONICAL_CLAIM_UNBOUND:POSSESSION_RECOVERY_SEC8",
    );

    expect(
      (response.stage8.ruleExecutionResults ?? []).some(
        result =>
          result.ruleId === "DP-ELEMENT-POSSESSION",
      ),
    ).toBe(false);
  });

  it("does not fall back to legacy declaration rules for partition", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-PARTITION",
        factPattern:
          "The co-sharers seek partition of the jointly held property.",
      }),
    );

    expect(response.outcome).toBe("INDETERMINATE");

    expect(response.stage8.ruleExecutionResults).toEqual([]);

    expect(
      response.stage8.unknownElements,
    ).toContain(
      "CANONICAL_CLAIM_UNBOUND:PARTITION",
    );

    expect(
      (response.stage8.ruleExecutionResults ?? []).some(
        result =>
          result.ruleId === "DP-ELEMENT-POSSESSION" ||
          result.ruleId === "DP-ELEMENT-TITLE",
      ),
    ).toBe(false);
  });

  it("treats multiple canonical claim signals as indeterminate", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-AMBIGUOUS",
        factPattern:
          "The plaintiff seeks specific performance of a bainapatra and also seeks partition among co-sharers.",
      }),
    );

    expect(response.outcome).toBe("INDETERMINATE");

    expect(response.stage8.ruleExecutionResults).toEqual([]);

    expect(
      (response.stage8.unknownElements ?? []).some(
        value =>
          value ===
          "CANONICAL_CLAIM_ROUTING:AMBIGUOUS",
      ),
    ).toBe(true);
  });

  it("preserves the compatibility path when no canonical claim is recognized", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(
      makeAnalyzeRequest({
        caseId: "P2-09-GENERAL",
        factPattern:
          "The parties dispute an ordinary contractual obligation and the supplied narrative contains no recognized canonical enterprise claim.",
      }),
    );

    expect(response.claimType).toBe("GENERAL_CIVIL");
  });
});
