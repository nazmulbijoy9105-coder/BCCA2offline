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

function getAccrualDate(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): string | null {
  const predicateByTrigger: Record<LimitationRule["accrualTrigger"], string> = {
    REFUSAL_DATE: "Refusal Date",
    DISPOSSESSION_DATE: "Dispossession Date",
    RIGHT_TO_SUE_DATE: "Right to Sue Date",
    DEATH_DATE: "Vital Status",
    DEMAND_DATE: "Demand Date",
  };

  const predicate = predicateByTrigger[rule.accrualTrigger];

  const candidates = facts
    .filter((fact) => {
      if (fact.eventDate === undefined) {
        return false;
      }

      if (rule.accrualTrigger === "DEATH_DATE") {
        return (
          fact.predicate === predicate &&
          fact.object === "DECEASED"
        );
      }

      return fact.predicate === predicate;
    })
    .map((fact) => fact.eventDate!)
    .filter((date) => parseISODate(date) !== null)
    .sort();

  return candidates[0] ?? null;
}

function missingRequiredPredicates(
  rule: LimitationRule,
  facts: readonly LimitationFact[],
): string[] {
  return rule.applicability.requiredPredicates.filter(
    (requiredPredicate) =>
      !facts.some(
        (fact) =>
          fact.predicate === requiredPredicate &&
          fact.eventDate !== undefined &&
          parseISODate(fact.eventDate) !== null,
      ),
  );
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

  if (missingPredicates.length > 0) {
    return {
      ...base,
      status: "INDETERMINATE",
      isTimeBarred: null,
      accrualDate: null,
      calculationType: "missing_applicability_facts",
      errors: [
        `Required limitation facts unavailable: ${missingPredicates.join(", ")}`,
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
