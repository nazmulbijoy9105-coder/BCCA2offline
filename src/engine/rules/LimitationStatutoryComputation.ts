import {
  addDaysISO,
  addMonthsISO,
  addYearsISO,
} from "../../utils/isoDate";

export type LimitationStatutoryComputation = {
  rawExpiryDate: string;
  finalDeadline: string | null;
  appliedAdjustments: readonly string[];
  pendingAdjustments: readonly string[];
  status: "BASE_CALENDAR_ONLY";
};

/**
 * P4-06 — Statutory computation boundary.
 *
 * This layer calculates only the raw calendar expiry.
 *
 * It deliberately does NOT claim that the raw expiry is the final
 * statutory filing deadline. Statutory adjustments remain unresolved
 * until their dedicated computation layer is implemented.
 */
export function computeLimitationDeadline(input: {
  accrualDate: string;
  periodValue: number;
  periodUnit: "YEAR" | "MONTH" | "DAY";
}): LimitationStatutoryComputation | null {
  let rawExpiryDate: string | null = null;

  if (input.periodUnit === "YEAR") {
    rawExpiryDate = addYearsISO(
      input.accrualDate,
      input.periodValue,
    );
  } else if (input.periodUnit === "MONTH") {
    rawExpiryDate = addMonthsISO(
      input.accrualDate,
      input.periodValue,
    );
  } else if (input.periodUnit === "DAY") {
    rawExpiryDate = addDaysISO(
      input.accrualDate,
      input.periodValue,
    );
  }

  if (!rawExpiryDate) {
    return null;
  }

  return {
    rawExpiryDate,
    finalDeadline: null,
    appliedAdjustments: [],
    pendingAdjustments: [
      "SECTION_4_COURT_CLOSURE",
      "SECTION_5_APPLICABILITY_BOUNDARY",
      "SECTION_12_EXCLUSIONS",
      "SECTIONS_13_25_ADJUSTMENTS",
      "SECTION_29_SPECIAL_LAW_INTERACTION",
    ],
    status: "BASE_CALENDAR_ONLY",
  };
}
