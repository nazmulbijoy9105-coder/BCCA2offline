import { CaseAnalysisResponse } from "../types/types";
import { Watermark } from "./watermark";

export function downloadSecurePDF(
  analysis: CaseAnalysisResponse,
  factPattern: string,
  watermark: Watermark
): void {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BCCAA Litigation Brief - ${analysis.stage2.primaryAct}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 40px;
      background-color: #fff;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .watermark-banner {
      background-color: #1E252B;
      color: #C5A059;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      padding: 10px;
      margin-bottom: 30px;
      border-radius: 4px;
      text-align: center;
      word-wrap: break-word;
      border: 1px solid #C5A059;
    }

    h1, h2, h3, h4 {
      font-family: 'Playfair Display', serif;
      color: #1E252B;
    }

    h1 {
      font-size: 28px;
      margin-bottom: 5px;
      border-bottom: 2px solid #C5A059;
      padding-bottom: 10px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      font-size: 12px;
      border: 1px solid #E5E1D8;
      padding: 15px;
      background-color: #FDFBF7;
    }

    .section-title {
      font-size: 18px;
      border-bottom: 1px solid #1E252B;
      padding-bottom: 5px;
      margin-top: 30px;
      color: #C5A059;
    }

    .monospace {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background-color: #FDFBF7;
      padding: 15px;
      border-left: 3px solid #1E252B;
      white-space: pre-wrap;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }

    .table th, .table td {
      border: 1px solid #E5E1D8;
      padding: 10px;
      text-align: left;
    }

    .table th {
      background-color: #1E252B;
      color: #fff;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-error { background-color: #fee2e2; color: #991b1b; }

    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
      
      footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        text-align: center;
        color: #777;
        border-top: 1px solid #ccc;
        padding-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="watermark-banner">
    ${watermark.visualString}
  </div>

  <div style="text-align: center; margin-bottom: 40px;">
    <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #C5A059; margin: 0;">Bangladesh Civil Case Analysis Architecture</h2>
    <h1>LITIGATION DISCOVERY & BRIEF</h1>
    <p style="font-style: italic; color: #555;">Generated Securely Offline &mdash; Zero Network Footprint</p>
  </div>

  <div class="meta-grid">
    <div>
      <strong>Primary Legislation:</strong> ${analysis.stage2.primaryAct}<br>
      <strong>Jurisdictional Domain:</strong> ${analysis.stage1.primaryDomain}<br>
      <strong>Competent Forum:</strong> ${analysis.stage5.pecuniary.courtLevel}
    </div>
    <div>
      <strong>Limitation Check:</strong> <span class="badge ${analysis.stage3.isTimeBarred ? 'badge-error' : 'badge-success'}">${analysis.stage3.isTimeBarred ? 'TIME BARRED' : 'MAINTAINABLE'}</span><br>
      <strong>Accrual Date:</strong> ${analysis.stage3.accrualDate}<br>
      <strong>Forensic Hash:</strong> ${analysis._security?.forensicHash || "N/A"}
    </div>
  </div>

  <h3 class="section-title">STATEMENT OF FACT PATTERN</h3>
  <div class="monospace">${factPattern}</div>

  <h3 class="section-title">STAGE 0: STABILIZED FACT MATRIX & CHRONOLOGY</h3>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 15%">Date</th>
        <th style="width: 35%">Event</th>
        <th style="width: 25%">Parties</th>
        <th style="width: 25%">Significance</th>
      </tr>
    </thead>
    <tbody>
      ${analysis.stage0.chronology.map(c => `
        <tr>
          <td><strong>${c.date}</strong></td>
          <td>${c.event}</td>
          <td>${c.partiesInvolved}</td>
          <td>${c.statutorySignificance}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">STAGE 1 & 2: STATUTORY TRIGGERS & RELEVANT SECTIONS</h3>
  <table class="table">
    <thead>
      <tr>
        <th>Statute/Act</th>
        <th>Provision/Section</th>
        <th>Statutory Objective</th>
      </tr>
    </thead>
    <tbody>
      ${analysis.stage2.relevantSections.map(s => `
        <tr>
          <td><strong>${s.actName}</strong></td>
          <td><code>${s.sectionOrRule}</code></td>
          <td>${s.purpose}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">STAGE 3: LIMITATION ANALYSIS DETAILS</h3>
  <p><strong>Article Applied:</strong> ${analysis.stage3.limitationArticle} of the Limitation Act 1908.</p>
  <p><strong>Prescribed Limitation Window:</strong> ${analysis.stage3.prescribedPeriod}.</p>
  <p><strong>Limitation Verdict:</strong> ${analysis.stage3.preliminaryAnalysis}</p>

  <h3 class="section-title">STAGE 5: PECUNIARY & TERRITORIAL JURISDICTION</h3>
  <p><strong>Territorial Rule:</strong> ${analysis.stage5.territorial.rule} (${analysis.stage5.territorial.governingSection})</p>
  <p><strong>Dispute Valuation:</strong> ${analysis.stage5.pecuniary.valuation}</p>
  <p><strong>Selected Court:</strong> ${analysis.stage5.pecuniary.courtLevel}</p>

  <h3 class="section-title">STAGE 7 & 9: ISSUES FRAMED & COURT DISCUSSION</h3>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 5%">No.</th>
        <th style="width: 35%">Issue Title / Fact of Controversy</th>
        <th style="width: 20%">Burden of Proof</th>
        <th style="width: 40%">Anticipated Findings / CPC Action</th>
      </tr>
    </thead>
    <tbody>
      ${analysis.stage9.issueDetails.map(iss => `
        <tr>
          <td><strong>${iss.issueNo}</strong></td>
          <td>${iss.issueTitle}</td>
          <td>Plaintiff</td>
          <td>${iss.projectedFinding} - ${iss.courtAnalysis}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">STAGE 13: JURISPRUDENTIAL SYNTHESIS SUMMARY</h3>
  <p><strong>Overview:</strong> ${analysis.stage13.overview}</p>
  <p><strong>Relief Decree:</strong> ${analysis.stage13.reliefDecree}</p>
  <p><strong>Costs Apportionment:</strong> ${analysis.stage13.costsApportionment}</p>
  <p><strong>Execution Pathway:</strong> ${analysis.stage13.executionPathway}</p>

  <div class="page-break"></div>
  
  <div style="margin-top: 50px; border-top: 1px dashed #C5A059; padding-top: 20px; font-size: 11px;">
    <h4 style="margin: 0 0 10px 0; color: #1E252B;">SECURE FORENSIC AUDIT TRAIL DATA</h4>
    <p>This document is cryptographically locked under client-license: <strong>${watermark.licenseId}</strong>. Any alterations or modifications to the text of this brief invalidates the forensic chain. Registered user: <strong>${watermark.email}</strong>.</p>
  </div>

  <footer>
    ${watermark.visualString}
  </footer>

  <script class="no-print">
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  // Download Blob
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BCCAA_Case_Brief_${watermark.caseId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
