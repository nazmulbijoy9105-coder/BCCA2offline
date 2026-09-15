/**
 * P2-09A — Development Claim → Element → Executable Rule Binding
 *
 * Explicit development binding registry.
 *
 * This registry is intentionally partial. It contains only the canonical
 * bindings approved by P2-08. Unbound enterprise claim elements remain
 * explicitly unbound until a separately validated executable rule exists.
 *
 * No binding is inferred from LegalRule.canonicalClaimId /
 * LegalRule.canonicalElementId.
 */

import {
  createClaimRuleBindingRegistry,
  type ClaimRuleBindingRegistry,
} from "./ClaimRuleBinding";

const DEVELOPMENT_BINDINGS = [
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
] as const;

export const DEVELOPMENT_CLAIM_RULE_BINDING_REGISTRY: ClaimRuleBindingRegistry =
  createClaimRuleBindingRegistry(DEVELOPMENT_BINDINGS);
