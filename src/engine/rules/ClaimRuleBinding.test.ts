import { describe, expect, it } from "vitest";

import {
  ENTERPRISE_CLAIM_REGISTRY,
} from "./EnterpriseClaimMatrix";

import {
  createClaimRuleBindingRegistry,
  getUnboundCanonicalElements,
  validateClaimRuleBinding,
  validateClaimRuleBindings,
  assertRuleIdsExist,
  type ClaimRuleBinding,
} from "./ClaimRuleBinding";

describe("ClaimRuleBinding", () => {
  const knownBindings: ClaimRuleBinding[] = [
    {
      claimId: "SPECIFIC_PERFORMANCE",
      elementId: "ELEMENT_REGISTRATION",
      ruleId: "SP-ELEMENT-REGISTRATION",
    },
    {
      claimId: "INHERITANCE_CONSULTATION",
      elementId: "ELEMENT_DEATH",
      ruleId: "SUCCESSION-DEATH-ELEMENT",
    },
    {
      claimId: "DECLARATION_SEC42",
      elementId: "ELEMENT_TITLE",
      ruleId: "DP-ELEMENT-TITLE",
    },
  ];

  it("accepts a canonical claim-element binding", () => {
    expect(() =>
      validateClaimRuleBinding(knownBindings[0]),
    ).not.toThrow();
  });

  it("rejects an unknown canonical claim", () => {
    expect(() =>
      validateClaimRuleBinding({
        claimId: "UNKNOWN_CLAIM",
        elementId: "ELEMENT_TITLE",
        ruleId: "RULE-1",
      }),
    ).toThrow("CLAIM_RULE_BINDING_UNKNOWN_CLAIM");
  });

  it("rejects an unknown canonical element", () => {
    expect(() =>
      validateClaimRuleBinding({
        claimId: "DECLARATION_SEC42",
        elementId: "ELEMENT_UNKNOWN",
        ruleId: "RULE-1",
      }),
    ).toThrow("CLAIM_RULE_BINDING_UNKNOWN_ELEMENT");
  });

  it("rejects duplicate claim-element bindings", () => {
    expect(() =>
      validateClaimRuleBindings([
        knownBindings[0],
        {
          ...knownBindings[0],
          ruleId: "ANOTHER-RULE",
        },
      ]),
    ).toThrow("CLAIM_RULE_BINDING_DUPLICATE_ELEMENT");
  });

  it("rejects bindings pointing to nonexistent executable rules", () => {
    expect(() =>
      assertRuleIdsExist(
        knownBindings,
        [
          {
            ruleId: "SP-ELEMENT-REGISTRATION",
            ruleVersion: "1.0.0",
            jurisdiction: "Bangladesh",
            effectiveFrom: "1877-01-01",
            claimTypes: ["SPECIFIC_PERFORMANCE"],
            ruleType: "ELEMENT",
            predicates: [],
            logicalOperator: "ALL",
            outcomeIfSatisfied: "PASS",
            outcomeIfFailed: "FAIL",
            authority: {
              act: "Test",
              section: "Test",
            },
          },
        ],
      ),
    ).toThrow("CLAIM_RULE_BINDING_UNKNOWN_RULE");
  });

  it("creates an immutable binding registry", () => {
    const registry =
      createClaimRuleBindingRegistry(knownBindings);

    expect(
      registry.getBinding(
        "SPECIFIC_PERFORMANCE",
        "ELEMENT_REGISTRATION",
      )?.ruleId,
    ).toBe("SP-ELEMENT-REGISTRATION");

    expect(registry.getBindingsForClaim(
      "SPECIFIC_PERFORMANCE",
    )).toHaveLength(1);

    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.bindings)).toBe(true);
  });

  it("reports canonical elements that remain unbound", () => {
    const unbound = getUnboundCanonicalElements(
      knownBindings,
    );

    expect(unbound).toEqual(
      expect.arrayContaining([
        {
          claimId: "SPECIFIC_PERFORMANCE",
          elementId: "ELEMENT_VALID_CONTRACT",
        },
        {
          claimId: "POSSESSION_RECOVERY_SEC8",
          elementId: "ELEMENT_PRIOR_POSSESSION",
        },
        {
          claimId: "POSSESSION_RECOVERY_SEC8",
          elementId: "ELEMENT_DISPOSSESSION",
        },
        {
          claimId: "PARTITION",
          elementId: "ELEMENT_JOINT_OWNERSHIP",
        },
      ]),
    );
  });

  it("does not invent canonical elements outside the enterprise registry", () => {
    const canonicalElements = ENTERPRISE_CLAIM_REGISTRY.flatMap(
      claim =>
        claim.elements.map(element => ({
          claimId: claim.claimId,
          elementId: element.elementId,
        })),
    );

    expect(
      canonicalElements.some(
        element =>
          element.elementId === "SP-ELEMENT-DEPOSIT",
      ),
    ).toBe(false);
  });
});
