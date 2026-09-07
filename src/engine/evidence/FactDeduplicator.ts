/**
 * P7-13: Fact Deduplication.
 * 
 * Prevents duplicate facts from skewing the deterministic reasoning pipeline.
 * If the engine extracts the exact same proposition and object from multiple 
 * sources, it merges them into a single canonical fact.
 */

export type ExtractableFact = {
  factId: string;
  propositionId: string;
  truth: "TRUE" | "FALSE" | "UNKNOWN";
  object?: string | null;
};

/**
 * Generates a deterministic canonical key for a fact to identify duplicates.
 */
function getFactCanonicalKey(fact: ExtractableFact): string {
  return `${fact.propositionId}|${fact.truth}|${fact.object ?? "null"}`;
}

/**
 * Deduplicates an array of facts based on their proposition, truth, and object.
 * Returns a new array containing only unique facts.
 */
export function deduplicateFacts<T extends ExtractableFact>(facts: readonly T[]): readonly T[] {
  const seen = new Map<string, T>();

  for (const fact of facts) {
    const key = getFactCanonicalKey(fact);
    if (!seen.has(key)) {
      seen.set(key, fact);
    }
  }

  return Array.from(seen.values());
}

/**
 * Hard fail-closed guard. Returns true if duplicate facts exist.
 */
export function hasDuplicateFacts<T extends ExtractableFact>(facts: readonly T[]): boolean {
  const keys = new Set<string>();
  
  for (const fact of facts) {
    const key = getFactCanonicalKey(fact);
    if (keys.has(key)) {
      return true;
    }
    keys.add(key);
  }
  
  return false;
}
