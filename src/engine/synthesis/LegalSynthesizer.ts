/**
 * Legal Synthesizer Module
 * 
 * Takes raw structural engine output and synthesizes it into 
 * premium, human-readable legal conclusions and calculations.
 */

export type SynthesizableFact = {
  subject: string;
  predicate: string;
  object?: string | null;
  eventDate?: string | null;
};

export type SynthesizedReport = {
  legalConclusions: string[];
  shareCalculations?: string[];
  injunctionStatus?: string;
  filingRequirements: string[];
};

/**
 * Synthesizes a premium legal report from extracted facts.
 */
export function synthesizeLegalReport(
  claimType: string,
  facts: readonly SynthesizableFact[]
): SynthesizedReport {
  const report: SynthesizedReport = {
    legalConclusions: [],
    filingRequirements: [],
  };

  if (claimType === "INHERITANCE_CONSULTATION") {
    // 1. Check for Disowning Affidavit
    const hasAffidavit = facts.some(f => f.predicate === "Document Type" && f.object?.includes("AFFIDAVIT"));
    if (hasAffidavit) {
      report.legalConclusions.push(
        "Legal Validity of 'Disowning' Affidavit: Under Sunni Hanafi law, a parent cannot unilaterally disinherit legal heirs. The shares of legal heirs are fixed by the Quran and Sunnah. An affidavit 'disowning' sons has absolutely zero legal efficacy in altering the devolution of intestate property."
      );
    }

    // 2. Calculate Inheritance Shares (Sons 2:1 Daughter)
    const sons = facts.filter(f => f.subject === "Heir" && f.object === "SON").length;
    const daughters = facts.filter(f => f.subject === "Heir" && f.object === "DAUGHTER").length;
    
    if (sons > 0 || daughters > 0) {
      const totalUnits = (sons * 2) + daughters;
      report.shareCalculations = [];
      
      if (sons > 0) {
        const sonShare = 2 / totalUnits;
        report.shareCalculations.push(`Sons (${sons}): ${sonShare.toFixed(4)} share each (${sonShare * 100}%)`);
      }
      if (daughters > 0) {
        const daughterShare = 1 / totalUnits;
        report.shareCalculations.push(`Daughters (${daughters}): ${daughterShare.toFixed(4)} share each (${daughterShare * 100}%)`);
      }

      report.legalConclusions.push(
        `Inheritance Share Calculation: Under Sunni Hanafi Muslim Personal Law, the estate is distributed in a ${sons * 2}:${daughters} ratio. Each son receives ${ (2 / totalUnits * 100).toFixed(2) }% and each daughter receives ${ (1 / totalUnits * 100).toFixed(2) }%.`
      );
    }

    // 3. Injunction Analysis
    const hasMutation = facts.some(f => f.predicate === "Mutation Status" && f.object === "EXCLUSIVE_MUTATION");
    const hasSaleThreat = facts.some(f => f.predicate === "Threat" && f.object?.includes("SELL"));
    
    if (hasMutation || hasSaleThreat) {
      report.injunctionStatus = "TEMPORARY INJUNCTION GRANTED (Status Quo ordered)";
      report.legalConclusions.push(
        "Injunctive Relief: A temporary injunction under Order XXXIX Rules 1 & 2 CPC is warranted to restrain the defendant from alienating, selling, or creating encumbrances over the undivided suit property during the pendency of the suit."
      );
    }

    // 4. Filing Requirements
    report.filingRequirements.push("Certified copies of CS, SA, and RS Khatians and Mouza maps.");
    report.filingRequirements.push("Certified copy of the Mutation Case (to be challenged).");
    report.filingRequirements.push("Draft Affidavit verifying the plaint.");
    report.filingRequirements.push("Court Fee Stamps (Ad-valorem for partition).");
  }

  return report;
}
