import { compareISO, isISODateString } from "../../utils/isoDate";
import { resolveLimitationAccrual } from "./LimitationAccrualResolver";
import { resolveLimitationPeriod } from "./LimitationPeriodResolver";
import { computeLimitationDeadline } from "./LimitationStatutoryComputation";
import { evaluateLimitationDeadline } from "./LimitationDeadline";
import {
  resolveLimitationStatutoryAdjustment,
} from "./LimitationStatutoryAdjustment";
import type {
  LimitationFact,
  LimitationRule,
} from "./LimitationContracts";

export type LimitationEvaluationStatus =
  | "BARRED"
  | "NOT_BARRED"
  | "INDETERMINATE";

export type LimitationEvaluationInput = {
  rule: LimitationRule | null;
  facts: readonly LimitationFact[];
  referenceDate: string | null;
};

export type LimitationEvaluationResult = {
  status: LimitationEvaluationStatus;
  isTimeBarred: boolean | null;
  accrualDate: string | null;
  expiryDate: string | null;
  limitationPeriodYears: number | null;
  limitationArticle: string | null;
  calculationType: string;
  errors: string[];
  warnings: string[];
};

/**
 * Parse only canonical ISO calendar dates.
 *
 * The limitation evaluator deliberately does not accept Date.parse(),
 * locale-dependent dates, or timestamp arithmetic.
 */
function factSatisfiesPredicate(
  fact: LimitationFact,
  predicate: {
    predicate: string;
    object?: string;
    requiredState?: LimitationFact["state"];
  },
): boolean {
  if (fact.predicate !== predicate.predicate) {
    return false;
  }

  if (
    predicate.object !== undefined &&
    fact.object !== predicate.object
  ) {
    return false;
  }

  if (
    predicate.requiredState !== undefined &&
    fact.state !== predicate.requiredState
  ) {
    return false;
  }

  /*
   * A legal applicability predicate is not established merely because
   * an extracted candidate exists. Verified facts are required when
   * the predicate is used to establish a limitation rule.
   */
  if (fact.verified !== true) {
    return false;
  }

  return true;
}

function predicateIsSatisfied(
  predicate: {
    predicate: string;
    object?: string;
    requiredState?: LimitationFact["state"];
  },
  facts: readonly LimitationFact[],
): boolean {
  return facts.some((fact) =>
    factSatisfiesPredicate(fact, predicate),
  );
}

function missingRequiredPredicates(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): string[] {
  const required = rule.applicability.requiredPredicates ?? [];

  return required
    .filter(
      (predicate) =>
        !predicateIsSatisfied(predicate, facts),
    )
    .map((predicate) =>
      predicate.object
        ? `${predicate.predicate}=${predicate.object}`
        : predicate.predicate,
    );
}

function alternativePredicateGroupSatisfied(
  group: readonly {
    predicate: string;
    object?: string;
    requiredState?: LimitationFact["state"];
  }[],
  facts: readonly LimitationFact[],
): boolean {
  return group.every((predicate) =>
    predicateIsSatisfied(predicate, facts),
  );
}

function applicabilityAlternativeGroupsMissing(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): string[] {
  const groups =
    rule.applicability.alternativePredicateGroups ?? [];

  if (groups.length === 0) {
    return [];
  }

  /*
   * At least one complete alternative group must be established.
   * UNKNOWN or unverified facts cannot satisfy an alternative.
   */
  const satisfied = groups.some((group) =>
    alternativePredicateGroupSatisfied(group, facts),
  );

  if (satisfied) {
    return [];
  }

  return [
    "No legally sufficient limitation applicability alternative established",
  ];
}


/**
 * Pure limitation evaluation.
 *
 * Fail-closed rules:
 * - missing rule => INDETERMINATE
 * - missing reference date => INDETERMINATE
 * - missing/invalid accrual trigger => INDETERMINATE
 * - missing applicability fact => INDETERMINATE
 * - missing temporal version => INDETERMINATE
 * - invalid chronology => INDETERMINATE
 * - UNKNOWN facts are never converted into FALSE
 */
