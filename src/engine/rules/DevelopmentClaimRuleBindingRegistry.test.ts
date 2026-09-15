import { describe, expect, it } from "vitest";

import {
  DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY,
} from "./DevelopmentClaimRuleBindingRegistry";

describe("P2-09A: development runtime claim-rule binding registry", () => {
  it("contains only the explicitly approved development bindings", () => {
    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.bindings,
    ).toEqual([
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
    ]);
  });

  it("resolves approved canonical bindings", () => {
    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "SPECIFIC_PERFORMANCE",
        "ELEMENT_REGISTRATION",
      ),
    ).toEqual({
      claimId: "SPECIFIC_PERFORMANCE",
      elementId: "ELEMENT_REGISTRATION",
      ruleId: "SP-ELEMENT-REGISTRATION",
    });

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "INHERITANCE_CONSULTATION",
        "ELEMENT_DEATH",
      ),
    ).toEqual({
      claimId: "INHERITANCE_CONSULTATION",
      elementId: "ELEMENT_DEATH",
      ruleId: "SUCCESSION-DEATH-ELEMENT",
    });

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "DECLARATION_SEC42",
        "ELEMENT_TITLE",
      ),
    ).toEqual({
      claimId: "DECLARATION_SEC42",
      elementId: "ELEMENT_TITLE",
      ruleId: "DP-ELEMENT-TITLE",
    });
  });

  it("does not bind intentionally unmapped development rules", () => {
    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.bindings.some(
        binding => binding.ruleId === "SP-ELEMENT-DEPOSIT",
      ),
    ).toBe(false);

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.bindings.some(
        binding => binding.ruleId === "DP-ELEMENT-POSSESSION",
      ),
    ).toBe(false);
  });

  it("does not invent bindings for currently unbound canonical elements", () => {
    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "SPECIFIC_PERFORMANCE",
        "ELEMENT_VALID_CONTRACT",
      ),
    ).toBeNull();

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "POSSESSION_RECOVERY_SEC8",
        "ELEMENT_PRIOR_POSSESSION",
      ),
    ).toBeNull();

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "POSSESSION_RECOVERY_SEC8",
        "ELEMENT_DISPOSSESSION",
      ),
    ).toBeNull();

    expect(
      DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.getBinding(
        "PARTITION",
        "ELEMENT_JOINT_OWNERSHIP",
      ),
    ).toBeNull();
  });

  it("is immutable", () => {
    expect(
      Object.isFrozen(
        DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY,
      ),
    ).toBe(true);

    expect(
      Object.isFrozen(
        DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY.bindings,
      ),
    ).toBe(true);
  });
});
