import React, { useState, useEffect } from "react";
import { Scale, FileText, BookOpen, ShieldAlert, Sparkles, Hammer, History, RotateCcw, Copy, Check, X } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import { BCCAAEngine } from "./engine/BCCAAEngine";
import { generateWatermark } from "./utils/watermark";
import { downloadSecurePDF } from "./utils/pdfGeneratorSecure";
import { logAudit } from "./utils/audit";
import { CaseAnalysisResponse, CaseHistoryItem } from "./types/types";
import StageExplorer from "./components/StageExplorer";
import MissingEvidenceAlert from "./components/MissingEvidenceAlert";
import AIComparePanel from "./components/AIComparePanel";
import LoginPage from "./auth/LoginPage";
import SuperAdminDashboard from "./admin/SuperAdminDashboard";

export default function App() {
  const { state, getCurrentUser, getLicense, logout, hasPermission } = useAuth();
  const [factPattern, setFactPattern] = useState("");
  const [focusDomain, setFocusDomain] = useState("Auto-detect");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<CaseHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const user = getCurrentUser();
  const license = getLicense();

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("neumlex_case_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  const saveToHistory = (analysis: CaseAnalysisResponse, facts: string, domain: string) => {
    try {
      const newItem: CaseHistoryItem = {
        id: `case_${Date.now()}`,
        timestamp: Date.now(),
        title: analysis.stage2.primaryAct || "Civil Suit Analysis",
        primaryDomain: analysis.stage1.primaryDomain,
        courtLevel: analysis.stage5.pecuniary.courtLevel,
        isTimeBarred: analysis.stage3.isTimeBarred,
        factPattern: facts,
        focusDomain: domain,
        analysis,
        encrypted: false,
        accessLog: [{ userId: user?.id || "unknown", accessedAt: Date.now(), action: "view" }],
      };
      setHistory(prev => {
        const filtered = prev.filter(item => item.factPattern.trim() !== facts.trim());
        const updated = [newItem, ...filtered].slice(0, 10);
        localStorage.setItem("neumlex_case_history", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  const loadingSteps = [
    "Stage 0: Structuring Fact Matrix...",
    "Stage 1: Determining Civil Jurisdictional Domain...",
    "Stage 2: Cross-referencing Acts & Precedents...",
    "Stage 3: Running Critical Limitation Check...",
    "Stage 4: Auditing Legal Capacity & Locus Standi...",
    "Stage 5: Determining Competent Suit Forums...",
    "Stage 6: Verifying Pleadings & Defences...",
    "Stage 7 & 8: Formulating Issues & Evidence Maps...",
    "Stage 9: Structuring Two-Sided Trial Contest...",
    "Stage 10: Applying Equitable Defences...",
    "Stage 11 & 12: Charting Lifecycles & Appeals...",
    "Stage 13: Compiling Final Jurisprudential Synthesis...",
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factPattern.trim() || !user || !license) return;

    // Check daily limit
    const today = new Date().toISOString().split("T")[0];
    if (user.lastCaseDate !== today) {
      user.casesToday = 0;
      user.lastCaseDate = today;
    }
    const limit = user.role === "super_admin" ? Infinity : user.role === "admin" ? 100 : 10;
    if (user.casesToday >= limit) {
      alert("Daily analysis limit reached. Contact Super Admin.");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 400);

    try {
      // OFFLINE ENGINE — NO API CALL
      const engine = new BCCAAEngine(user, license);
      const result = await engine.analyze({
        factPattern,
        focusDomain,
        user,
        license,
      });

      user.casesToday++;
      setAnalysisResult(result);
      saveToHistory(result, factPattern, focusDomain);

      logAudit({
        action: "ANALYZE_COMPLETE",
        userId: user.id,
        email: user.email,
        role: user.role,
        resourceType: "CASE",
        resourceId: result._security?.forensicHash || "unknown",
        outcome: "SUCCESS",
      });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      logAudit({
        action: "ANALYZE_FAILED",
        userId: user.id,
        email: user.email,
        role: user.role,
        resourceType: "CASE",
        resourceId: "unknown",
        outcome: "FAILURE",
        metadata: { error: err.message },
      });
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!analysisResult || !user || !license) return;
    const watermark = generateWatermark(user, license, `BCCAA-${Date.now()}`);
    downloadSecurePDF(analysisResult, factPattern, watermark);
    logAudit({
      action: "EXPORT_PDF",
      userId: user.id,
      email: user.email,
      role: user.role,
      resourceType: "CASE",
      resourceId: watermark.caseId,
      outcome: "SUCCESS",
    });
  };

  const handleCopyReport = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setFactPattern("");
    setFocusDomain("Auto-detect");
  };

  // If not authenticated, show login
  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  // If showing admin dashboard
  if (showAdmin && hasPermission("admin:dashboard")) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowAdmin(false)}
          className="fixed top-4 left-4 z-50 px-3 py-2 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] rounded text-xs font-mono transition cursor-pointer"
        >
          ← Back to Analysis
        </button>
        <SuperAdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-[#1E252B] relative">
      {/* Top Border Accent Line */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#C5A059] z-50" />

      {/* Header */}
      <header className="border-b-4 border-[#C5A059] bg-[#1E252B] text-[#FDFBF7] py-6 px-6 sm:px-10 mt-1">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Scale className="h-5 w-5 stroke-[1.5]" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase">Jurisprudential Analytical Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-serif text-white leading-tight">
              Bangladesh Civil Case Analysis Architecture
            </h1>
            <p className="text-[10px] text-[#E5E1D8]/60 font-mono tracking-widest uppercase">
              BCCAA v2.0 SECURE OFFLINE &bull; SYSTEM STATIC NODE
            </p>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] font-mono">
              <span className="inline-flex items-center gap-2 bg-[#C5A059]/15 px-2.5 py-1 border border-[#C5A059]/35 text-[#C5A059]">
                <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
                <strong>License:</strong> {license?.issuedTo}
              </span>
              <span className="inline-flex items-center gap-2 bg-[#FDFBF7]/10 px-2.5 py-1 border border-[#FDFBF7]/20 text-[#E5E1D8]">
                <strong>Role:</strong> {user?.role?.toUpperCase()}
              </span>
              {hasPermission("admin:dashboard") && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500/15 px-2.5 py-1 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px]"
                >
                  <ShieldAlert className="h-3 w-3 text-[#C5A059]" />
                  Admin Dashboard
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-4 py-2 bg-neutral-850 hover:bg-[#C5A059] text-[#E5E1D8] hover:text-[#1E252B] border border-neutral-700 hover:border-[#C5A059] text-xs font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
            >
              <History className="h-4 w-4" />
              <span>Archive ({history.length})</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/35 hover:border-red-600 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 mt-10 mb-20 w-full flex-1">
        {!analysisResult && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Input Form Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border-2 border-[#1E252B] relative p-6 sm:p-8">
                {/* Geometric accent corners */}
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#C5A059]" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#C5A059]" />
                <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#C5A059]" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#C5A059]" />

                <div className="border-b-2 border-[#1E252B] pb-4 mb-6">
                  <h2 className="text-xl font-bold font-serif flex items-center gap-2.5 text-[#1E252B]">
                    <BookOpen className="h-5.5 w-5.5 text-[#C5A059]" />
                    Assemble Litigation Fact Pattern
                  </h2>
                  <p className="text-xs text-[#4A5560] mt-1.5 leading-relaxed">
                    Provide the raw factual record, deed timelines, possession sequences, or statutory breaches. The secure local cascade engine will isolate critical parameters across 14 discrete analytical gateways.
                  </p>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                      Dispute Narrative (Chronology, Registry, and Specific Grievances)
                    </label>
                    <textarea
                      value={factPattern}
                      onChange={e => setFactPattern(e.target.value)}
                      required
                      placeholder="Input chronological dispute events, specific dates (e.g. registry dates, date of contract breach), property details, and claims..."
                      rows={12}
                      className="w-full text-xs font-mono p-4 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] focus:ring-1 focus:ring-[#1E252B] outline-none text-[#1E252B] leading-relaxed resize-y max-h-[60vh] shadow-inner transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                        Civil Domain Scope
                      </label>
                      <select
                        value={focusDomain}
                        onChange={e => setFocusDomain(e.target.value)}
                        className="w-full text-xs font-mono p-3 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] focus:ring-1 focus:ring-[#1E252B] outline-none text-[#1E252B] transition-all"
                      >
                        <option value="Auto-detect">Auto-detect (Recommended)</option>
                        <option value="Specific Performance">Specific Performance (SRA 1877 s.12)</option>
                        <option value="Declaration of Title">Declaration of Title & Partition</option>
                        <option value="Tenancy">Commercial Tenancy / Eviction</option>
                        <option value="Recovery">Recovery of Money / Damages</option>
                        <option value="Injunction">Injunction (SRA 1877 ss.52-57)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={loading || !factPattern.trim()}
                        className="w-full py-3.5 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] disabled:bg-neutral-200 disabled:text-neutral-400 font-bold uppercase text-xs tracking-widest font-mono border border-[#1E252B] hover:border-[#C5A059] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Hammer className="h-4 w-4 animate-spin text-[#C5A059]" />
                            Sequencing 14 Gates...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-[#C5A059]" />
                            Analyze Civil Case Pattern
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Guidelines Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border-2 border-[#1E252B] p-6 relative">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#C5A059]" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#C5A059]" />
                
                <h3 className="text-xs font-mono font-bold text-[#C5A059] uppercase tracking-widest border-b border-[#E5E1D8] pb-2.5 mb-4">
                  Secure Offline Protocol
                </h3>
                
                <div className="space-y-4 text-xs text-[#4A5560] leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="text-[#C5A059] font-bold text-sm flex-shrink-0 leading-none">&#9632;</span>
                    <div>
                      <strong className="text-[#1E252B]">Zero External API Calls</strong>
                      <p className="mt-0.5 text-[11px]">All legal deduction arrays run completely client-side. No legal files, fact inputs, or parameters are transmitted.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#C5A059] font-bold text-sm flex-shrink-0 leading-none">&#9632;</span>
                    <div>
                      <strong className="text-[#1E252B]">Deterministic Legal Logic</strong>
                      <p className="mt-0.5 text-[11px]">Calculates limitations, court tiers, court fees, and jurisdiction metrics mathematically according to statutory CPC standards.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#C5A059] font-bold text-sm flex-shrink-0 leading-none">&#9632;</span>
                    <div>
                      <strong className="text-[#1E252B]">Dynamic License Audits</strong>
                      <p className="mt-0.5 text-[11px]">Validates compliance signature bounds instantly to preserve forensic data containment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#C5A059] font-bold text-sm flex-shrink-0 leading-none">&#9632;</span>
                    <div>
                      <strong className="text-[#1E252B]">Chain-of-Custody Hashing</strong>
                      <p className="mt-0.5 text-[11px]">Logs each audit transaction sequentially using a local cryptohash block to prevent retrospective manipulation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay state */}
        {loading && (
          <div className="max-w-2xl mx-auto bg-white border-2 border-[#1E252B] p-8 space-y-6 relative mt-6">
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#C5A059]" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#C5A059]" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#C5A059]" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#C5A059]" />

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold font-serif text-[#1E252B]">Executing BCCAA Gateways</h3>
              <p className="text-xs text-[#C5A059] font-mono font-bold uppercase tracking-widest">
                Gateway Node {loadingStep + 1} of {loadingSteps.length}
              </p>
            </div>

            <div className="bg-[#FDFBF7] border border-[#E5E1D8] p-4 font-mono text-xs flex items-center justify-between">
              <span className="text-[#1E252B] uppercase tracking-wider font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 animate-ping inline-block" />
                {loadingSteps[loadingStep]}
              </span>
              <span className="text-neutral-400">STATUS: CALIBRATING</span>
            </div>

            <div className="w-full bg-[#E5E1D8] h-3 border border-[#1E252B] overflow-hidden">
              <div 
                className="bg-[#1E252B] h-full transition-all duration-300" 
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Analysis Result Layout */}
        {analysisResult && !loading && (
          <div className="space-y-10">
            {/* Quick Actions Panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white border-2 border-[#1E252B] gap-4 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#C5A059]" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono text-[#C5A059] font-bold uppercase tracking-widest">Processing Complete</div>
                <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-[#1E252B]">Integrated 14-Stage Report Ready</h3>
              </div>
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                <button 
                  onClick={handleCopyReport} 
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white hover:bg-neutral-55 border border-[#1E252B] text-[#1E252B] flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <button 
                  onClick={handleExportPDF} 
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-[#C5A059] hover:bg-[#1E252B] hover:text-[#FDFBF7] text-[#1E252B] border border-[#1E252B] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Export Secure PDF
                </button>
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] border border-[#1E252B] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New Analysis
                </button>
              </div>
            </div>

            {/* Case Brief Summary Dashboard */}
            <div className="p-6 sm:p-8 bg-white border-2 border-[#1E252B] relative overflow-hidden">
              <div className="absolute right-6 top-6 hidden md:block opacity-5 text-[#1E252B]">
                <Scale className="w-28 h-28 stroke-[1]" />
              </div>
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]" />

              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest">BCCAA Case Brief Summary</div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-[#1E252B]">
                    {analysisResult.stage2.primaryAct}
                  </h2>
                  <div className="flex flex-wrap gap-2.5 items-center mt-4">
                    <span className="px-3 py-1 bg-[#FDFBF7] border border-[#E5E1D8] text-[11px] font-mono text-[#1E252B]">
                      Domain: <strong>{analysisResult.stage1.primaryDomain}</strong>
                    </span>
                    <span className="px-3 py-1 bg-[#FDFBF7] border border-[#E5E1D8] text-[11px] font-mono text-[#1E252B]">
                      Court: <strong>{analysisResult.stage5.pecuniary.courtLevel}</strong>
                    </span>
                    <span className={`px-3 py-1 border font-mono font-bold text-[10px] uppercase tracking-wider ${analysisResult.stage3.isTimeBarred ? "bg-red-55 border-red-300 text-red-900" : "bg-emerald-55 border-emerald-300 text-emerald-900"}`}>
                      Limitation: {analysisResult.stage3.isTimeBarred ? "TIME BARRED" : "MAINTAINABLE"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs leading-relaxed text-[#4A5560] mt-6 pt-5 border-t border-[#E5E1D8] italic bg-[#FDFBF7] p-4 border-l-4 border-l-[#C5A059]">
                <span className="font-mono font-bold text-[10px] text-[#C5A059] uppercase block not-italic mb-1.5 tracking-wider">Executive Synthesis:</span>
                {analysisResult.stage13.overview}
              </div>
            </div>

            {/* Missing Evidence Alert Panel */}
            <MissingEvidenceAlert analysis={analysisResult} />

            {/* AI Comparison Panel */}
            <AIComparePanel factPattern={factPattern} analysisResult={analysisResult} />

            {/* Stage-by-Stage Explorer */}
            <StageExplorer analysis={analysisResult} />
          </div>
        )}
      </main>

      {/* History Archive Drawer */}
      {isHistoryOpen && (
        <>
          <div className="fixed inset-0 bg-[#1E252B]/40 backdrop-blur-xs z-55 transition-opacity" onClick={() => setIsHistoryOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-80 sm:w-100 bg-[#FDFBF7] border-l-4 border-[#1E252B] shadow-2xl z-55 flex flex-col font-sans">
            <div className="p-5 border-b-2 border-[#1E252B] flex items-center justify-between bg-[#1E252B] text-[#FDFBF7]">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#C5A059]" />
                <span className="font-serif font-bold text-base tracking-wide text-white">CASE ARCHIVE</span>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)} 
                className="text-[#E5E1D8] hover:text-[#C5A059] transition-all cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.length === 0 ? (
                <div className="text-center p-8 text-xs text-[#4A5560] italic font-mono border border-dashed border-[#E5E1D8]">
                  No saved cases in local session.
                </div>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => { setAnalysisResult(item.analysis); setFactPattern(item.factPattern); setIsHistoryOpen(false); }}
                    className="p-4 border-2 border-[#E5E1D8] hover:border-[#1E252B] cursor-pointer transition bg-white space-y-2 relative"
                  >
                    <div className="text-xs font-bold text-[#1E252B] line-clamp-1">{item.title}</div>
                    <p className="text-[11px] text-[#4A5560] line-clamp-2 italic font-serif">"{item.factPattern}"</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#E5E1D8] text-[9px] font-mono text-[#C5A059] font-bold uppercase tracking-wider">
                      <span>{item.primaryDomain.split(" ")[0]}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer Status Bar (Geometric Balance layout) */}
      <footer className="w-full bg-[#F9F7F2] border-t-2 border-[#1E252B] py-5 px-6 sm:px-10 mt-auto z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-mono text-[#1E252B]">
          <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span><strong>SYSTEM READY:</strong> OFFLINE DESKTOP GATEWAY</span>
        </div>
        <div className="text-center">
          <p className="font-bold text-xs uppercase tracking-widest text-[#1E252B] font-serif">Neum Lex Counsel</p>
          <p className="text-[10px] font-mono text-[#4A5560] mt-0.5">Supreme Court of Bangladesh</p>
        </div>
        <div className="text-center md:text-right font-mono text-[10px] text-[#4A5560] space-y-0.5">
          <p>Author & Rights Holder: <strong className="text-[#1E252B]">Md. Nazmul Islam</strong></p>
          <p className="text-[#C5A059] uppercase tracking-wider font-bold">BCCAA v2.0 Client Secure Offline</p>
        </div>
      </footer>
    </div>
  );
}
