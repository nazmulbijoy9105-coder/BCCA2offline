import type { AppellateDefect } from "./AppellateEnforcementGate";

/**
 * P9-07: Appellate Defect Disclosure.
 * 
 * Aggregates all appellate defects detected by the P9 gates into a 
 * single, human-readable disclosure string. Ensures the engine explicitly 
 * reports all appellate flaws instead of silently failing.
 */

export function formatAppellateDefects(defects: readonly AppellateDefect[]): string | null {
  if (defects.length === 0) {
    return null;
  }

  const grouped = new Map<AppellateDefect["category"], string[]>();

  for (const defect of defects) {
    const group = grouped.get(defect.category) ?? [];
    group.push(defect.description);
    grouped.set(defect.category, group);
  }

  const lines: string[] = ["Appellate Defects Detected:"];

  for (const [category, descriptions] of grouped.entries()) {
    lines.push(`[${category}]`);
    for (const desc of descriptions) {
      lines.push(`- ${desc}`);
    }
  }

  return lines.join("\n");
}
