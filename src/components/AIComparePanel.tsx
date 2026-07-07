import React, { useState } from "react";
import { Sparkles, Loader2, Scale, AlertCircle, RefreshCw, CheckCircle, ChevronDown, ChevronUp, BookOpen, AlertTriangle } from "lucide-react";
import { CaseAnalysisResponse } from "../types/types";

interface AIComparePanelProps {
  factPattern: string;
  analysisResult: CaseAnalysisResponse;
}

export default function AIComparePanel({ factPattern, analysisResult }: AIComparePanelProps) {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factPattern,
          engineAnalysis: {
            category: analysisResult.stage0?.factsMeta?.category,
            primaryAct: analysisResult.stage2?.primaryAct,
            limitationAccrualDate: analysisResult.stage3?.accrualDate,
            isTimeBarred: analysisResult.stage3?.isTimeBarred,
            forum: analysisResult.stage5?.pecuniary?.courtLevel,
            courtFees: analysisResult.stage5?.pecuniary?.suitsValuationActNotes,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setAiResponse(data.text);
    } catch (err: any) {
      console.error("AI comparison failed:", err);
      setError(err.message || "An error occurred while connecting to the AI services.");
    } finally {
      setLoading(false);
    }
  };

  // Simple, robust Markdown parser helper for elegant display
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("## ")) {
        return (
          <h4 key={idx} className="text-xs font-bold font-mono text-[#C5A059] uppercase tracking-wider mt-6 mb-3 border-b border-[#E5E1D8] pb-1.5 flex items-center gap-2">
            <Scale className="h-3.5 w-3.5" />
            {trimmed.replace("## ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h3 key={idx} className="text-sm font-serif font-bold text-[#1E252B] mt-7 mb-4 border-b-2 border-[#1E252B] pb-2">
            {trimmed.replace("# ", "")}
          </h3>
        );
      }

      // Bold-only or subheaders
      if (trimmed.startsWith("### ")) {
        return (
          <h5 key={idx} className="text-xs font-bold text-[#1E252B] font-serif mt-5 mb-2">
            {trimmed.replace("### ", "")}
          </h5>
        );
      }

      // Bullet points
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 text-[11px] text-[#4A5560] leading-relaxed pl-3 py-1">
            <span className="text-[#C5A059] text-sm leading-none flex-shrink-0">•</span>
            <span>{parseInlineBold(itemText)}</span>
          </div>
        );
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2.5 text-[11px] text-[#4A5560] leading-relaxed pl-3 py-1">
            <span className="text-[#C5A059] font-mono font-bold text-[10px]">{numMatch[1]}.</span>
            <span>{parseInlineBold(numMatch[2])}</span>
          </div>
        );
      }

      // Empty lines
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      // Paragraph
      return (
        <p key={idx} className="text-[11px] text-[#4A5560] leading-relaxed py-1">
          {parseInlineBold(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse inline **bold** text
  const parseInlineBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-[#1E252B] font-semibold">{part}</strong> : part));
  };

  return (
    <div className="bg-white border-2 border-[#1E252B] p-6 relative overflow-hidden space-y-4">
      {/* Absolute indicator */}
      <div className="absolute top-0 right-0 bg-[#1E252B] text-[#FDFBF7] border-l border-b border-[#E5E1D8] font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-[#C5A059]" />
        Supreme AI Assessor
      </div>
      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#1E252B]" />

      <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#1E252B] flex items-center gap-2">
            ⚖️ Factual Verity & Supreme AI Comparison
          </h3>
          <p className="text-[11px] text-[#4A5560]">
            Cross-reference deterministic statutory logic with high-level Gemini Supreme Court legal intelligence
          </p>
        </div>
        <button className="text-[#1E252B] hover:text-[#C5A059] transition">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-1">
          {!aiResponse && !loading && (
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E1D8] space-y-4 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  While the local engine performs secure, deterministic calculations according to strict statutory frameworks (CPC, SRA, Limitation Act), legal litigation requires comparing facts with high-level judicial nuance, identifying implicit exceptions, and preparing tactical courtroom briefs.
                </p>
                <button
                  onClick={handleCompare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] text-xs font-mono font-bold uppercase tracking-widest border border-[#1E252B] hover:border-[#C5A059] transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#C5A059] animate-pulse" />
                  Compare Facts & Run Gemini Audit
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="p-12 bg-[#FAF9F5] border border-[#E5E1D8] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 text-[#C5A059] animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-mono font-bold text-[#1E252B] uppercase tracking-wider">
                  Analyzing Fact Verity & Drafting Comparison...
                </p>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Synthesizing Supreme Court precedents, equity exclusions, and statutory alignments
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50/50 border border-red-200 text-xs text-red-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold font-serif text-[13px] block">AI Integration Incomplete</strong>
                  <p className="text-[11px] text-red-800">{error}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-red-200/50 flex justify-end">
                <button
                  onClick={handleCompare}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-wider text-[9px] transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Retry Consultation
                </button>
              </div>
            </div>
          )}

          {aiResponse && (
            <div className="space-y-4">
              {/* Comparative Output Wrapper */}
              <div className="bg-[#FAFBF9] border-l-4 border-l-[#C5A059] border-y border-r border-[#E5E1D8] p-5 sm:p-6 space-y-4 font-serif">
                <div className="flex items-center justify-between border-b border-[#FAF9F5] pb-2.5 mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Professional Legal Comparison Complete
                  </span>
                  <button
                    onClick={handleCompare}
                    className="text-[9px] font-mono font-bold text-[#4A5560] hover:text-[#C5A059] transition uppercase tracking-wider flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Re-Consult AI
                  </button>
                </div>

                <div className="space-y-3 font-serif text-xs text-[#1E252B] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                  {renderMarkdown(aiResponse)}
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-3 border border-[#E5E1D8] text-[10px] font-mono text-[#4A5560] leading-relaxed">
                <span className="font-bold text-[#1E252B] uppercase tracking-wider block mb-1">💡 ADVOCATE SUMMARY WARNING & DISCLAIMER:</span>
                This comparative legal memorandum is generated for educational and drafting advisory assistance by Gemini. It supplements the deterministic BCCAA local engine analysis but does not constitute formal legal counsel. Verify all findings with active Bangladesh gazettes and Supreme Court case logs.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
