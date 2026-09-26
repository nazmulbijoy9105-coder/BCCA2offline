import { isISODateString } from "../../utils/isoDate";
import type {
  LimitationFact,
  LimitationRule,
} from "./LimitationContracts";

export type LimitationAccrualResolution = {
  accrualDate: string | null;
  error: string | null;
};

/**
 * P4-06 — Accrual Resolver.
 *
 * This module extracts the existing legally constrained accrual semantics
 * from LimitationEvaluator. It does not select a limitation article.
 *
 * Fail-closed:
 * - dates must be verified
 * - dates must be strict ISO calendar dates
 * - conflicting/multiple candidate dates do not silently select one
 * - Article 113/115/116/149 retain their explicit statutory branches
 */
export function resolveLimitationAccrual(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): LimitationAccrualResolution {
  if (rule.article === "ARTICLE_113") {
    const fixedDateFacts = facts.filter(
      (fact) =>
        fact.predicate === "Fixed Performance Date" &&
        fact.verified === true &&
        fact.object !== undefined,
    );

    if (fixedDateFacts.length !== 1) {
      return {
        accrualDate: null,
        error:
          fixedDateFacts.length === 0
            ? "Article 113 fixed-performance-date branch is unresolved"
            : "Article 113 fixed-performance-date state has multiple verified facts",
      };
    }

    const fixedDateFact = fixedDateFacts[0];

    if (!fixedDateFact) {
      return {
        accrualDate: null,
        error: "Article 113 fixed-performance-date branch is unresolved",
      };
    }

    if (fixedDateFact.object === "YES") {
      return verifiedEventDate(
        facts,
        "Performance Date",
        "Article 113 performance date",
      );
    }

    if (fixedDateFact.object === "NO") {
      return verifiedEventDate(
        facts,
        "Refusal Date",
        "Article 113 refusal date",
      );
    }

    return {
      accrualDate: null,
      error: "Article 113 fixed-performance-date state is invalid",
    };
  }

  if (rule.article === "ARTICLE_115") {
    const modeFacts = facts.filter(
      (fact) =>
        fact.predicate === "Contract Breach Mode" &&
        fact.verified === true &&
        fact.object !== undefined,
    );

    if (modeFacts.length !== 1) {
      return {
        accrualDate: null,
        error:
          modeFacts.length === 0
            ? "Article 115 breach mode is unresolved"
            : "Article 115 breach mode has multiple verified facts",
      };
    }

    const mode = modeFacts[0];

    if (!mode) {
      return {
        accrualDate: null,
        error: "Article 115 breach mode is unresolved",
      };
    }

    if (mode.object === "ORDINARY") {
      return verifiedEventDate(
        facts,
        "Contract Breach Date",
        "Article 115 ordinary breach date",
      );
    }

    if (mode.object === "SUCCESSIVE") {
      return verifiedEventDate(
        facts,
        "Successive Breach Date",
        "Article 115 successive breach date",
      );
    }

    if (mode.object === "CONTINUING") {
      return verifiedEventDate(
        facts,
        "Continuing Breach Date",
        "Article 115 continuing breach cessation date",
      );
    }

    return {
      accrualDate: null,
      error: "Article 115 breach mode is invalid",
    };
  }

  if (rule.article === "ARTICLE_116") {
    return verifiedEventDate(
      facts,
      "Analogous Unregistered Contract Start",
      "Article 116 analogous unregistered-contract commencement",
    );
  }

  if (rule.article === "ARTICLE_149") {
    return verifiedEventDate(
      facts,
      "Analogous Private Suit Start",
      "Article 149 analogous private-suit commencement",
    );
  }

  const predicateByTrigger: Partial<
    Record<LimitationRule["accrualTrigger"], string>
  > = {
    FIXED_PERFORMANCE_DATE: "Performance Date",
    REFUSAL_DATE: "Refusal Date",
    KNOWLEDGE_DATE: "Knowledge Date",
    DISPOSSESSION_DATE: "Dispossession Date",
    RIGHT_TO_SUE_DATE: "Right to Sue Date",
    DEMAND_DATE: "Demand Date",
    CONTRACT_BREACH_DATE: "Contract Breach Date",
    SUCCESSIVE_BREACH_DATE: "Successive Breach Date",
    CONTINUING_BREACH_DATE: "Continuing Breach Date",
    ANALOGOUS_UNREGISTERED_CONTRACT_START:
      "Analogous Unregistered Contract Start",
    ANALOGOUS_PRIVATE_SUIT_START:
      "Analogous Private Suit Start",
    ADVERSE_POSSESSION_DATE: "Adverse Possession Date",
  };

  const predicate = predicateByTrigger[rule.accrualTrigger];

  if (!predicate) {
    return {
      accrualDate: null,
      error: `Unsupported limitation accrual trigger: ${rule.accrualTrigger}`,
    };
  }

  return verifiedEventDate(facts, predicate, rule.accrualTrigger);
}

function verifiedEventDate(
  facts: readonly LimitationFact[],
  predicate: string,
  label: string,
): LimitationAccrualResolution {
  const candidates = facts
    .filter(
      (fact) =>
        fact.predicate === predicate &&
        fact.eventDate !== undefined &&
        fact.verified === true,
    )
    .map((fact) => fact.eventDate!)
    .filter(isISODateString);

  if (candidates.length !== 1) {
    return {
      accrualDate: null,
      error:
        candidates.length === 0
          ? `${label} is unavailable`
          : `${label} has multiple verified valid dates`,
    };
  }

  return {
    accrualDate: candidates[0],
    error: null,
  };
}
