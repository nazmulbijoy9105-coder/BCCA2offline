import { compareISO, isISODateString } from "../../utils/isoDate";
import type {
  LimitationRule,
  LimitationTemporalVersion,
  LimitationPeriodUnit,
} from "./LimitationContracts";

export type LimitationPeriodResolutionStatus =
  | "RESOLVED"
  | "INDETERMINATE";

export type ResolvedLimitationPeriod = {
  status: LimitationPeriodResolutionStatus;
  temporalVersion: LimitationTemporalVersion | null;
  periodValue: number | null;
  periodUnit: LimitationPeriodUnit | null;
  error: string | null;
};

/**
 * P4-06 — Period Resolver.
 *
 * Resolves the temporal version for an already-resolved accrual date.
 *
 * Fail-closed temporal invariant:
 *   0 applicable versions  -> INDETERMINATE
 *   1 applicable version   -> RESOLVED
 *   2+ applicable versions -> INDETERMINATE
 *
 * This resolver never resolves a temporal conflict by ordering candidates.
 */
export function resolveLimitationPeriod(
  rule: LimitationRule,
  accrualDate: string,
): ResolvedLimitationPeriod {
  if (!isISODateString(accrualDate)) {
    return indeterminate("Invalid accrual date");
  }

  const candidates = rule.temporalVersions.filter((version) => {
    if (!isISODateString(version.effectiveFrom)) {
      return false;
    }

    if (
      version.effectiveTo !== undefined &&
      !isISODateString(version.effectiveTo)
    ) {
      return false;
    }

    const starts =
      compareISO(accrualDate, version.effectiveFrom) >= 0;

    const ends =
      version.effectiveTo === undefined ||
      compareISO(accrualDate, version.effectiveTo) <= 0;

    return starts && ends;
  });

  if (candidates.length === 0) {
    return indeterminate(
      `No temporal limitation version applies to accrual date ${accrualDate}`,
    );
  }

  if (candidates.length !== 1) {
    return indeterminate(
      `Multiple temporal limitation versions apply to accrual date ${accrualDate}`,
    );
  }

  const temporalVersion = candidates[0];

  if (!temporalVersion) {
    return indeterminate("Temporal limitation version resolution failed");
  }

  const periodValue =
    temporalVersion.periodValue ??
    temporalVersion.limitationPeriodYears;

  const periodUnit =
    temporalVersion.periodUnit ??
    "YEAR";

  if (
    !Number.isInteger(periodValue) ||
    periodValue <= 0
  ) {
    return indeterminate(
      "Limitation period value is invalid",
    );
  }

  if (
    periodUnit !== "YEAR" &&
    periodUnit !== "MONTH" &&
    periodUnit !== "DAY"
  ) {
    return indeterminate(
      "Limitation period unit is invalid",
    );
  }

  return {
    status: "RESOLVED",
    temporalVersion,
    periodValue,
    periodUnit,
    error: null,
  };
}

function indeterminate(
  error: string,
): ResolvedLimitationPeriod {
  return {
    status: "INDETERMINATE",
    temporalVersion: null,
    periodValue: null,
    periodUnit: null,
    error,
  };
}
