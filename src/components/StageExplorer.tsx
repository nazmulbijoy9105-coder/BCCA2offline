import React, { useState } from "react";
import { CaseAnalysisResponse } from "../types/types";
import { 
  Briefcase, Scale, Calendar, AlertTriangle, Users, MapPin, 
  FileCheck, List, Shield, Eye, HelpCircle, GitCommit, CornerRightDown, Layers
} from "lucide-react";

interface StageExplorerProps {
  analysis: CaseAnalysisResponse;
}

export default function StageExplorer({ analysis }: StageExplorerProps) {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stagesList = [
    { num: 0, title: "Fact Matrix & Chronology", icon: Briefcase },
    { num: 1, title: "Domain Classification", icon: Layers },
    { num: 2, title: "Legislation Map & Precedents", icon: Scale },
    { num: 3, title: "Limitation Calculations", icon: Calendar },
    { num: 4, title: "Party Capacity & Joinders", icon: Users },
    { num: 5, title: "Jurisdiction (Territorial/Pecuniary)", icon: MapPin },
    { num: 6, title: "Pleadings & Plaint Checklist", icon: FileCheck },
    { num: 7, title: "Framer of Issues", icon: List },
    { num: 8, title: "Evidence Map & Presumptions", icon: Shield },
    { num: 9, title: "Two-Sided Trial Contest", icon: Eye },
    { num: 10, title: "Equitable Defences Check", icon: HelpCircle },
    { num: 11, title: "CPC Suit Lifecycle", icon: GitCommit },
    { num: 12, title: "Appeals & Revisions", icon: CornerRightDown },
    { num: 13, title: "Synthesis & Final Execution", icon: Scale },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 font-sans">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-3">
        <div className="border-b-2 border-[#1E252B] pb-2 mb-4">
          <h3 className="text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest px-1">
            BCCAA Cascade Gateways
          </h3>
        </div>
        <div className="space-y-1.5">
          {stagesList.map((stage) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.num;
            return (
              <button
                key={stage.num}
                onClick={() => setActiveStage(stage.num)}
                className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold font-mono flex items-center gap-3 transition-all duration-300 border-2 ${
                  isActive
                    ? "bg-[#1E252B] text-white border-[#1E252B]"
                    : "bg-white text-[#1E252B] border-[#E5E1D8] hover:bg-[#F9F7F2] hover:border-[#1E252B]"
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center font-mono text-[10px] font-bold border ${
                  isActive 
                    ? "bg-[#C5A059] text-[#1E252B] border-[#C5A059]" 
                    : "bg-[#FDFBF7] text-[#1E252B] border-[#E5E1D8]"
                }`}>
                  {stage.num}
                </span>
                <span className="truncate tracking-wider uppercase text-[11px]">{stage.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Screen */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border-2 border-[#1E252B] p-6 sm:p-8 min-h-[500px] flex flex-col justify-between relative rounded-none">
          {/* Subtle geometric corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5A059]" />

          <div>
            {/* Header */}
            <div className="border-b-2 border-[#1E252B] pb-4 mb-6">
              <span className="text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest">
                Gateway Module {activeStage} of 13
              </span>
              <h2 className="text-xl font-bold font-serif text-[#1E252B] mt-1.5 uppercase tracking-wide">
                {stagesList[activeStage].title}
              </h2>
            </div>

            {/* Contents dynamically rendered */}
            <div className="text-xs leading-relaxed text-[#4A5560] space-y-6">
              
              {/* STAGE 0 */}
              {activeStage === 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase tracking-wider mb-2">Stabilized Chronology of Dispute</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-[#E5E1D8]">
                        <thead>
                          <tr className="bg-[#FDFBF7] font-mono text-[10px] font-bold text-[#1E252B] border-b border-[#E5E1D8]">
                            <th className="p-2 border border-[#E5E1D8]">Date</th>
                            <th className="p-2 border border-[#E5E1D8]">Litigation Event</th>
                            <th className="p-2 border border-[#E5E1D8]">Parties Inherent</th>
                            <th className="p-2 border border-[#E5E1D8]">Statutory Importance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.stage0.chronology.map((c, i) => (
                            <tr key={i} className="border-b border-[#E5E1D8]">
                              <td className="p-2 font-mono font-bold text-[#1E252B]">{c.date}</td>
                              <td className="p-2">{c.event}</td>
                              <td className="p-2">{c.partiesInvolved}</td>
                              <td className="p-2 text-neutral-500 italic">{c.statutorySignificance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FDFBF7] p-3 border border-[#E5E1D8] rounded">
                      <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1.5">Admitted Facts Matrix</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {analysis.stage0.admittedFacts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50/40 p-3 border border-red-200/50 rounded">
                      <h4 className="font-bold text-[#991b1b] font-mono uppercase text-[10px] tracking-wider mb-1.5">Disputed Contested Facts</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {analysis.stage0.disputedFacts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 1 */}
              {activeStage === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F9F7F2] border border-[#E5E1D8] rounded">
                    <div className="text-[10px] font-mono text-[#C5A059] font-bold uppercase tracking-wider">Classification Output</div>
                    <h4 className="text-sm font-bold text-[#1E252B] mt-1">Primary Domain: {analysis.stage1.primaryDomain}</h4>
                    {analysis.stage1.subsidiaryDomains.length > 0 && (
                      <p className="text-xs text-[#4A5560] mt-1">
                        Subsidiaries: {analysis.stage1.subsidiaryDomains.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Statutory Trigger Fact Matrix</h4>
                    <div className="space-y-2">
                      {analysis.stage1.triggerFacts.map((t, i) => (
                        <div key={i} className="p-3 border border-[#E5E1D8] bg-white rounded flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded mr-1.5 font-bold">
                              {t.domain}
                            </span>
                            <span className="font-medium text-[#1E252B]">{t.fact}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#C5A059] font-bold self-start sm:self-center">
                            Trigger: {t.statutoryTrigger}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2 */}
              {activeStage === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#1E252B] text-white p-4 rounded border-l-4 border-[#C5A059]">
                    <span className="text-[9px] font-mono text-[#C5A059] font-bold tracking-wider uppercase">Governing Enactment</span>
                    <h4 className="text-sm font-bold mt-0.5">{analysis.stage2.primaryAct}</h4>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Relevant Statutory Provisions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.stage2.relevantSections.map((s, i) => (
                        <div key={i} className="p-3 border border-[#E5E1D8] rounded bg-[#FDFBF7]">
                          <div className="font-bold text-[#1E252B] flex items-center justify-between">
                            <span>{s.actName}</span>
                            <code className="bg-[#1E252B] text-[#C5A059] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              {s.sectionOrRule}
                            </code>
                          </div>
                          <p className="text-[11px] text-[#4A5560] mt-1.5">{s.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysis.stage2.precedents.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">High Court / Appellate Division Precedents</h4>
                      <div className="space-y-2">
                        {analysis.stage2.precedents.map((p, i) => (
                          <div key={i} className="p-3 border border-[#E5E1D8] bg-white rounded">
                            <div className="flex justify-between items-center text-[11px] font-bold text-[#1E252B]">
                              <span className="font-mono text-[#C5A059] font-bold uppercase tracking-wider">{p.citation}</span>
                              <span className="bg-[#1E252B]/10 px-1.5 py-0.5 rounded text-[10px] text-[#1E252B]">{p.court}</span>
                            </div>
                            <p className="font-medium text-[#1E252B] mt-1">Holding: "{p.holding}"</p>
                            <p className="text-[10px] text-neutral-500 italic mt-0.5">Relevance: {p.relevance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3 */}
              {activeStage === 3 && (
                <div className="space-y-4">
                  <div className={`p-4 border rounded ${
                    analysis.stage3.isTimeBarred 
                      ? "bg-red-50 text-red-900 border-red-200" 
                      : "bg-emerald-50 text-emerald-900 border-emerald-200"
                  }`}>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider">Limitation Decision</div>
                    <h4 className="text-sm font-bold mt-1">
                      {analysis.stage3.isTimeBarred ? "⚠️ SUIT APPARENTLY TIME BARRED" : "✓ SUIT IS WITHIN LIMITATION WINDOW"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <strong>Date of Accrual of Cause of Action:</strong>
                        <p className="font-mono text-[#1E252B]">{analysis.stage3.accrualDate}</p>
                      </div>
                      <div>
                        <strong>Schedule Article Applied:</strong>
                        <p className="font-mono text-[#1E252B]">{analysis.stage3.limitationArticle}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <strong>Prescribed Limitation Period:</strong>
                        <p className="font-mono text-[#1E252B]">{analysis.stage3.prescribedPeriod}</p>
                      </div>
                      <div>
                        <strong>Exceptions, Condonations & Laches:</strong>
                        <p className="text-neutral-500">{analysis.stage3.exceptionsOrExtensions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FDFBF7] p-3 border border-[#E5E1D8] rounded text-[11px] italic">
                    <strong>Limitation Assessment:</strong> {analysis.stage3.preliminaryAnalysis}
                  </div>
                </div>
              )}

              {/* STAGE 4 */}
              {activeStage === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider border-b border-[#E5E1D8] pb-1">Plaintiffs</h4>
                      {analysis.stage4.plaintiffs.map((p, i) => (
                        <div key={i} className="p-2.5 bg-[#FDFBF7] border border-[#E5E1D8] rounded text-[11px]">
                          <strong>{p.name}</strong> ({p.legalIdentity})
                          <div className="text-neutral-500 mt-0.5">Capacity: {p.capacity}</div>
                          <div className="text-neutral-500">Locus: {p.causeOfActionAccess}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider border-b border-[#E5E1D8] pb-1">Defendants</h4>
                      {analysis.stage4.defendants.map((d, i) => (
                        <div key={i} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded text-[11px]">
                          <strong>{d.name}</strong> ({d.legalIdentity})
                          <div className="text-neutral-500 mt-0.5">Capacity: {d.capacity}</div>
                          <div className="text-neutral-500">Liability: {d.liabilityType}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-3 border border-[#E5E1D8] rounded">
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Locus Standi Summary</span>
                      <p className="mt-0.5 text-[#4A5560]">{analysis.stage4.locusStandiSummary}</p>
                    </div>
                    <div className="bg-white p-3 border border-[#E5E1D8] rounded">
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Joinder & Misjoinder Issues</span>
                      <p className="mt-0.5 text-[#4A5560]">{analysis.stage4.joinderIssues}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 5 */}
              {activeStage === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-[#FDFBF7] border border-[#E5E1D8] rounded">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Territorial</h5>
                      <p className="text-[11px]">{analysis.stage5.territorial.rule}</p>
                      <span className="text-[9px] font-mono text-[#C5A059] block mt-1">Section: {analysis.stage5.territorial.governingSection}</span>
                    </div>
                    <div className="p-3 bg-[#FDFBF7] border border-[#E5E1D8] rounded">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Pecuniary</h5>
                      <p className="text-[11px]">Valuation: {analysis.stage5.pecuniary.valuation}</p>
                      <p className="text-[11px] font-bold text-[#C5A059]">{analysis.stage5.pecuniary.courtLevel}</p>
                    </div>
                    <div className="p-3 bg-[#FDFBF7] border border-[#E5E1D8] rounded">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Subject Matter</h5>
                      <p className="text-[11px]">Forum: {analysis.stage5.subjectMatter.forum}</p>
                      <span className="text-[9px] font-mono text-neutral-500 block mt-1">Statute: {analysis.stage5.subjectMatter.governingStatute}</span>
                    </div>
                  </div>

                  <div className="p-3 border border-red-200 bg-red-50/25 rounded text-[11px]">
                    <strong>Objection Counter-Strategy:</strong> {analysis.stage5.objectionStrategy}
                  </div>
                </div>
              )}

              {/* STAGE 6 */}
              {activeStage === 6 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-2">Pleadings Plaint Checklist (CPC Order VII)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.stage6.plaintChecklist.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-amber-50/20 p-3 border border-amber-200/50 rounded">
                      <h5 className="font-bold text-amber-800 font-mono uppercase text-[10px] tracking-wider mb-1">Grounds for Plaint Rejection (O7 R11)</h5>
                      {analysis.stage6.groundsForRejection.length === 0 ? (
                        <p className="text-[11px] italic text-neutral-500">No grounds detected for rejection of plaint.</p>
                      ) : (
                        <ul className="list-disc pl-4 text-[11px] text-amber-900 space-y-0.5">
                          {analysis.stage6.groundsForRejection.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      )}
                    </div>
                    <div className="bg-white p-3 border border-[#E5E1D8] rounded text-[11px]">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Written Statement Deemed Admissions</h5>
                      <p>{analysis.stage6.writtenStatementDeemedAdmissions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 7 */}
              {activeStage === 7 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Framed Issues of Fact and Law (CPC Order XIV)</h4>
                  <div className="space-y-3">
                    {analysis.stage7.issues.map((iss) => (
                      <div key={iss.issueNo} className="p-3 bg-white border border-[#E5E1D8] rounded">
                        <div className="flex justify-between items-start gap-2 font-bold text-[#1E252B]">
                          <span>Issue {iss.issueNo}: Is {iss.title}?</span>
                          <span className="flex-shrink-0 text-[9px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-bold uppercase">
                            {iss.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-[11px] text-[#4A5560]">
                          <div>
                            <strong>Burden of Proof:</strong> {iss.burden}
                          </div>
                          <div>
                            <strong>Evidentiary Requirements:</strong> {iss.evidenceRequired}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 8 */}
              {activeStage === 8 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-2">Classified Evidentiary Matrix</h4>
                    <div className="space-y-2">
                      {analysis.stage8.evidenceList.map((ev, i) => (
                        <div key={i} className="p-3 border border-[#E5E1D8] bg-[#FDFBF7] rounded">
                          <div className="flex justify-between font-bold text-[#1E252B]">
                            <span>{ev.item}</span>
                            <span className="font-mono text-[9px] text-neutral-500">{ev.type}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5 text-[11px] text-neutral-600">
                            <div>Source: <strong>{ev.source}</strong></div>
                            <div>Section: <code>{ev.governingSection}</code></div>
                            <div>Challenge: <span className="text-amber-700 italic">{ev.admissibilityChallenge}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 border border-[#E5E1D8] rounded">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Burden Allocation</h5>
                      <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                        {analysis.stage8.burdenAssignments.map((ba, i) => <li key={i}>{ba}</li>)}
                      </ul>
                    </div>
                    <div className="bg-white p-3 border border-[#E5E1D8] rounded">
                      <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Statutory Presumptions</h5>
                      {analysis.stage8.statutoryPresumptions.map((p, i) => (
                        <div key={i} className="text-[11px] border-b border-neutral-100 pb-1.5 last:border-0 last:pb-0 mb-1.5 last:mb-0">
                          <strong>{p.statuteSection}</strong>: {p.presumptionStyle}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 9 */}
              {activeStage === 9 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Anticipated Two-Sided Trial Contest</h4>
                  <div className="space-y-3">
                    {analysis.stage9.issueDetails.map((det) => (
                      <div key={det.issueNo} className="p-4 bg-white border border-[#E5E1D8] rounded space-y-2.5">
                        <h5 className="font-bold text-sm text-[#1E252B]">
                          Issue {det.issueNo}: {det.issueTitle}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2 bg-blue-50/20 border border-blue-200/50 rounded">
                            <strong className="text-blue-900 font-mono text-[9px] uppercase">Plaintiff Position</strong>
                            <p className="mt-0.5">{det.plaintiffPosition}</p>
                          </div>
                          <div className="p-2 bg-red-50/20 border border-red-200/50 rounded">
                            <strong className="text-red-900 font-mono text-[9px] uppercase">Defendant Position</strong>
                            <p className="mt-0.5">{det.defendantPosition}</p>
                          </div>
                        </div>
                        <div className="p-2.5 bg-[#FDFBF7] border border-[#E5E1D8] rounded text-[11px]">
                          <div className="font-bold text-[#C5A059] font-mono text-[9px] uppercase">Judicial Assessment & Projected Holding</div>
                          <p className="font-semibold text-[#1E252B] mt-0.5">{det.projectedFinding}</p>
                          <p className="text-neutral-500 italic mt-0.5">{det.courtAnalysis}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 10 */}
              {activeStage === 10 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-2">Equitable Principles Checked</h4>
                    <div className="space-y-2">
                      {analysis.stage10.applicablePrinciples.map((ap, i) => (
                        <div key={i} className="p-3 border border-[#E5E1D8] rounded bg-[#FDFBF7] text-[11px]">
                          <strong className="text-[#1E252B]">{ap.principle}</strong>
                          <div className="text-neutral-500 mt-0.5">Application: {ap.application}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-[#E5E1D8] rounded text-[11px]">
                    <h5 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider mb-1">Discretionary Relief Audits</h5>
                    <p>{analysis.stage10.discretionaryReliefCheck}</p>
                  </div>
                </div>
              )}

              {/* STAGE 11 */}
              {activeStage === 11 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Civil Procedure Lifecycle Milestones</h4>
                  <div className="relative border-l-2 border-[#C5A059] ml-2 pl-4 space-y-4">
                    {analysis.stage11.timelineProgress.map((tp, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#C5A059] border-4 border-white" />
                        <div className="text-[11px]">
                          <div className="font-bold text-[#1E252B]">{tp.stageName} <span className="font-mono text-[9px] font-bold text-neutral-400">({tp.cpcReference})</span></div>
                          <p className="text-[#4A5560] mt-0.5">Actions: {tp.subActions}</p>
                          <p className="text-[#C5A059] font-medium font-mono text-[10px] uppercase mt-0.5">Strategy: {tp.strategicPlay}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 12 */}
              {activeStage === 12 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#1E252B] font-mono uppercase text-[10px] tracking-wider">Appellate Hierarchy Cascade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.stage12.appealNodes.map((n, i) => (
                      <div key={i} className="p-3 bg-white border border-[#E5E1D8] rounded text-xs">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-1 mb-2">
                          <strong className="text-[#1E252B]">{n.level}</strong>
                          <code className="bg-[#1E252B] text-[#C5A059] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {n.governingSection}
                          </code>
                        </div>
                        <div className="text-[#4A5560]">
                          <div>Authority: <strong>{n.authority}</strong></div>
                          <div className="mt-1">Scope: {n.scope}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 13 */}
              {activeStage === 13 && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#FDFBF7] border border-[#C5A059] rounded border-l-8 text-xs">
                    <span className="text-[9px] font-mono font-bold text-[#C5A059] uppercase tracking-wider block">Overview Analysis Synthesized</span>
                    <p className="mt-1 font-sans italic text-[#1E252B] font-medium leading-relaxed">
                      "{analysis.stage13.overview}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-3 bg-white border border-[#E5E1D8] rounded">
                      <strong className="text-[#1E252B] uppercase tracking-wider font-mono text-[9px] block mb-1">Proposed Decree & reliefs</strong>
                      <p>{analysis.stage13.reliefDecree}</p>
                    </div>
                    <div className="p-3 bg-white border border-[#E5E1D8] rounded">
                      <strong className="text-[#1E252B] uppercase tracking-wider font-mono text-[9px] block mb-1">Execution pathway (Order XXI)</strong>
                      <p>{analysis.stage13.executionPathway}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] pt-1">
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                      <strong className="text-[#1E252B] uppercase tracking-wider font-mono text-[9px] block mb-0.5">Costs Apportionment (s.35)</strong>
                      <p className="text-neutral-500">{analysis.stage13.costsApportionment}</p>
                    </div>
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                      <strong className="text-[#1E252B] uppercase tracking-wider font-mono text-[9px] block mb-0.5">Equitable Bars & Laches</strong>
                      <p className="text-neutral-500">{analysis.stage13.equitableBars}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Forensic Hash Footer */}
          <div className="border-t border-[#E5E1D8]/60 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-[#C5A059] gap-2">
            <div>
              FORENSIC SECURE NODE &bull; BCCAA v2.0
            </div>
            {analysis._security?.forensicHash && (
              <div className="bg-neutral-100 text-[#1E252B] px-2 py-0.5 rounded border border-[#E5E1D8]">
                HASH: {analysis._security.forensicHash}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
