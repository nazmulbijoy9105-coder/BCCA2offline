import React from "react";
import { AlertTriangle, ShieldAlert, Info, FileText } from "lucide-react";
import { CaseAnalysisResponse } from "../types/types";

interface MissingEvidenceAlertProps {
  analysis: CaseAnalysisResponse;
}

interface WarningItem {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
}

export default function MissingEvidenceAlert({ analysis }: MissingEvidenceAlertProps) {
  const meta = analysis.stage0.factsMeta;
  if (!meta) return null;

  const warnings: WarningItem[] = [];

  // 1. Accrual Date / Chronology Check
  if (analysis.stage3.accrualDate && (
    analysis.stage3.accrualDate.includes("Not Specified") || 
    analysis.stage3.accrualDate.includes("Not specified") ||
    analysis.stage3.accrualDate.includes("T=0") ||
    analysis.stage3.accrualDate.includes("Date T")
  )) {
    warnings.push({
      type: "warning",
      title: "Accrual Date of Cause of Action Unspecified",
      description: "No specific calendar dates were detected in the dispute narrative. The engine has constructed a relative timeline based on logical fallbacks.",
      impact: "Mandatory statutory verification under the Limitation Act 1908 requires concrete dates. In court, a plaint failing to show the exact date the cause of action arose is liable to rejection under Order VII Rule 11 CPC."
    });
  }

  // 2. Specific Performance Gatekeeping Checks
  if (meta.category === "SPECIFIC_PERFORMANCE") {
    // Bainapatra Registration
    if (meta.isRegisteredBainapatra === "unspecified") {
      warnings.push({
        type: "warning",
        title: "Bainapatra Registration Status Unspecified",
        description: "Your narrative does not state whether the contract to sell (Bainapatra) is registered. The analysis is mapped assuming legal compliance, but this is an unverified assumption.",
        impact: "Under Section 21A of the Specific Relief Act 1877, no suit for specific performance shall lie unless the contract is registered under the Registration Act 1908. An unregistered Bainapatra creates an absolute threshold bar."
      });
    } else if (meta.isRegisteredBainapatra === false) {
      warnings.push({
        type: "error",
        title: "Statutory Defect: Bainapatra is Unregistered",
        description: "The agreement to sell is explicitly identified as unregistered.",
        impact: "A suit based on an unregistered contract of sale is legally incompetent. Under Section 21A of the Specific Relief Act, courts are strictly prohibited from entertaining specific performance of an unregistered Bainapatra."
      });
    }

    // Treasury Deposit
    if (meta.isBalanceDeposited === "unspecified") {
      warnings.push({
        type: "warning",
        title: "Treasury Deposit of Balance Consideration Unspecified",
        description: "The narrative does not specify whether the remaining balance consideration has been deposited in the court.",
        impact: "Section 21A of the Specific Relief Act 1877 mandates that the remaining consideration must be deposited in court at the time of filing the suit. Failing to prove this deposit will result in immediate threshold dismissal of the plaint."
      });
    } else if (meta.isBalanceDeposited === false) {
      warnings.push({
        type: "error",
        title: "Statutory Defect: Remaining Balance Not Deposited",
        description: "The plaintiff has not deposited the remaining balance consideration in the court treasury.",
        impact: "This violates the mandatory threshold requirement of Section 21A SRA. The court lacks the discretionary power to excuse this, rendering the suit unmaintainable."
      });
    }

    // Default Valuation Amounts
    if (meta.isUsingDefaultAmounts) {
      warnings.push({
        type: "info",
        title: "Defaulted Financial Valuation Applied",
        description: "No specific financial amounts (e.g., 'Tk. 15,00,000') were parsed from the narrative. The engine has applied a default valuation of BDT 12 Lakh total with BDT 5 Lakh advance payment.",
        impact: "Pecuniary jurisdiction, the competent trial forum, and the required ad valorem court fees (under the Court Fees Act 1870) are estimates based on standard defaults. Provide actual monetary amounts to get definitive calculations."
      });
    }
  }

  // 3. Declaration & Possession Gatekeeping Checks
  if (meta.category === "DECLARATION_AND_POSSESSION") {
    // Title Documents
    if (meta.plaintiffHasRegisteredTitle === "unspecified") {
      warnings.push({
        type: "warning",
        title: "Registered Title Ownership Documents Unspecified",
        description: "The narrative does not mention whether the Plaintiff holds registered deeds (registered Kabala, mutation khatian, or certified record-of-rights).",
        impact: "A suit for declaration of title under Section 42 of the Specific Relief Act 1877 requires the Plaintiff to establish a present vested legal character or property right. In the absence of registered deeds, ownership claims cannot be declared and will fail."
      });
    } else if (meta.plaintiffHasRegisteredTitle === false) {
      warnings.push({
        type: "error",
        title: "Title Defect: Plaintiff Lacks Registered Title",
        description: "The narrative indicates that the Plaintiff lacks registered ownership deeds or mutation records.",
        impact: "Without a valid chain of registered ownership documents, the court cannot grant a declaratory decree of title. A verbal or unregistered claim is legally insufficient to defeat possession or establish ownership."
      });
    }

    // Dispossession / Ouster
    if (meta.dispossessionProven === "unspecified") {
      warnings.push({
        type: "warning",
        title: "Physical Dispossession / Ouster Facts Unspecified",
        description: "No specific details or timeline of actual physical dispossession (ouster) by the Defendant were found.",
        impact: "This creates critical ambiguity for limitation. Recovery under Section 9 SRA must be filed within 6 months, and title-based recovery under Article 142/143 of the Limitation Act must be filed within 12 years of ouster. Without these details, the maintainability remains unverified."
      });
    } else if (meta.dispossessionProven === false) {
      warnings.push({
        type: "warning",
        title: "Dispossession Status Unproven / Contested",
        description: "The facts imply the Plaintiff was either not physically dispossessed or remains in shared/uninterrupted possession.",
        impact: "Possession recovery suits under Section 8 or 9 SRA are incompetent if the Plaintiff was not actually dispossessed. If the Plaintiff is still in possession, the proper remedy is a suit for partition or simple perpetual injunction to restrain trespass."
      });
    }
  }

  // 4. Inheritance & Succession Gatekeeping Checks
  if (meta.category === "INHERITANCE_CONSULTATION") {
    const isDeceased = analysis.stage1.primaryDomain === "Partition & Succession Suit";
    
    if (!isDeceased) {
      warnings.push({
        type: "error",
        title: "Succession Not Opened: Ancestor is Living",
        description: "The dispute pattern centers on a living parent (father) disowning his children or threatening inheritance rights.",
        impact: "Under Muslim Personal Law (Shariat) Application Act 1937, inheritance only opens upon the death of the owner. A living person's child holds a mere expectation of succession (spes successionis), which carries no vested interest. This suit has zero justiciable cause of action under Section 9 CPC and will be rejected."
      });
    } else {
      // Deceased Ancestor (Partition Suit) Factual Sufficiency Checks
      
      // Check 1: Death Certificate / Date of Death
      const hasExplicitDeathDate = analysis.stage3.accrualDate && !analysis.stage3.accrualDate.includes("First recorded");
      if (!hasExplicitDeathDate) {
        warnings.push({
          type: "warning",
          title: "Exact Date of Demise/Death Unspecified",
          description: "The narrative does not specify the exact calendar date of the ancestor's death. A default timeline starting 15 January 2026 has been assumed.",
          impact: "To prove that succession has opened and compute the exact limitation period under Article 123/144 of the Limitation Act, the exact date of death of the ancestor must be pleaded in the Plaint. Lacking this creates room for the defense to argue limitation bars or dispute the opening of succession."
        });
      }

      // Check 2: Contested Mutation Details (Namjari)
      const hasMutationContest = analysis.stage0.chronology.some(c => 
        c.event.toLowerCase().includes("mutation") || 
        c.event.toLowerCase().includes("namjari") || 
        c.event.toLowerCase().includes("khatian")
      );
      if (!hasMutationContest) {
        warnings.push({
          type: "warning",
          title: "Contested Mutation/Namjari Records Not Mentioned",
          description: "Your fact pattern does not mention if the wrongful exclusive mutation (namjari) of the property in the Land Office has been officially checked or challenged.",
          impact: "In a partition suit, correction of wrongful mutation records (under S.143 State Acquisition and Tenancy Act) is a necessary consequential relief. Failing to challenge the wrongful mutation in the pleadings leaves a cloud on the title records."
        });
      }

      // Check 3: Urgent Third-Party Sale Threat (Temporary Injunction under Order 39)
      const hasInjunctionUrgency = analysis.stage0.chronology.some(c => 
        c.event.toLowerCase().includes("injunction") || 
        c.event.toLowerCase().includes("third party") || 
        c.event.toLowerCase().includes("sell")
      );
      if (!hasInjunctionUrgency) {
        warnings.push({
          type: "info",
          title: "Urgent Temporary Injunction Pleadings Recommended",
          description: "The narrative does not explicitly demand an injunction to restrain the defendant from selling or transferring undivided shares of the joint property.",
          impact: "Failing to file an application under Order XXXIX Rules 1 & 2 CPC for a temporary injunction will allow the defendant to sell the property to third-party purchasers, creating multi-party litigation complexities and irreversible possession issues."
        });
      }
    }
  }

  if (warnings.length === 0) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-600" />
        <div className="flex gap-3">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded self-start">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-900">
              ✓ Factual Sufficiency & Evidence Verified
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Excellent! All critical statutory parameters (such as explicit registration status, deposit variables, concrete calendar timelines, and title deeds) were identified directly in your fact pattern. The analytical findings below are derived from verified factual inputs rather than default estimates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group warnings by severity for structured rendering
  const errors = warnings.filter(w => w.type === "error");
  const warns = warnings.filter(w => w.type === "warning");
  const infos = warnings.filter(w => w.type === "info");

  return (
    <div className="bg-white border-2 border-[#1E252B] p-6 relative overflow-hidden space-y-5">
      {/* Absolute indicator */}
      <div className="absolute top-0 right-0 bg-[#C5A059] text-[#1E252B] font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-wider">
        Factual Sufficiency Audit
      </div>
      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#1E252B]" />

      <div className="border-b border-[#E5E1D8] pb-3">
        <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#1E252B] flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-[#C5A059]" />
          ⚠️ Missing Evidence & Factual Sufficiency Alert
        </h3>
        <p className="text-[11px] text-[#4A5560] mt-1 leading-relaxed">
          Critical statutory requirements under the Civil Procedure Code 1908 and Specific Relief Act 1877 must be met to establish a maintainable cause of action. The cascade engine detected that several findings rely on unverified assumptions or default values.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* CRITICAL STATUTORY BARS / ERRORS */}
        {errors.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[9px] font-mono font-bold text-red-700 uppercase tracking-widest bg-red-55 px-2 py-0.5 inline-block border border-red-200">
              Threshold Statutory Bars
            </div>
            <div className="space-y-2">
              {errors.map((w, idx) => (
                <div key={idx} className="p-3.5 bg-red-50/50 border-l-4 border-l-red-600 border border-red-200/60 rounded-none text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="p-0.5 bg-red-100 text-red-700 rounded-xs self-start">
                      <ShieldAlert className="h-3.5 w-3.5" />
                    </span>
                    <div className="space-y-1">
                      <strong className="text-red-900 font-serif text-[13px]">{w.title}</strong>
                      <p className="text-red-800 text-[11px] leading-relaxed">{w.description}</p>
                      <div className="bg-white/75 p-2 border border-red-200 text-red-950 font-mono text-[10px] leading-relaxed rounded-xs mt-1.5">
                        <strong className="uppercase text-[9px] text-red-800 tracking-wider block">Legal Consequence (Statutory Bar):</strong>
                        {w.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FACTUAL MISSING PIECES / WARNINGS */}
        {warns.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-widest bg-amber-55 px-2 py-0.5 inline-block border border-amber-200">
              Unverified Parameters & Assumptions
            </div>
            <div className="space-y-2">
              {warns.map((w, idx) => (
                <div key={idx} className="p-3.5 bg-amber-50/40 border-l-4 border-l-amber-500 border border-amber-200/50 rounded-none text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="p-0.5 bg-amber-100 text-amber-800 rounded-xs self-start">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    <div className="space-y-1">
                      <strong className="text-amber-950 font-serif text-[13px]">{w.title}</strong>
                      <p className="text-amber-900 text-[11px] leading-relaxed">{w.description}</p>
                      <div className="bg-white/75 p-2 border border-amber-200/60 text-amber-950 font-mono text-[10px] leading-relaxed rounded-xs mt-1.5">
                        <strong className="uppercase text-[9px] text-amber-800 tracking-wider block">Risk of Factual Inadequacy:</strong>
                        {w.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEFAULT VALUES APPLIED / INFOS */}
        {infos.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest bg-blue-55 px-2 py-0.5 inline-block border border-blue-200">
              Defaulted System Estimates
            </div>
            <div className="space-y-2">
              {infos.map((w, idx) => (
                <div key={idx} className="p-3.5 bg-blue-50/40 border-l-4 border-l-blue-500 border border-blue-200/40 rounded-none text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="p-0.5 bg-blue-100 text-blue-800 rounded-xs self-start">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                    <div className="space-y-1">
                      <strong className="text-blue-905 font-serif text-[13px]">{w.title}</strong>
                      <p className="text-blue-900 text-[11px] leading-relaxed">{w.description}</p>
                      <div className="bg-white/75 p-2 border border-blue-200/65 text-blue-955 font-mono text-[10px] leading-relaxed rounded-xs mt-1.5">
                        <strong className="uppercase text-[9px] text-blue-800 tracking-wider block">Refinement Strategy:</strong>
                        {w.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#FDFBF7] p-3.5 border border-[#E5E1D8] text-[10px] font-mono text-[#4A5560] leading-relaxed">
        <span className="font-bold text-[#1E252B] uppercase tracking-wider block mb-1">💡 Professional Council Note:</span>
        To turn unverified assumptions into definitive findings, rewrite or expand your factual narrative to explicitly state all registration numbers, specific contract/deed dates, actual paid/due monetary amounts (in BDT/Taka), and document names. Re-submitting the narrative will immediately trigger a fresh sufficiency audit.
      </div>
    </div>
  );
}
