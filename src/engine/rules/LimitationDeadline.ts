import { compareISO, isISODateString } from "../../utils/isoDate";

export type LimitationDeadlineEvaluation = {
  isTimeBarred: boolean | null;
  status: "BARRED" | "NOT_BARRED" | "INDETERMINATE";
};

/**
 * P4-06 — Final deadline evaluation boundary.
 *
 * This function accepts ONLY a resolved final filing deadline.
 * A raw expiry date must never be passed here as if it were final.
 */
export function evaluateLimitationDeadline(
  referenceDate: string | null,
  finalDeadline: string | null,
): LimitationDeadlineEvaluation {
  if (
    !referenceDate ||
    !finalDeadline ||
    !isISODateString(referenceDate) ||
    !isISODateString(finalDeadline)
  ) {
    return {
      isTimeBarred: null,
      status: "INDETERMINATE",
    };
  }

  const isTimeBarred =
    compareISO(referenceDate, finalDeadline) > 0;

  return {
    isTimeBarred,
    status: isTimeBarred
      ? "BARRED"
      : "NOT_BARRED",
  };
}
