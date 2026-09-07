/**
 * P7-07: Fact-Consistency Gate.
 * 
 * Ensures temporal consistency between facts. Detects chronological 
 * impossibilities (e.g., dispossession before acquisition of title).
 * Fails closed by flagging the inconsistency for manual review.
 */

export type DatedFact = {
  factId: string;
  predicate: string;
  eventDate?: string; // ISO Date string
};

export type TemporalInconsistency = {
  factAId: string;
  factBId: string;
  reason: string;
};

/**
 * Detects temporal inconsistencies where a "later" event occurs before an "earlier" event.
 * E.g., Dispossession occurs before the Contract was signed.
 */
export function detectTemporalInconsistencies(
  earlierPredicate: string,
  laterPredicate: string,
  facts: readonly DatedFact[]
): TemporalInconsistency[] {
  const inconsistencies: TemporalInconsistency[] = [];

  const earlierFacts = facts.filter(f => f.predicate === earlierPredicate && f.eventDate);
  const laterFacts = facts.filter(f => f.predicate === laterPredicate && f.eventDate);

  for (const earlier of earlierFacts) {
    for (const later of laterFacts) {
      if (earlier.eventDate! > later.eventDate!) {
        inconsistencies.push({
          factAId: earlier.factId,
          factBId: later.factId,
          reason: `Event "${earlierPredicate}" (${earlier.eventDate}) cannot occur after event "${laterPredicate}" (${later.eventDate}).`
        });
      }
    }
  }

  return inconsistencies;
}

/**
 * Hard fail-closed guard. Returns true if temporal inconsistencies exist.
 */
export function hasTemporalInconsistencies(
  earlierPredicate: string,
  laterPredicate: string,
  facts: readonly DatedFact[]
): boolean {
  return detectTemporalInconsistencies(earlierPredicate, laterPredicate, facts).length > 0;
}
