import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, FileCheck, Loader2, ShieldCheck, Sparkles, X, Trash2, RotateCcw, FolderOpen, History, ArrowUpRight } from "lucide-react";

import * as pdfjsLib from "pdfjs-dist";
import { generateSecureId } from "../utils/crypto";

// Set pdfjs worker source safely to matching cdnjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ExtractedDoc {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  extractedText: string;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  timestamp: number;
  isDeleted?: boolean;
}

interface DocumentUploaderProps {
  onTextExtracted: (text: string, mode: "replace" | "append") => void;
  onClearText?: () => void;
  currentTextLength: number;
}

const DOC_STORAGE_KEY = "_bccaa_doc_vault";

export default function DocumentUploader({ onTextExtracted, onClearText, currentTextLength }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [activeDoc, setActiveDoc] = useState<ExtractedDoc | null>(null);
  const [docHistory, setDocHistory] = useState<ExtractedDoc[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load document history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOC_STORAGE_KEY);
      if (saved) {
        const parsed: ExtractedDoc[] = JSON.parse(saved);
        setDocHistory(parsed);
        // Set active doc if there's an active non-deleted doc
        const latestActive = parsed.find(d => !d.isDeleted);
        if (latestActive && !activeDoc) {
          setActiveDoc(latestActive);
        }
      }
    } catch (e) {
      console.warn("Failed to load document history", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (updatedHistory: ExtractedDoc[]) => {
    setDocHistory(updatedHistory);
    try {
      localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(updatedHistory.slice(0, 20)));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  };

  // Helper to format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Process selected file
  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProgress({ current: 0, total: 100, status: "Initializing secure local reader..." });

    const fileName = file.name;
    const fileSize = formatBytes(file.size);
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    try {
      let text = "";
      let pages = 1;

      if (ext === "pdf" || file.type === "application/pdf") {
        setProgress({ current: 10, total: 100, status: "Loading PDF binary stream locally..." });
        const arrayBuffer = await file.arrayBuffer();
        
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          pages = pdf.numPages;

          let pdfText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const pageProgress = Math.round((i / pdf.numPages) * 90);
            setProgress({
              current: pageProgress,
              total: 100,
              status: `Parsing page ${i} of ${pdf.numPages}...`
            });

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageItems = textContent.items.map((item: any) => item.str || "").join(" ");
            
            if (pageItems.trim()) {
              pdfText += `[DOCUMENT PAGE ${i}]\n${pageItems.trim()}\n\n`;
            }
          }
          text = pdfText.trim();
        } catch (pdfErr: any) {
          console.warn("PDF worker extraction fallback triggered:", pdfErr);
          text = await readAsPlainText(file);
        }
      } else {
        setProgress({ current: 50, total: 100, status: "Reading local text file contents..." });
        text = await readAsPlainText(file);
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Could not extract printable text from this document. Please ensure the file contains searchable text rather than scanned images.");
      }

      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const charCount = text.length;

      const newDoc: ExtractedDoc = {
        id: generateSecureId(),
        fileName,
        fileSize,
        fileType: ext.toUpperCase(),
        extractedText: text,
        wordCount,
        charCount,
        pageCount: pages,
        timestamp: Date.now(),
        isDeleted: false
      };

      setActiveDoc(newDoc);
      const updated = [newDoc, ...docHistory.filter(d => d.fileName !== fileName)];
      saveHistory(updated);

      // Auto set text into input
      onTextExtracted(text, "replace");

    } catch (err: any) {
      console.error("Document processing error:", err);
      setError(err.message || "Failed to process document locally.");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const readAsPlainText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Unable to read file as text."));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file stream."));
      reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Delete current active document
  const handleDeleteDoc = (docId: string, clearNarrativeText: boolean = true) => {
    const updated = docHistory.map(d => d.id === docId ? { ...d, isDeleted: true } : d);
    saveHistory(updated);

    if (activeDoc && activeDoc.id === docId) {
      setActiveDoc(null);
      if (clearNarrativeText && onClearText) {
        onClearText();
      }
    }
  };

  // Restore deleted document
  const handleRestoreDoc = (doc: ExtractedDoc) => {
    const updated = docHistory.map(d => d.id === doc.id ? { ...d, isDeleted: false } : d);
    saveHistory(updated);
    setActiveDoc({ ...doc, isDeleted: false });
    onTextExtracted(doc.extractedText, "replace");
  };

  // Permanently purge document from vault
  const handlePurgeDoc = (docId: string) => {
    const updated = docHistory.filter(d => d.id !== docId);
    saveHistory(updated);
    if (activeDoc && activeDoc.id === docId) {
      setActiveDoc(null);
    }
  };

  // Sample document test generators
  const loadSampleDocument = (type: "bainapatra" | "disowning") => {
    if (type === "bainapatra") {
      const sampleText = `CONVOLUTED LAND DISPUTE & BAINAPATRA BREACH (SPECIFIC PERFORMANCE)
====================================================================
FILE NO: REG-BD-2024-8892 | JURISDICTION: DHAKA JOINT DISTRICT JUDGE COURT

FACTUAL RECORD & DEED CHRONOLOGY:
1. On January 10, 2022, Plaintiff Rafiqul Islam entered into a registered Bainapatra (Agreement for Sale Deed No. 4451) with Defendant Abdul Barek for the purchase of 12 Decimals of land in Mouza Dhanmondi, Khatian No. 882, Plot No. 1045.
2. Total agreed consideration price was BDT 50,00,000/- (Fifty Lakh Taka).
3. On the execution date (Jan 10, 2022), the Plaintiff paid advance earnest money of BDT 30,00,000/- via Pay Order No. 458921 drawn on Sonali Bank Ltd.
4. The registered Bainapatra stipulated that the balance consideration of BDT 20,00,000/- was to be paid within 6 months (i.e., on or before July 10, 2022), whereupon Defendant Abdul Barek was obligated to execute and register the final Kabala Deed.
5. On June 15, 2022, Plaintiff Rafiqul Islam tendered the remaining balance of BDT 20,00,000/- via Bank Draft and requested Defendant Barek to appear at the Sub-Registry Office for Kabala registration.
6. Defendant Barek refused to accept the balance and delayed under various pretexts.
7. On August 20, 2022, Plaintiff sent a formal Legal Notice demanding performance within 15 days.
8. Defendant barefacedly refused performance on September 05, 2022, claiming he had sold the property to a third party.

STATUTORY GRIEVANCE:
Plaintiff seeks Specific Performance of the registered Bainapatra under Section 12 of the Specific Relief Act 1877, alongside a Temporary Injunction under Order XXXIX Rules 1 & 2 CPC to restrain Defendant from transferring the property.`;

      const newDoc: ExtractedDoc = {
        id: "DOC-SAMPLE-BAINA-4451",
        fileName: "Sample_Bainapatra_Agreement_Deed_4451.pdf",
        fileSize: "14.2 KB",
        fileType: "PDF",
        extractedText: sampleText,
        wordCount: sampleText.split(/\s+/).length,
        charCount: sampleText.length,
        pageCount: 2,
        timestamp: Date.now(),
        isDeleted: false
      };

      setActiveDoc(newDoc);
      saveHistory([newDoc, ...docHistory.filter(d => d.id !== newDoc.id)]);
      onTextExtracted(sampleText, "replace");
    } else {
      const sampleText = `PARTITION SUIT & NULLITY OF TEJYA PUTRO DISOWNING AFFIDAVIT
====================================================================
FILE NO: SUIT-PRT-2024-104 | JURISDICTION: KHULNA SENIOR JUDGE COURT

FACT PATTERN & INHERITANCE RECORD:
1. Ancestor late Hazi Karim Box died intestate on March 14, 2018, leaving behind 2 sons (Plaintiff Kamrul & Defendant Rahim) and 1 daughter (Defendant Fatema), along with 30 Decimals of ancestral land in Mouza Rupsha, Khatian 102.
2. Under Muslim Personal Law (Shariat) Application Act 1937, the 2 sons inherit 2/5th share each (12 Decimals each) and the daughter inherits 1/5th share (6 Decimals).
3. On November 10, 2023, Defendant Rahim produced a notarized "Tejya Putro Affidavit" executed by late Hazi Karim Box in 2015, purporting to disown Plaintiff Kamrul from all inheritance.
4. Based on this void affidavit, Defendant Rahim obtained an exclusive Namjari mutation in his sole name and threatened to alienate undivided suit land to third-party developers.
5. Plaintiff Kamrul remains in constructive joint possession of the suit property and seeks a decree of partition and declaration that the Tejya Putro affidavit is null, void, and inoperative in law.`;

      const newDoc: ExtractedDoc = {
        id: "DOC-SAMPLE-PARTITION-104",
        fileName: "Sample_Partition_Inheritance_CaseFile.txt",
        fileSize: "8.6 KB",
        fileType: "TXT",
        extractedText: sampleText,
        wordCount: sampleText.split(/\s+/).length,
        charCount: sampleText.length,
        pageCount: 1,
        timestamp: Date.now(),
        isDeleted: false
      };

      setActiveDoc(newDoc);
      saveHistory([newDoc, ...docHistory.filter(d => d.id !== newDoc.id)]);
      onTextExtracted(sampleText, "replace");
    }
  };

  const activeDocsList = docHistory.filter(d => !d.isDeleted);
  const deletedDocsList = docHistory.filter(d => d.isDeleted);

  return (
    <div className="bg-[#FAF9F5] border border-[#E5E1D8] p-4 sm:p-5 space-y-4 font-mono">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.doc,.docx,.csv,.md,.log"
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#C5A059]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E252B]">
            Local Document Ingestion Engine & Vault
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Document Vault & Restore History Toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="px-2.5 py-1 bg-white hover:bg-[#1E252B] hover:text-white border border-[#E5E1D8] text-[10px] font-bold text-[#1E252B] transition flex items-center gap-1.5 cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Document Vault</span>
            {deletedDocsList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[9px]">
                {deletedDocsList.length} deleted
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Secure Local Browser Processing</span>
          </div>
        </div>
      </div>

      {/* Dropzone area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
          isDragging
            ? "border-[#C5A059] bg-[#FAFBF9] scale-[1.01]"
            : "border-[#D5D0C5] hover:border-[#1E252B] bg-white"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E1D8] rounded-full text-[#C5A059]">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1E252B] uppercase tracking-wider">
              Drag & Drop Case File or Click to Upload
            </p>
            <p className="text-[10px] text-[#4A5560] mt-1">
              Supports <strong className="text-[#1E252B]">PDF</strong>, <strong className="text-[#1E252B]">TXT</strong>, <strong className="text-[#1E252B]">DOCX</strong>, <strong className="text-[#1E252B]">CSV</strong>, <strong className="text-[#1E252B]">MD</strong> documents
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-block px-3 py-1 bg-[#1E252B] text-white hover:bg-[#C5A059] hover:text-[#1E252B] text-[10px] font-bold uppercase tracking-widest transition">
              Select Document File
            </span>
          </div>
        </div>
      </div>

      {/* Quick sample loader buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px]">
        <span className="text-[#4A5560] font-bold uppercase tracking-wider">
          Or load sample case file:
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); loadSampleDocument("bainapatra"); }}
            className="px-2.5 py-1 bg-white hover:bg-[#1E252B] hover:text-white border border-[#E5E1D8] hover:border-[#1E252B] text-[#1E252B] font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-[#C5A059]" />
            Bainapatra Specific Performance (.pdf sample)
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); loadSampleDocument("disowning"); }}
            className="px-2.5 py-1 bg-white hover:bg-[#1E252B] hover:text-white border border-[#E5E1D8] hover:border-[#1E252B] text-[#1E252B] font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-[#C5A059]" />
            Partition & Tejya Putro (.txt sample)
          </button>
        </div>
      </div>

      {/* Progress status bar */}
      {isProcessing && progress && (
        <div className="p-3 bg-white border border-[#E5E1D8] space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-[#1E252B] flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C5A059]" />
              {progress.status}
            </span>
            <span className="font-bold text-[#C5A059]">{progress.current}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9F5] border border-[#E5E1D8] overflow-hidden">
            <div
              className="h-full bg-[#1E252B] transition-all duration-300"
              style={{ width: `${progress.current}%` }}
            />
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block">Extraction Error:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Extracted File Results Card */}
      {activeDoc && !isProcessing && (
        <div className="bg-white border-2 border-[#1E252B] p-4 space-y-3 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#FAF9F5] border border-[#E5E1D8] text-[#1E252B]">
                <FileCheck className="h-5 w-5 text-[#C5A059]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#1E252B]">
                    {activeDoc.fileName}
                  </h4>
                  <span className="px-1.5 py-0.5 bg-[#1E252B] text-white text-[9px] font-bold">
                    {activeDoc.fileType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#4A5560]">
                  <span>Size: <strong>{activeDoc.fileSize}</strong></span>
                  <span>Words: <strong>{activeDoc.wordCount}</strong></span>
                  <span>Chars: <strong>{activeDoc.charCount}</strong></span>
                  {activeDoc.pageCount && activeDoc.pageCount > 1 && (
                    <span>Pages: <strong>{activeDoc.pageCount}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Delete / Clear document controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDeleteDoc(activeDoc.id, true)}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                title="Delete Document and Clear Input"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Document</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-[#E5E1D8] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              Document extracted into Fact Pattern input!
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTextExtracted(activeDoc.extractedText, "replace")}
                className="px-3 py-1.5 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Re-apply Text
              </button>
              {currentTextLength > 0 && (
                <button
                  type="button"
                  onClick={() => onTextExtracted(activeDoc.extractedText, "append")}
                  className="px-3 py-1.5 bg-white hover:bg-[#1E252B] hover:text-white text-[#1E252B] border border-[#1E252B] text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Append to Existing Text
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Vault & Deleted History Drawer */}
      {showHistoryModal && (
        <div className="bg-white border-2 border-[#C5A059] p-4 space-y-4 relative">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#C5A059]" />
              <h4 className="text-xs font-bold text-[#1E252B] uppercase tracking-wider">
                Document Vault & Deleted File Restore Center
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="text-neutral-400 hover:text-neutral-800 p-1 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active Vault Files */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-[#1E252B]">
              Active Ingested Files ({activeDocsList.length})
            </p>
            {activeDocsList.length === 0 ? (
              <p className="text-[10px] text-neutral-500 italic">No active files in vault.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activeDocsList.map(doc => (
                  <div
                    key={doc.id}
                    className={`p-2 border text-[10px] flex items-center justify-between gap-2 transition ${
                      activeDoc?.id === doc.id
                        ? "bg-[#FAF9F5] border-[#1E252B] font-bold"
                        : "bg-white border-[#E5E1D8] hover:border-[#1E252B]"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-3.5 w-3.5 text-[#C5A059] flex-shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                      <span className="text-[9px] text-neutral-400">({doc.fileSize})</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDoc(doc);
                          onTextExtracted(doc.extractedText, "replace");
                        }}
                        className="px-2 py-0.5 bg-[#1E252B] text-white hover:bg-[#C5A059] hover:text-[#1E252B] text-[9px] font-bold uppercase transition cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, activeDoc?.id === doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Deleted Files / Trash Bin */}
          <div className="border-t border-[#E5E1D8] pt-3 space-y-2">
            <p className="text-[10px] font-bold uppercase text-red-800 flex items-center gap-1">
              <RotateCcw className="h-3.5 w-3.5 text-red-600" />
              Recently Deleted Files / Trash Bin ({deletedDocsList.length})
            </p>

            {deletedDocsList.length === 0 ? (
              <p className="text-[10px] text-neutral-500 italic">Trash bin is empty. No deleted files.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {deletedDocsList.map(doc => (
                  <div
                    key={doc.id}
                    className="p-2 bg-red-50/50 border border-red-200 text-[10px] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-neutral-600 line-through">
                      <FileText className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                      <span className="text-[9px]">({doc.fileSize})</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreDoc(doc)}
                        className="px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                        title="Restore Document back to active state"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore File
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePurgeDoc(doc.id)}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-red-700 text-neutral-700 hover:text-white text-[9px] font-bold uppercase transition cursor-pointer"
                        title="Permanently remove"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
