import React, { useState } from "react";
import { ShieldCheck, Scale, CheckCircle2, XCircle, ArrowRight, BookOpen, AlertTriangle, Layers, Cpu, Database, Eye } from "lucide-react";

interface LegalReliabilityStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalReliabilityStandardModal({ isOpen, onClose }: LegalReliabilityStandardModalProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "architecture" | "boundaries">("standard");

  if (!isOpen) return null;

  const pipelineStages = [
    { step: 1, title: "Input Facts", desc: "Raw litigation dispute narrative or ingested legal documents (PDF/Text)", icon: BookOpen, type: "Input" },
    { step: 2, title: "Fact Normalization", desc: "Deconstruct into immutable atomic propositions with temporal anchors", icon: Database, type: "Processing" },
    { step: 3, title: "Integrity Validation", desc: "F0 Gate temporal, role, vital status, and document conflict checks", icon: ShieldCheck, type: "Gate" },
    { step: 4, title: "Legal Classification", desc: "Domain identification (G1) and statutory mapping (G2)", icon: Layers, type: "Processing" },
    { step: 5, title: "Authority Retrieval", desc: "Canonical registry lookup with cryptographic citation hashes", icon: Database, type: "Registry" },
    { step: 6, title: "Deterministic Rule Evaluation", desc: "Versioned mathematical limitation, heirship shares & pecuniary rules", icon: Cpu, type: "Deterministic" },
    { step: 7, title: "Conflict Detection", desc: "Two-sided contest modeling (G9) and equitable bars audit (G10)", icon: AlertTriangle, type: "Validation" },
    { step: 8, title: "Relief Mapping", desc: "Rule-based decree formulation and Order XXI execution pathways", icon: Scale, type: "Synthesis" },
    { step: 9, title: "Human-Review Output", desc: "Final legal memorandum, forensics audit trail & practitioner review", icon: Eye, type: "Human Review" },
  ];

  const aiPermissions = [
    { title: "Fact Extraction", desc: "Extracting chronological events, dates, monetary considerations, and named parties from pleadings." },
    { title: "Semantic Classification", desc: "Clustering legal narratives into candidate procedural categories (e.g. partition, specific performance, declaration)." },
    { title: "Candidate Statute Identification", desc: "Suggesting candidate legislative frameworks (e.g., Specific Relief Act 1877, Limitation Act 1908)." },
    { title: "Candidate Precedent Retrieval", desc: "Querying canonical Supreme Court precedents index matching factual keywords." },
    { title: "Issue Suggestions", desc: "Proposing framed issues of fact and law for Order XIV CPC consideration." },
    { title: "Missing-Fact Detection", desc: "Identifying missing mutation khatians, CS/RS records, or date gaps in chain of title." },
    { title: "Explanation Generation", desc: "Generating plain-language explanatory summaries for advocate review and drafting assistance." },
  ];

  const deterministicRules = [
    { title: "Maintainability Determination", desc: "Must be computed via statutory bars (e.g., s.42 SRA proviso, s.21A SRA registration requirement, Order VII Rule 11 CPC)." },
    { title: "Limitation Expiry", desc: "Must be calculated using exact arithmetic on Limitation Act 1908 Schedule I Articles & Sections 3–28." },
    { title: "Pecuniary & Territorial Jurisdiction", desc: "Must strictly apply Civil Courts Act 1887 limits (e.g. Assistant Judge vs. Senior Assistant vs. Joint District Judge) and Sections 15–20 CPC." },
    { title: "Legal Heir Status & Fractional Shares", desc: "Must be computed deterministically using Hanafi Sunni / Muslim Personal Law Faraizi algorithms." },
    { title: "Validity/Invalidity of Instruments", desc: "Must be tested against Registration Act 1908 s.17/49 and Evidence Act 1872 documentary rules." },
    { title: "Authoritativeness of Precedents", desc: "Must be verified against the canonical Supreme Court registry with binding hierarchy (AD > HCD) and checksum validation." },
    { title: "Final Relief & Litigation Outcome", desc: "Must never be hallucinated; decrees and dismissal risks derive from deterministic gateway logic." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-[#FDFBF7] border-4 border-[#1E252B] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E252B] text-white p-6 border-b-4 border-[#C5A059] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#C5A059] text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
              <Scale className="w-4 h-4" />
              BCCAA Legal Reliability Standard &bull; Directive v2.5
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              AI Developer Guidelines: Legal Reliability & Deterministic Reasoning
            </h2>
            <p className="text-xs text-[#E5E1D8]/80 font-mono mt-1">
              Core Architecture Principle: <strong className="text-[#C5A059]">AI must never be the final legal authority.</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#1E252B] bg-white text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab("standard")}
            className={`flex-1 py-3 px-4 text-center border-r border-[#E5E1D8] uppercase tracking-wider transition ${
              activeTab === "standard" ? "bg-[#1E252B] text-white" : "text-[#1E252B] hover:bg-[#F9F7F2]"
            }`}
          >
            1. Core Architecture Rule
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`flex-1 py-3 px-4 text-center border-r border-[#E5E1D8] uppercase tracking-wider transition ${
              activeTab === "architecture" ? "bg-[#1E252B] text-white" : "text-[#1E252B] hover:bg-[#F9F7F2]"
            }`}
          >
            2. End-to-End Pipeline
          </button>
          <button
            onClick={() => setActiveTab("boundaries")}
            className={`flex-1 py-3 px-4 text-center uppercase tracking-wider transition ${
              activeTab === "boundaries" ? "bg-[#1E252B] text-white" : "text-[#1E252B] hover:bg-[#F9F7F2]"
            }`}
          >
            3. Functional Boundaries Matrix
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-[#1E252B] space-y-6">
          {activeTab === "standard" && (
            <div className="space-y-6">
              {/* Primary Principle Card */}
              <div className="p-5 bg-amber-50 border-2 border-amber-600 rounded-none space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-mono font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  Fundamental Rule of Jurisprudential Computation
                </div>
                <p className="text-sm font-serif font-bold text-amber-950 leading-snug">
                  AI must never be the final legal authority. Every substantive legal conclusion must originate from versioned deterministic predicates operating over verified inputs.
                </p>
                <p className="text-xs text-amber-900 leading-relaxed font-sans">
                  In Bangladesh civil law, high-stakes judicial determinations—such as limitation expiration, court jurisdiction, and Shariat inheritance fractional shares—cannot be left to stochastic language model generation. The BCCAA enforces a strict pipeline separation between dynamic fact ingestion and deterministic statutory rule engines.
                </p>
              </div>

              {/* Architecture Blueprint flow */}
              <div className="bg-white border border-[#E5E1D8] p-4">
                <h4 className="text-xs font-mono font-bold text-[#1E252B] uppercase tracking-wider mb-3">
                  Mandated Sequential Architecture
                </h4>
                <div className="p-3 bg-[#1E252B] text-[#C5A059] font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <code>Input Facts → Fact Normalization → Integrity Validation → Legal Classification → Authority Retrieval → Deterministic Rule Evaluation → Conflict Detection → Relief Mapping → Human-Review Output</code>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-300">
                  <div className="flex items-center gap-2 text-emerald-900 font-mono font-bold text-xs mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Permitted AI Roles
                  </div>
                  <ul className="text-xs space-y-1.5 text-emerald-950 font-sans">
                    <li>• Dynamic fact extraction from unstructured deeds and pleadings</li>
                    <li>• Semantic classification of dispute categories</li>
                    <li>• Surfacing candidate statutes, sections, and precedent matches</li>
                    <li>• Identification of missing documents, dates, and evidentiary gaps</li>
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-300">
                  <div className="flex items-center gap-2 text-rose-900 font-mono font-bold text-xs mb-2">
                    <XCircle className="w-4 h-4 text-rose-700" />
                    Prohibited AI Autonomy (Deterministic Only)
                  </div>
                  <ul className="text-xs space-y-1.5 text-rose-950 font-sans">
                    <li>• Maintainability and cause of action determinations</li>
                    <li>• Limitation date calculations (Limitation Act 1908)</li>
                    <li>• Pecuniary/territorial jurisdiction assignment (Civil Courts Act 1887)</li>
                    <li>• Quranic fractional inheritance shares (Faraizi tables)</li>
                    <li>• Final decree formulation without human-in-the-loop review</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "architecture" && (
            <div className="space-y-4">
              <p className="text-xs text-[#4A5560]">
                The 9-phase BCCAA pipeline guarantees mathematical repeatability, forensic auditability, and fail-closed safety for all civil litigation evaluations:
              </p>

              <div className="space-y-2.5">
                {pipelineStages.map((stage) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.step} className="flex items-start gap-3 p-3 bg-white border border-[#E5E1D8] hover:border-[#1E252B] transition-colors">
                      <div className="w-7 h-7 bg-[#1E252B] text-[#C5A059] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        0{stage.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-[#1E252B] flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-[#C5A059]" />
                            {stage.title}
                          </h5>
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#FDFBF7] border border-[#E5E1D8] text-neutral-600">
                            {stage.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A5560] mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "boundaries" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Authorized Domain */}
                <div className="space-y-3">
                  <div className="border-b-2 border-emerald-600 pb-1.5 flex items-center gap-2 text-emerald-800 font-mono font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    AI May Perform (Semantic & Assistive)
                  </div>
                  <div className="space-y-2">
                    {aiPermissions.map((p, i) => (
                      <div key={i} className="p-2.5 bg-white border border-emerald-200 text-xs">
                        <strong className="text-emerald-950 font-mono text-[11px] block">{p.title}</strong>
                        <p className="text-neutral-700 text-[11px] mt-0.5">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deterministic Protected Domain */}
                <div className="space-y-3">
                  <div className="border-b-2 border-rose-600 pb-1.5 flex items-center gap-2 text-rose-800 font-mono font-bold text-xs uppercase tracking-wider">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    AI Must Not Determine (Deterministic Predicates)
                  </div>
                  <div className="space-y-2">
                    {deterministicRules.map((r, i) => (
                      <div key={i} className="p-2.5 bg-white border border-rose-200 text-xs">
                        <strong className="text-rose-950 font-mono text-[11px] block">{r.title}</strong>
                        <p className="text-neutral-700 text-[11px] mt-0.5">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-100 border border-neutral-300 text-[11px] font-mono text-neutral-800">
                <strong>Enforcement Standard:</strong> Any violation of this boundary—such as an AI model predicting limitation periods or determining fractional shares without arithmetic execution—is classified as a fatal compliance defect.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1E252B] p-4 text-white flex items-center justify-between border-t-2 border-[#C5A059]">
          <div className="text-[10px] font-mono text-[#E5E1D8]/60">
            BCCAA STANDARD COMPLIANT &bull; VERSIONED DETERMINISTIC PREDICATES
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#C5A059] text-[#1E252B] hover:bg-[#d8b368] text-xs font-mono font-bold uppercase tracking-widest transition cursor-pointer"
          >
            Acknowledge Standard
          </button>
        </div>
      </div>
    </div>
  );
}
