/**
 * P2-07 — Canonical Claim → Element → Executable Rule Binding
 *
 * This module defines the explicit deterministic binding between:
 *
 *   EnterpriseClaimDefinition.claimId
 *              ↓
 *   ClaimElement.elementId
 *              ↓
 *   LegalRule.ruleId
 *
 * The binding layer does not execute rules and does not make legal
 * conclusions.
 *
 * It exists to prevent silent drift between the canonical Claim Matrix
 * and the executable LegalRule graph.
 */

import {
  ENTERPRISE_CLAIM_REGISTRY,
  type EnterpriseClaimDefinition,
} from "./EnterpriseClaimMatrix";

import type { LegalRule } from "./RuleContracts";

export interface ClaimRuleBinding {
  claimId: string;
  elementId: string;
  ruleId: string;
}

export interface ClaimRuleBindingRegistry {
  readonly bindings: readonly ClaimRuleBinding[];

  getBindingsForClaim(claimId: string): readonly ClaimRuleBinding[];

  getBindingsForElement(
    claimId: string,
    elementId: string,
  ): readonly ClaimRuleBinding[];

  getBinding(
    claimId: string,
    elementId: string,
  ): ClaimRuleBinding | null;
}

function canonicalBindingKey(binding: ClaimRuleBinding): string {
  return `${binding.claimId}|${binding.elementId}|${binding.ruleId}`;
}

function assertCanonicalClaimAndElement(
  binding: ClaimRuleBinding,
): void {
  const claim = ENTERPRISE_CLAIM_REGISTRY.find(
    definition => definition.claimId === binding.claimId,
  );

  if (!claim) {
    throw new Error(
      `CLAIM_RULE_BINDING_UNKNOWN_CLAIM:${binding.claimId}`,
    );
  }

  const element = claim.elements.find(
    candidate => candidate.elementId === binding.elementId,
  );

  if (!element) {
    throw new Error(
      `CLAIM_RULE_BINDING_UNKNOWN_ELEMENT:${binding.claimId}:${binding.elementId}`,
    );
  }
}

export function validateClaimRuleBinding(
  binding: ClaimRuleBinding,
): void {
  if (!binding.claimId) {
    throw new Error("CLAIM_RULE_BINDING_MISSING_CLAIM_ID");
  }

  if (!binding.elementId) {
    throw new Error("CLAIM_RULE_BINDING_MISSING_ELEMENT_ID");
  }

  if (!binding.ruleId) {
    throw new Error("CLAIM_RULE_BINDING_MISSING_RULE_ID");
  }

  assertCanonicalClaimAndElement(binding);
}

export function validateClaimRuleBindings(
  bindings: readonly ClaimRuleBinding[],
): void {
  const seen = new Set<string>();

  for (const binding of bindings) {
    validateClaimRuleBinding(binding);

    const key = canonicalBindingKey(binding);

    if (seen.has(key)) {
      throw new Error(
        `CLAIM_RULE_BINDING_DUPLICATE:${key}`,
      );
    }

    seen.add(key);
  }

  const claimElementPairs = new Set<string>();

  for (const binding of bindings) {
    const key = `${binding.claimId}|${binding.elementId}`;

    if (claimElementPairs.has(key)) {
      throw new Error(
        `CLAIM_RULE_BINDING_DUPLICATE_ELEMENT:${key}`,
      );
    }

    claimElementPairs.add(key);
  }
}

export function assertRuleIdsExist(
  bindings: readonly ClaimRuleBinding[],
  rules: readonly LegalRule[],
): void {
  const ruleIds = new Set(rules.map(rule => rule.ruleId));

  for (const binding of bindings) {
    if (!ruleIds.has(binding.ruleId)) {
      throw new Error(
        `CLAIM_RULE_BINDING_UNKNOWN_RULE:${binding.ruleId}`,
      );
    }
  }
}

export function getUnboundCanonicalElements(
  bindings: readonly ClaimRuleBinding[],
): Array<{
  claimId: string;
  elementId: string;
}> {
  const bound = new Set(
    bindings.map(
      binding => `${binding.claimId}|${binding.elementId}`,
    ),
  );

  const unbound: Array<{
    claimId: string;
    elementId: string;
  }> = [];

  for (const claim of ENTERPRISE_CLAIM_REGISTRY) {
    for (const element of claim.elements) {
      const key = `${claim.claimId}|${element.elementId}`;

      if (!bound.has(key)) {
        unbound.push({
          claimId: claim.claimId,
          elementId: element.elementId,
        });
      }
    }
  }

  return unbound;
}

export function createClaimRuleBindingRegistry(
  bindings: readonly ClaimRuleBinding[],
): ClaimRuleBindingRegistry {
  validateClaimRuleBindings(bindings);

  const frozenBindings = Object.freeze(
    bindings.map(binding => Object.freeze({ ...binding })),
  );

  return Object.freeze({
    bindings: frozenBindings,

    getBindingsForClaim(claimId: string) {
      return frozenBindings.filter(
        binding => binding.claimId === claimId,
      );
    },

    getBindingsForElement(
      claimId: string,
      elementId: string,
    ) {
      return frozenBindings.filter(
        binding =>
          binding.claimId === claimId &&
          binding.elementId === elementId,
      );
    },

    getBinding(
      claimId: string,
      elementId: string,
    ) {
      return (
        frozenBindings.find(
          binding =>
            binding.claimId === claimId &&
            binding.elementId === elementId,
        ) ?? null
      );
    },
  });
}