export function evaluateLimitation(
  input: LimitationEvaluationInput,
): LimitationEvaluationResult {
  const base = {
    expiryDate: null,
    limitationPeriodYears: null,
    limitationArticle: input.rule?.article ?? null,
    errors: [] as string[],
    warnings: [] as string[],
  };

  if (!input.rule) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_rule",
      errors: ["No limitation rule was selected"],
    };
  }

  const referenceDate = input.referenceDate;

  if (!referenceDate || !isISODateString(referenceDate)) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_reference_date",
      errors: ["Explicit limitation reference date is unavailable or invalid"],
    };
  }

  const missingPredicates = missingRequiredPredicates(
    input.rule,
    input.facts,
  );

  const missingAlternativeGroups =
    applicabilityAlternativeGroupsMissing(
      input.rule,
      input.facts,
    );

  if (
    missingPredicates.length > 0 ||
    missingAlternativeGroups.length > 0
  ) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_applicability_facts",
      errors: [
        ...(missingPredicates.length > 0
          ? [
              `Required limitation facts unavailable: ${missingPredicates.join(", ")}`,
            ]
          : []),
        ...missingAlternativeGroups,
      ],
    };
  }

  const accrualResolution = resolveLimitationAccrual(
    input.rule,
    input.facts,
  );

  if (!accrualResolution.accrualDate) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_accrual_trigger",
      errors: [
        accrualResolution.error ??
          `Accrual trigger unavailable: ${input.rule.accrualTrigger}`,
      ],
    };
  }

  const accrualDate = accrualResolution.accrualDate;

  if (compareISO(accrualDate, referenceDate) > 0) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      calculationType: "invalid_chronology",
      errors: [
        "Accrual date occurs after the limitation reference date",
      ],
    };
  }

  const periodResolution = resolveLimitationPeriod(
    input.rule,
    accrualDate,
  );

  if (
    periodResolution.status !== "RESOLVED" ||
    periodResolution.periodValue === null ||
    periodResolution.periodUnit === null
  ) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      calculationType: "missing_temporal_version",
      errors: [
        periodResolution.error ??
          `No limitation temporal version applies to accrual date ${accrualDate}`,
      ],
    };
  }

  const computation = computeLimitationDeadline({
    accrualDate,
    periodValue: periodResolution.periodValue,
    periodUnit: periodResolution.periodUnit,
  });

  if (!computation) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      limitationPeriodYears:
        periodResolution.periodUnit === "YEAR"
          ? periodResolution.periodValue
          : null,
      calculationType: "invalid_calendar_calculation",
      errors: ["Base statutory calendar calculation failed"],
    };
  }

  /*
   * P4-07 statutory adjustment boundary.
   *
   * rawExpiryDate is only the deterministic P4-06 calendar result.
   * It must never be used directly to determine limitation status.
   */
  const statutoryAdjustment =
    resolveLimitationStatutoryAdjustment({
      rawExpiryDate: computation.rawExpiryDate,
      facts: input.facts,
    });

  if (
    statutoryAdjustment.status !== "RESOLVED" ||
    !statutoryAdjustment.finalDeadline
  ) {
    /*
     * P4-07 one-sided safety rule.
     *
     * An unresolved Section 4 court-closure adjustment cannot safely
     * produce BARRED after the raw expiry date because a later
     * reopening date may extend the filing deadline.
     *
     * When the reference date is on or before the raw expiry,
     * NOT_BARRED remains logically safe because Section 4 can only
     * preserve or extend the filing opportunity beyond the raw
     * calendar boundary.
     *
     * This does NOT treat rawExpiryDate as the final statutory
     * filing deadline.
     */
    const safelyNotBarred =
      compareISO(
        referenceDate,
        computation.rawExpiryDate,
      ) <= 0;

    if (safelyNotBarred) {
      return {
        ...base,
        status: "NOT_BARRED",
        isTimeBarred: false,
        accrualDate,
        expiryDate: computation.rawExpiryDate,
        limitationPeriodYears:
          periodResolution.periodUnit === "YEAR"
            ? periodResolution.periodValue
            : null,
        calculationType: "statutory_deadline_pending_adjustment",
        errors: [],
        warnings: [
          ...statutoryAdjustment.errors,
          "Final statutory filing deadline remains unresolved; NOT_BARRED is safe because the reference date is on or before the raw calendar expiry",
        ],
      };
    }

    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      expiryDate: computation.rawExpiryDate,
      limitationPeriodYears:
        periodResolution.periodUnit === "YEAR"
          ? periodResolution.periodValue
          : null,
      calculationType: "statutory_adjustment_unresolved",
      errors:
        statutoryAdjustment.errors.length > 0
          ? [...statutoryAdjustment.errors]
          : [
              "Final statutory limitation deadline could not be resolved",
            ],
    };
  }

  const deadlineEvaluation = evaluateLimitationDeadline(
    referenceDate,
    statutoryAdjustment.finalDeadline,
  );

  if (deadlineEvaluation.status === "INDETERMINATE") {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      expiryDate: statutoryAdjustment.finalDeadline,
      limitationPeriodYears:
        periodResolution.periodUnit === "YEAR"
          ? periodResolution.periodValue
          : null,
      calculationType: "invalid_final_deadline",
      errors: [
        "Final statutory limitation deadline could not be evaluated",
      ],
    };
  }

  return {
    ...base,
    status: deadlineEvaluation.status,
    isTimeBarred: deadlineEvaluation.isTimeBarred,
    accrualDate,
    expiryDate: statutoryAdjustment.finalDeadline,
    limitationPeriodYears:
      periodResolution.periodUnit === "YEAR"
        ? periodResolution.periodValue
        : null,
    calculationType: "statutory_deadline",
  };
}
