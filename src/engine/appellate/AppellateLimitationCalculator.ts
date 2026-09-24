import { addDaysISO, isISODateString } from "../../utils/isoDate";
import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";
import type { AppellateRemedyType } from "./AppellateContracts";

const registry = new DevelopmentAppellateRegistry();

/**
 * P9-03: Appellate Limitation Calculator.
 * 
 * Deterministically calculates the limitation expiry date for an appellate 
 * remedy based on the date of the decree/order being appealed.
 * Uses the Limitation Act 1908 rules defined in the appellate registry.
 */

export type AppellateLimitationVerdict = {
  expiryDate: string | null;
  periodDays: number;
  article: string;
  reason: string;
};

export function calculateAppellateLimitation(
  remedyType: AppellateRemedyType,
  decreeDate: string | null
): AppellateLimitationVerdict | null {
  const candidateRules = registry.getCandidateRules(remedyType);

  if (candidateRules.length === 0) {
    return null;
  }

  const rule = candidateRules[0];
  const { periodDays, article } = rule.limitation;

  if (!decreeDate) {
    return {
      expiryDate: null,
      periodDays,
      article,
      reason: "Decree date is required to calculate appellate limitation.",
    };
  }

  // Strict ISO calendar validation prevents host-timezone parsing.
  if (!isISODateString(decreeDate)) {
    return {
      expiryDate: null,
      periodDays,
      article,
      reason: "Invalid decree date format. Expected valid ISO calendar date YYYY-MM-DD.",
    };
  }

  // Fixture calculation only. Production limitation computation requires
  // validated statutory authority and applicable date-counting rules.
  // addDaysISO performs calendar arithmetic independently of host timezone.
  const expiryDate = addDaysISO(decreeDate, periodDays);

  if (expiryDate === null) {
    return {
      expiryDate: null,
      periodDays,
      article,
      reason: "Unable to calculate deterministic ISO expiry date.",
    };
  }

  return {
    expiryDate,
    periodDays,
    article,
    reason: `Appellate limitation of ${periodDays} days (Article ${article}) applied from decree date ${decreeDate}.`,
  };
}
