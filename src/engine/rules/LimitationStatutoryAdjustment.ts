import {
  compareISO,
  isISODateString,
} from "../../utils/isoDate";
import { Tristate } from "./RuleContracts";

export type LimitationStatutoryAdjustmentStatus =
  | "RESOLVED"
  | "INDETERMINATE";

export type LimitationStatutoryAdjustment = {
  status: LimitationStatutoryAdjustmentStatus;
  finalDeadline: string | null;
  appliedAdjustments: readonly string[];
  pendingAdjustments: readonly string[];
  errors: readonly string[];
};

export type LimitationStatutoryAdjustmentInput = {
  rawExpiryDate: string;
  facts: readonly {
    predicate: string;
    object?: string;
    eventDate?: string;
    state?: Tristate;
    verified?: boolean;
  }[];
};

function verifiedFacts(
  facts: LimitationStatutoryAdjustmentInput["facts"],
  predicate: string,
) {
  return facts.filter(
    (fact) =>
      fact.predicate === predicate &&
      fact.verified === true,
  );
}

/**
 * P4-07 — statutory filing-deadline boundary.
 *
 * P4-06 computes the raw calendar expiry.
 *
 * This layer determines whether that raw calendar result can safely
 * become the final filing deadline.
 *
 * Section 4 is explicitly three-valued:
 *
 *   TRUE    -> Court closed -> verified reopening date required.
 *   FALSE   -> Court not closed -> raw expiry is final deadline.
 *   UNKNOWN -> closure status unresolved -> INDETERMINATE.
 *
 * No weekend, holiday, calendar, or locale inference is permitted.
 *
 * Section 5 is not a generic extension mechanism for institution
 * of an ordinary suit and therefore does not alter this deadline.
 *
 * Sections 13-25 may affect commencement, exclusions, accrual,
 * or other statutory questions. They are not silently converted
 * into generic date arithmetic here.
 *
 * Section 29 is a rule-selection/scope interaction and is not
 * inferred as a generic deadline adjustment here.
 */
export function resolveLimitationStatutoryAdjustment(
  input: LimitationStatutoryAdjustmentInput,
): LimitationStatutoryAdjustment {
  if (!isISODateString(input.rawExpiryDate)) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments: [],
      pendingAdjustments: [],
      errors: ["Invalid raw limitation expiry date"],
    };
  }

  const appliedAdjustments = [
    "SECTION_12_FIRST_DAY_EXCLUDED",
  ];

  const closureFacts = verifiedFacts(
    input.facts,
    "Court Closed On Limitation Date",
  );

  const closureTrueFacts = closureFacts.filter(
    (fact) => fact.state === Tristate.TRUE,
  );

  const closureFalseFacts = closureFacts.filter(
    (fact) => fact.state === Tristate.FALSE,
  );

  /*
   * A verified TRUE and verified FALSE closure fact for the same
   * statutory question is a factual contradiction. Do not select
   * one arbitrarily.
   */
  if (
    closureTrueFacts.length > 0 &&
    closureFalseFacts.length > 0
  ) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Conflicting verified Section 4 court-closure facts prevent deterministic deadline resolution",
      ],
    };
  }

  if (closureTrueFacts.length > 1) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Multiple verified TRUE Section 4 court-closure facts prevent deterministic deadline resolution",
      ],
    };
  }

  if (closureFalseFacts.length > 1) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Multiple verified FALSE Section 4 court-closure facts prevent deterministic deadline resolution",
      ],
    };
  }

  /*
   * UNKNOWN / unresolved closure status.
   *
   * Absence of a verified closure fact is NOT evidence that the
   * Court was open. The engine therefore fails closed.
   */
  if (
    closureTrueFacts.length === 0 &&
    closureFalseFacts.length === 0
  ) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Court closure status on the limitation expiry date is unresolved",
      ],
    };
  }

  /*
   * Explicit verified FALSE:
   *
   * Section 4 does not alter the raw expiry because the Court was
   * affirmatively established as open on that date.
   */
  if (closureFalseFacts.length === 1) {
    return {
      status: "RESOLVED",
      finalDeadline: input.rawExpiryDate,
      appliedAdjustments,
      pendingAdjustments: [],
      errors: [],
    };
  }

  /*
   * Explicit verified TRUE:
   *
   * Section 4 applies and requires exactly one verified reopening
   * date.
   */
  const reopeningFacts = verifiedFacts(
    input.facts,
    "Court Reopening Date",
  ).filter(
    (fact) => fact.state === Tristate.TRUE,
  );

  if (reopeningFacts.length !== 1) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        reopeningFacts.length === 0
          ? "Verified Court Reopening Date is required when Section 4 court closure applies"
          : "Multiple verified Court Reopening Dates prevent deterministic deadline resolution",
      ],
    };
  }

  const closureDate = closureTrueFacts[0].eventDate;

  if (
    !closureDate ||
    !isISODateString(closureDate)
  ) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Verified court-closure fact has no valid ISO event date",
      ],
    };
  }

  if (closureDate !== input.rawExpiryDate) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Section 4 court-closure date does not match the raw limitation expiry date",
      ],
    };
  }

  const reopeningDate = reopeningFacts[0].eventDate;

  if (
    !reopeningDate ||
    !isISODateString(reopeningDate)
  ) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Verified Court Reopening Date is invalid",
      ],
    };
  }

  if (
    compareISO(
      reopeningDate,
      input.rawExpiryDate,
    ) < 0
  ) {
    return {
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments,
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Court reopening date cannot precede the limitation expiry date",
      ],
    };
  }

  appliedAdjustments.push(
    "SECTION_4_COURT_CLOSURE",
  );

  return {
    status: "RESOLVED",
    finalDeadline: reopeningDate,
    appliedAdjustments,
    pendingAdjustments: [],
    errors: [],
  };
}
