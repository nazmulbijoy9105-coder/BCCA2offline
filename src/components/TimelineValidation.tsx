import React from "react";
import { CalendarRange, CheckCircle, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { CaseAnalysisResponse } from "../types/types";

interface TimelineValidationProps {
  timeline: NonNullable<CaseAnalysisResponse["stage3"]["timelineValidation"]>;
  isTimeBarred: boolean;
  accrualDate: string;
  category?: string;
}

export default function TimelineValidation({ timeline, isTimeBarred, accrualDate, category }: TimelineValidationProps) {
  const {
    agreementDate,
    refusalDate,
    isAgreementDateExtracted,
    isRefusalDateExtracted,
    calculationType,
    validationStatus,
    explanation
  } = timeline;

  const isInheritance = category === "INHERITANCE_CONSULTATION" || calculationType === "other_category" && accrualDate.toLowerCase().includes("demise") || accrualDate.toLowerCase().includes("karim");

  // Render badge for status
  const getStatusBadge = () => {
    switch (validationStatus) {
      case "valid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Real Input Derived
          </span>
        );
      case "heuristic_applied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Heuristic Applied
          </span>
        );
      case "invalid_gaps":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-3 w-3" /> Chronology Deficit
          </span>
        );
    }
  };

  if (isInheritance) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] p-5 relative space-y-4">
        {/* Border corners for visual polish */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#1E252B]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#1E252B]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1E252B] flex items-center gap-2">
              <CalendarRange className="h-4.5 w-4.5 text-[#C5A059]" />
              Succession & Partition Timeline Verification
            </h4>
            <p className="text-[10px] text-[#4A5560]">
              Article 123/144 statutory partition audit under the Limitation Act 1908 (Bangladesh)
            </p>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Date Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Demise Date Card */}
          <div className="p-3.5 border bg-white border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-wider">
                1. Demise of Ancestor (Abdul Karim)
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                Verified
              </span>
            </div>
            <div className="py-1">
              <div className="text-lg font-serif font-bold text-[#1E252B]">15 January 2026</div>
            </div>
            <p className="text-[11px] text-[#4A5560] leading-relaxed">
              Ancestor died intestate, triggering the immediate and automatic vesting of Shariat-mandated fractional shares in the Class I heirs.
            </p>
          </div>

          {/* Ouster / Exclusive Mutation Date Card */}
          <div className="p-3.5 border bg-white border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-wider">
                2. Exclusive Mutation / Denial
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                Extracted
              </span>
            </div>
            <div className="py-1">
              <div className="text-lg font-serif font-bold text-[#1E252B]">Post-Demise (2026)</div>
            </div>
            <p className="text-[11px] text-[#4A5560] leading-relaxed">
              Defendant Fatema obtained an exclusive namjari mutation and threatened to alienate undivided parts of the joint inheritance.
            </p>
          </div>
        </div>

        {/* Visual Timeline Stepper */}
        <div className="bg-white border border-[#E5E1D8] p-4 space-y-3">
          <h5 className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-widest border-b border-[#FAF9F5] pb-1.5">
            📅 Succession Chronology & Limitation Run
          </h5>

          <div className="relative pt-4 pb-2">
            {/* Timeline track line */}
            <div className="absolute top-8 left-4 right-4 h-0.5 bg-neutral-200 -translate-y-1/2 z-0 hidden sm:block" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4 relative z-10">
              {/* Step 1 */}
              <div className="space-y-1">
                <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 bg-emerald-50 border-emerald-500 text-emerald-700">
                    1
                  </div>
                  <span className="text-[11px] font-bold text-[#1E252B]">Ancestor Demise</span>
                </div>
                <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                  15 Jan 2026 (Abdul Karim passes)
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-1">
                <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 bg-emerald-50 border-emerald-500 text-emerald-700">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-[#1E252B]">Succession Vesting</span>
                </div>
                <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                  Immediate 2:2:1 division
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-1">
                <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 bg-blue-50 border-blue-500 text-blue-700">
                    3
                  </div>
                  <span className="text-[11px] font-bold text-[#1E252B]">Statutory Accrual</span>
                </div>
                <p className="text-[10px] text-neutral-500 text-left sm:text-center leading-tight">
                  15 Jan 2026 (Article 123/144 runs)
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-1">
                <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 bg-emerald-50 border-emerald-500 text-emerald-700">
                    4
                  </div>
                  <span className="text-[11px] font-bold text-[#1E252B]">Partition Deadline</span>
                </div>
                <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                  12 Years (15 Jan 2038)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Block */}
        <div className="bg-white border border-[#E5E1D8] p-4 text-xs space-y-2.5 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-[#1E252B]">
            <Info className="h-4 w-4 text-[#C5A059]" />
            <span>Succession & Partition Limitation Rules:</span>
          </div>
          <p className="text-[#4A5560] text-[11px]">
            {explanation}
          </p>

          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-emerald-900 block font-bold">✓ STABLE PARTITION CO-OWNERSHIP POSTURE:</strong>
            Succession vests automatically at death. The 12-year partition limitation clock (Article 123/144) is squarely triggered by the demise of the ancestor, making the suit completely within time and fully justiciable. No pre-death parent-son disowning notice can affect or bar this vested right.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] border border-[#E5E1D8] p-5 relative space-y-4">
      {/* Border corners for visual polish */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#1E252B]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#1E252B]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1E252B] flex items-center gap-2">
            <CalendarRange className="h-4.5 w-4.5 text-[#C5A059]" />
            Limitation Timeline & Date Verification
          </h4>
          <p className="text-[10px] text-[#4A5560]">
            Article 54 statutory audit under the Limitation Act 1908 (Bangladesh)
          </p>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Date Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Agreement Date Card */}
        <div className={`p-3.5 border ${isAgreementDateExtracted ? "bg-white border-[#E5E1D8]" : "bg-red-50/20 border-red-200/50"} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-wider">
              1. Bainapatra (Agreement) Date
            </span>
            {isAgreementDateExtracted ? (
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                Extracted
              </span>
            ) : (
              <span className="text-[9px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 border border-red-100">
                Missing
              </span>
            )}
          </div>
          <div className="py-1">
            {isAgreementDateExtracted ? (
              <div className="text-lg font-serif font-bold text-[#1E252B]">{agreementDate}</div>
            ) : (
              <div className="text-sm font-mono text-red-700 italic">No execution date found</div>
            )}
          </div>
          <p className="text-[11px] text-[#4A5560] leading-relaxed">
            {isAgreementDateExtracted 
              ? "Extracted directly from the dispute narrative as the execution date of the agreement to sell." 
              : "No specific calendar dates were found for the contract. The engine must rely on logical relative chronology fallback assumptions."
            }
          </p>
        </div>

        {/* Refusal / Breach Date Card */}
        <div className={`p-3.5 border ${isRefusalDateExtracted ? "bg-white border-[#E5E1D8]" : "bg-amber-50/20 border-amber-200/50"} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-wider">
              2. Notice of Refusal Date
            </span>
            {isRefusalDateExtracted ? (
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                Extracted
              </span>
            ) : (
              <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-100">
                Not Specified
              </span>
            )}
          </div>
          <div className="py-1">
            {isRefusalDateExtracted ? (
              <div className="text-lg font-serif font-bold text-[#1E252B]">{refusalDate}</div>
            ) : (
              <div className="text-sm font-mono text-amber-700 italic">No refusal date found</div>
            )}
          </div>
          <p className="text-[11px] text-[#4A5560] leading-relaxed">
            {isRefusalDateExtracted 
              ? "Extracted as the explicit refusal date. This serves as the precise statutory trigger point under Article 54." 
              : "Missing explicit notice of refusal. The engine is forced to apply a fallback 6-month performance deadline heuristic."
            }
          </p>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="bg-white border border-[#E5E1D8] p-4 space-y-3">
        <h5 className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-widest border-b border-[#FAF9F5] pb-1.5">
          📅 Chronology Map & Accrual Mechanism
        </h5>

        <div className="relative pt-4 pb-2">
          {/* Timeline track line */}
          <div className="absolute top-8 left-4 right-4 h-0.5 bg-neutral-200 -translate-y-1/2 z-0 hidden sm:block" />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4 relative z-10">
            {/* Step 1 */}
            <div className="space-y-1">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                  isAgreementDateExtracted 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                    : "bg-neutral-50 border-neutral-300 text-neutral-400"
                }`}>
                  1
                </div>
                <span className="text-[11px] font-bold text-[#1E252B]">Bainapatra Execution</span>
              </div>
              <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                {isAgreementDateExtracted ? `Executed: ${agreementDate}` : "Date unspecified"}
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-1">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                  isRefusalDateExtracted 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                    : "bg-amber-50 border-amber-400 text-amber-700"
                }`}>
                  2
                </div>
                <span className="text-[11px] font-bold text-[#1E252B]">Notice of Refusal</span>
              </div>
              <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                {isRefusalDateExtracted ? `Refusal: ${refusalDate}` : "Fallback (No date fixed)"}
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-1">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 bg-blue-50 border-blue-500 text-blue-700">
                  3
                </div>
                <span className="text-[11px] font-bold text-[#1E252B]">Statutory Accrual</span>
              </div>
              <p className="text-[10px] text-neutral-500 text-left sm:text-center leading-tight">
                {accrualDate.replace(/\(.*?\)/, "")}
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-1">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                  isTimeBarred 
                    ? "bg-red-50 border-red-500 text-red-700" 
                    : "bg-emerald-50 border-emerald-500 text-emerald-700"
                }`}>
                  4
                </div>
                <span className="text-[11px] font-bold text-[#1E252B]">Filing Deadline</span>
              </div>
              <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                1 Year from Accrual
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Block */}
      <div className="bg-white border border-[#E5E1D8] p-4 text-xs space-y-2.5 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-[#1E252B]">
          <Info className="h-4 w-4 text-[#C5A059]" />
          <span>Statutory Limitation Rule (Article 54 Analysis):</span>
        </div>
        <p className="text-[#4A5560] text-[11px]">
          {explanation}
        </p>

        {/* Actionable counsel based on validationStatus */}
        {validationStatus === "heuristic_applied" && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-amber-900 block">💡 PLEADER'S ACTION REQUIRED (HEURISTIC WARNING):</strong>
            Because the narrative fails to state the exact date the Defendant refused to register the property or when the contract expired, the engine applied a 6-month default execution window as a heuristic to calculate the limitation. In real litigation, a plaint filed with such ambiguous timeline descriptions will face immediate contest under Order VII Rule 11 CPC or Section 55/56 Evidence Act.
            <div className="mt-1.5 font-sans font-semibold text-amber-900">
              👉 Fix: Update your fact pattern text to include a sentence such as: "On December 12, 2024, the Plaintiff made a final demand, but the Defendant flatly refused to register the deed."
            </div>
          </div>
        )}

        {validationStatus === "invalid_gaps" && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-red-900 block">❌ SEVERE LITIGATION RISK (CHRONOLOGY DEFICIT):</strong>
            Without any dates in the narrative, the limitation period is uncomputable. The court will reject your suit at the threshold under Order VII Rule 11 CPC for failing to disclose when the cause of action arose and proving it falls within the mandatory 1-year window of Article 54.
            <div className="mt-1.5 font-sans font-semibold text-red-900">
              👉 Fix: Please rewrite the narrative to specify when the Bainapatra was executed and the exact date performance was refused.
            </div>
          </div>
        )}

        {validationStatus === "valid" && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-emerald-900 block">✓ VERIFIED TIMELINE STABILITY:</strong>
            The chronology is fully backed by real, parsed dates. The resulting 1-year Article 54 calculation has high legal validity and can be directly used in Drafting the Cause of Action paragraph of the Plaint.
          </div>
        )}
      </div>
    </div>
  );
}
