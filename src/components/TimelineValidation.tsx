import React from "react";
import { CalendarRange, CheckCircle, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { CaseAnalysisResponse } from "../types/types";

import { getStatuteProvenance } from "../engine/citations/SourceProvenanceResolver";

const limitationProvenance = getStatuteProvenance("LIMITATION_ACT_1908");
const limitationActTitle = limitationProvenance?.title ?? "The Limitation Act, 1908";
interface TimelineValidationProps {
  timeline: NonNullable<CaseAnalysisResponse["stage3"]["timelineValidation"]>;
  isTimeBarred: boolean | null;
  accrualDate: string;
}

export default function TimelineValidation({ timeline, isTimeBarred, accrualDate }: TimelineValidationProps) {
  const {
    agreementDate,
    refusalDate,
    isAgreementDateExtracted,
    isRefusalDateExtracted,
    limitationArticle,
    limitationPeriodYears,
    validationStatus,
    explanation
  } = timeline;

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
            {limitationArticle
              ? `${limitationArticle.replace("ARTICLE_", "Article ")} statutory audit under the ${limitationActTitle} (Bangladesh)`
              : `Statutory limitation audit under the ${limitationActTitle} (Bangladesh) — article not determined` }
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
              : "No specific execution date was extracted from the supplied facts."
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
              ? "Extracted as the explicit refusal date. Its legal significance depends on the limitation rule selected by the engine."
              : "No explicit refusal date was extracted from the supplied facts. The limitation position requires review against the applicable accrual rule and a verified reference date."
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
                {isRefusalDateExtracted ? `Refusal: ${refusalDate}` : "Refusal date not specified"}
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
                  isTimeBarred === true
    ? "bg-red-50 border-red-500 text-red-700"
    : isTimeBarred === false
      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
      : "bg-amber-50 border-amber-500 text-amber-700"
                }`}>
                  4
                </div>
                <span className="text-[11px] font-bold text-[#1E252B]">
  {isTimeBarred === true
    ? "Filing Deadline — TIME-BARRED"
    : isTimeBarred === false
      ? "Filing Deadline — WITHIN LIMITATION"
      : "Filing Deadline — UNKNOWN / REQUIRES REVIEW"}
</span>
              </div>
              <p className="text-[10px] text-neutral-500 text-left sm:text-center">
                {limitationPeriodYears != null
                  ? `${limitationPeriodYears} ${limitationPeriodYears === 1 ? "Year" : "Years"} from Accrual`
                  : "Limitation period not determined"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Block */}
      <div className="bg-white border border-[#E5E1D8] p-4 text-xs space-y-2.5 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-[#1E252B]">
          <Info className="h-4 w-4 text-[#C5A059]" />
          <span>
            Statutory Limitation Rule
            {limitationArticle
              ? ` (${limitationArticle.replace("ARTICLE_", "Article ")} Analysis)`
              : " (Rule Not Determined)"}
          </span>
        </div>
        <p className="text-[#4A5560] text-[11px]">
          {explanation}
        </p>

        {/* Actionable counsel based on validationStatus */}
        {validationStatus === "heuristic_applied" && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-amber-900 block">💡 PLEADER'S ACTION REQUIRED (HEURISTIC WARNING):</strong>
            The supplied facts do not establish the required refusal or performance date with sufficient certainty for a definitive chronology. Verify the relevant date, the applicable accrual rule, and the authoritative limitation source before relying on the result.
            <div className="mt-1.5 font-sans font-semibold text-amber-900">
              Review the fact pattern and provide the missing material date or supporting evidence where available.
            </div>
          </div>
        )}

        {validationStatus === "invalid_gaps" && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-red-900 block">❌ SEVERE LITIGATION RISK (CHRONOLOGY DEFICIT):</strong>
            The available chronology is insufficient to determine the limitation position. The engine cannot establish a definitive filing consequence from the missing dates alone.
            <div className="mt-1.5 font-sans font-semibold text-red-900">
              Review the fact pattern and provide the material execution, refusal, expiry, or other accrual date required by the applicable rule.
            </div>
          </div>
        )}

        {validationStatus === "valid" && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono text-[10px] space-y-1">
            <strong className="uppercase tracking-wider text-emerald-900 block">✓ DATE EXTRACTION VERIFIED:</strong>
            The displayed chronology is supported by dates extracted from the supplied facts. This confirms the engine's date inputs; legal reliance still requires review of the applicable limitation rule, authority, and complete factual record.
          </div>
        )}
      </div>
    </div>
  );
}
