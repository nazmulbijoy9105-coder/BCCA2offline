/**
 * P7-14: Fact Conflict Resolution.
 * 
 * Handles cases where facts conflict (e.g., two different dates for the same event).
 * Resolves deterministically by picking the most authoritative source.
 * If sources are equally authoritative, it fails closed to UNKNOWN.
 */

export type SourceAuthority = "REGISTERED_DEED" | "GOVERNMENT_RECORD" | "NOTARIZED" | "SWORN_AFFIDAVIT" | "UNVERIFIED_NARRATIVE";

export type ResolvableFact = {
  factId: string;
  propositionId: string;
  object: string;
  sourceAuthority: SourceAuthority;
};

const AUTHORITY_RANK: Record<SourceAuthority, number> = {
  "REGISTERED_DEED": 5,
  "GOVERNMENT_RECORD": 4,
  "NOTARIZED": 3,
  "SWORN_AFFIDAVIT": 2,
  "UNVERIFIED_NARRATIVE": 1
};

/**
 * Resolves conflicts between facts with the same propositionId but different objects.
 * Returns the fact with the highest source authority.
 * If there is a tie in authority, returns null (fails closed to UNKNOWN).
 */
export function resolveConflicts<T extends ResolvableFact>(facts: readonly T[]): (T | null)[] {
  const grouped = new Map<string, T[]>();

  for (const fact of facts) {
    const group = grouped.get(fact.propositionId) ?? [];
    group.push(fact);
    grouped.set(fact.propositionId, group);
  }

  const resolved: (T | null)[] = [];

  for (const [_, groupFacts] of grouped.entries()) {
    // Find the max authority in this group
    const maxAuthority = Math.max(...groupFacts.map(f => AUTHORITY_RANK[f.sourceAuthority]));
    
    // Filter facts that have the max authority and distinct objects
    const topAuthorityFacts = groupFacts.filter(f => AUTHORITY_RANK[f.sourceAuthority] === maxAuthority);
    
    const distinctObjects = new Set(topAuthorityFacts.map(f => f.object));

    // If top authority facts agree on the object, resolve to that fact
    if (distinctObjects.size === 1) {
      resolved.push(topAuthorityFacts[0]);
    } else {
      // Conflict among equally authoritative sources, fail closed
      resolved.push(null);
    }
  }

  return resolved;
}
