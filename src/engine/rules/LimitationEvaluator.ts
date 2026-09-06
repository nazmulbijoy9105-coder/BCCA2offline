import type {
  LimitationFact,
  LimitationRule,
  LimitationTemporalVersion,
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
function parseISODate(raw: string | null | undefined): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }

  const [year, month, day] = raw.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toISODate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }

  return 31;
}

/**
 * Calendar-year anniversary.
 *
 * No 365.25-day approximation is used.
 *
 * For a 29-Feb accrual date, the anniversary in a non-leap year is
 * represented by the final valid day of February.
 */
function addCalendarYears(
  rawDate: string,
  years: number,
): string | null {
  const parsed = parseISODate(rawDate);

  if (!parsed || !Number.isInteger(years) || years < 0) {
    return null;
  }

  const targetYear = parsed.year + years;
  const targetDay = Math.min(
    parsed.day,
    daysInMonth(targetYear, parsed.month),
  );

  return toISODate(targetYear, parsed.month, targetDay);
}

function selectTemporalVersion(
  versions: readonly LimitationTemporalVersion[],
  accrualDate: string,
): LimitationTemporalVersion | null {
  const accrual = parseISODate(accrualDate);

  if (!accrual) {
    return null;
  }

  const candidates = versions.filter((version) => {
    const from = parseISODate(version.effectiveFrom);
    const to = version.effectiveTo
      ? parseISODate(version.effectiveTo)
      : null;

    if (!from) {
      return false;
    }

    const afterOrEqualFrom =
      accrualDate >= version.effectiveFrom;

    const beforeOrEqualTo =
      !version.effectiveTo ||
      (to !== null && accrualDate <= version.effectiveTo);

    return afterOrEqualFrom && beforeOrEqualTo;
  });

  if (candidates.length === 0) {
    return null;
  }

  /*
   * Deterministic tie-break:
   * choose the candidate with the latest effectiveFrom.
   */
  return [...candidates].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  )[0];
}

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

function getAccrualDate(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): string | null {
  /*
   * Article 113 has two legally distinct accrual alternatives:
   * - fixed performance date => Performance Date
   * - no fixed performance date => Refusal Date
   *
   * The registry therefore remains the legal source of truth for the
   * alternatives, while this resolver applies the selected factual branch.
   */
  let predicates: readonly string[];

  if (rule.article === "ARTICLE_113") {
    const fixedDateFact = facts.find(
      (fact) =>
        fact.predicate === "Fixed Performance Date" &&
        fact.verified === true,
    );

    if (!fixedDateFact || fixedDateFact.object === undefined) {
      return null;
    }

    if (fixedDateFact.object === "YES") {
      predicates = ["Performance Date"];
    } else if (fixedDateFact.object === "NO") {
      predicates = ["Refusal Date"];
    } else {
      return null;
    }
  } else {
    const predicateByTrigger: Record<
      LimitationRule["accrualTrigger"],
      string
    > = {
      FIXED_PERFORMANCE_DATE: "Performance Date",
      REFUSAL_DATE: "Refusal Date",
      KNOWLEDGE_DATE: "Knowledge Date",
      DISPOSSESSION_DATE: "Dispossession Date",
      RIGHT_TO_SUE_DATE: "Right to Sue Date",
      DEMAND_DATE: "Demand Date",
    };

    predicates = [predicateByTrigger[rule.accrualTrigger]];
  }

  const candidates = facts
    .filter(
      (fact) =>
        predicates.includes(fact.predicate) &&
        fact.eventDate !== undefined &&
        fact.verified === true,
    )
    .map((fact) => fact.eventDate!)
    .filter((date) => parseISODate(date) !== null)
    .sort();

  return candidates[0] ?? null;
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

  const referenceDate = parseISODate(input.referenceDate);

  if (!referenceDate) {
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

  const accrualDate = getAccrualDate(input.rule, input.facts);

  if (!accrualDate) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_accrual_trigger",
      errors: [
        `Accrual trigger unavailable: ${input.rule.accrualTrigger}`,
      ],
    };
  }

  if (accrualDate > input.referenceDate!) {
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

  const temporalVersion = selectTemporalVersion(
    input.rule.temporalVersions,
    accrualDate,
  );

  if (!temporalVersion) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      calculationType: "missing_temporal_version",
      errors: [
        `No limitation temporal version applies to accrual date ${accrualDate}`,
      ],
    };
  }

  const expiryDate = addCalendarYears(
    accrualDate,
    temporalVersion.limitationPeriodYears,
  );

  if (!expiryDate) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate,
      calculationType: "invalid_calendar_calculation",
      errors: ["Calendar anniversary calculation failed"],
    };
  }

  /*
   * Section 12-compatible calendar treatment:
   * the accrual day itself is excluded and the anniversary represents
   * the final day of the prescribed period.
   *
   * Therefore:
   *   referenceDate > expiryDate => barred
   *   referenceDate <= expiryDate => not barred
   */
  const isTimeBarred = input.referenceDate! > expiryDate;

  return {
    ...base,
    status: isTimeBarred ? "BARRED" : "NOT_BARRED",
    isTimeBarred,
    accrualDate,
    expiryDate,
    limitationPeriodYears: temporalVersion.limitationPeriodYears,
    calculationType: "calendar_anniversary",
  };
}
