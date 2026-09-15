import { describe, expect, it } from "vitest";

import {
  DevelopmentRuleRegistry,
} from "../BCCAAEngine";

import {
  ENTERPRISE_CLAIM_REGISTRY,
} from "./EnterpriseClaimMatrix";

describe("P2-08: Development rule canonical binding integrity", () => {
  const registry = new DevelopmentRuleRegistry();

  const allRules = [
    ...registry.getClaimElements("SPECIFIC_PERFORMANCE", "Bangladesh"),
    ...registry.getClaimElements("INHERITANCE_CONSULTATION", "Bangladesh"),
    ...registry.getClaimElements("DECLARATION_AND_POSSESSION", "Bangladesh"),
    ...registry.getClaimElements("GENERAL_CIVIL", "Bangladesh"),
  ];

  it("requires canonical claim and element metadata to appear together", () => {
    for (const rule of allRules) {
      const hasClaim = rule.canonicalClaimId !== undefined;
      const hasElement = rule.canonicalElementId !== undefined;

      expect(hasClaim).toBe(hasElement);
    }
  });

  it("accepts only canonical claims that exist in the enterprise registry", () => {
    for (const rule of allRules) {
      if (!rule.canonicalClaimId) continue;

      expect(
        ENTERPRISE_CLAIM_REGISTRY.some(
          claim => claim.claimId === rule.canonicalClaimId,
        ),
      ).toBe(true);
    }
  });

  it("accepts only canonical elements belonging to the declared canonical claim", () => {
    for (const rule of allRules) {
      if (!rule.canonicalClaimId || !rule.canonicalElementId) continue;

      const claim = ENTERPRISE_CLAIM_REGISTRY.find(
        candidate => candidate.claimId === rule.canonicalClaimId,
      );

      expect(claim).toBeDefined();

      expect(
        claim?.elements.some(
          element => element.elementId === rule.canonicalElementId,
        ),
      ).toBe(true);
    }
  });

  it("contains the three approved P2-08 executable bindings", () => {
    const expected = [
      {
        ruleId: "SP-ELEMENT-REGISTRATION",
        canonicalClaimId: "SPECIFIC_PERFORMANCE",
        canonicalElementId: "ELEMENT_REGISTRATION",
      },
      {
        ruleId: "SUCCESSION-DEATH-ELEMENT",
        canonicalClaimId: "INHERITANCE_CONSULTATION",
        canonicalElementId: "ELEMENT_DEATH",
      },
      {
        ruleId: "DP-ELEMENT-TITLE",
        canonicalClaimId: "DECLARATION_SEC42",
        canonicalElementId: "ELEMENT_TITLE",
      },
    ];

    for (const expectedBinding of expected) {
      const rule = allRules.find(
        candidate => candidate.ruleId === expectedBinding.ruleId,
      );

      expect(rule).toBeDefined();
      expect(rule?.canonicalClaimId).toBe(
        expectedBinding.canonicalClaimId,
      );
      expect(rule?.canonicalElementId).toBe(
        expectedBinding.canonicalElementId,
      );
    }
  });

  it("does not bind the intentionally unmapped deposit rule", () => {
    const rule = allRules.find(
      candidate => candidate.ruleId === "SP-ELEMENT-DEPOSIT",
    );

    expect(rule).toBeDefined();
    expect(rule?.canonicalClaimId).toBeUndefined();
    expect(rule?.canonicalElementId).toBeUndefined();
  });

  it("does not bind the intentionally unmapped legacy possession rule", () => {
    const rule = allRules.find(
      candidate => candidate.ruleId === "DP-ELEMENT-POSSESSION",
    );

    expect(rule).toBeDefined();
    expect(rule?.canonicalClaimId).toBeUndefined();
    expect(rule?.canonicalElementId).toBeUndefined();
  });

  it("keeps canonical binding identity deterministic", () => {
    const mapped = allRules
      .filter(
        rule =>
          rule.canonicalClaimId !== undefined &&
          rule.canonicalElementId !== undefined,
      )
      .map(rule => ({
        ruleId: rule.ruleId,
        canonicalClaimId: rule.canonicalClaimId,
        canonicalElementId: rule.canonicalElementId,
      }))
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId));

    expect(mapped).toEqual([
      {
        ruleId: "DP-ELEMENT-TITLE",
        canonicalClaimId: "DECLARATION_SEC42",
        canonicalElementId: "ELEMENT_TITLE",
      },
      {
        ruleId: "SP-ELEMENT-REGISTRATION",
        canonicalClaimId: "SPECIFIC_PERFORMANCE",
        canonicalElementId: "ELEMENT_REGISTRATION",
      },
      {
        ruleId: "SUCCESSION-DEATH-ELEMENT",
        canonicalClaimId: "INHERITANCE_CONSULTATION",
        canonicalElementId: "ELEMENT_DEATH",
      },
    ]);
  });
});
