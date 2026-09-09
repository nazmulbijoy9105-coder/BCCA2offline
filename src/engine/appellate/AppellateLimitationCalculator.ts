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

  // Parse the decree date and add the prescribed days
  const date = new Date(decreeDate);
  if (isNaN(date.getTime())) {
    return {
      expiryDate: null,
      periodDays,
      article,
      reason: "Invalid decree date format. Expected ISO date string.",
    };
  }

  // Fixture calculation only. Production limitation computation requires
  // validated statutory authority and applicable date-counting rules.
  const expiryDate = new Date(date);
  expiryDate.setDate(expiryDate.getDate() + periodDays);

  return {
    expiryDate: expiryDate.toISOString().split("T")[0],
    periodDays,
    article,
    reason: `Appellate limitation of ${periodDays} days (Article ${article}) applied from decree date ${decreeDate}.`,
  };
}
