/**
 * P8-08: Procedural Defect Disclosure.
 * 
 * Aggregates all procedural defects detected by the P8 gates into a 
 * single, human-readable disclosure string. Ensures the engine explicitly 
 * reports all procedural flaws instead of silently failing.
 */

export type ProceduralDefect = {
  category: "JURISDICTION" | "COURT_FEE" | "MAINTAINABILITY" | "FILING" | "RELIEF";
  description: string;
};

export function formatProceduralDefects(defects: readonly ProceduralDefect[]): string | null {
  if (defects.length === 0) {
    return null;
  }

  const grouped = new Map<ProceduralDefect["category"], string[]>();

  for (const defect of defects) {
    const group = grouped.get(defect.category) ?? [];
    group.push(defect.description);
    grouped.set(defect.category, group);
  }

  const lines: string[] = ["Procedural Defects Detected:"];

  for (const [category, descriptions] of grouped.entries()) {
    lines.push(`[${category}]`);
    for (const desc of descriptions) {
      lines.push(`- ${desc}`);
    }
  }

  return lines.join("\n");
}
