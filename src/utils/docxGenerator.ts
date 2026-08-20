import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from "docx";
import { CaseAnalysisResponse } from "../types/types";
import { Watermark } from "./watermark";

/**
 * Downloads a professionally formatted Microsoft Word (.docx) document
 * containing the full 14-stage BCCAA Case Analysis and Statutory Brief.
 */
export async function downloadCaseBriefDOCX(
  analysis: CaseAnalysisResponse,
  factPattern: string,
  watermark: Watermark
): Promise<void> {
  const isMaintainable = !analysis.stage3.isTimeBarred;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const borderThin = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "CCCCCC",
  };

  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin,
  };

  // Helper cell creator
  const createCell = (
    text: string | Paragraph[],
    options?: {
      bold?: boolean;
      bg?: string;
      widthPercent?: number;
      fontSize?: number;
      color?: string;
    }
  ) => {
    let content: Paragraph[];
    if (typeof text === "string") {
      content = [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: options?.bold ?? false,
              size: options?.fontSize ?? 20, // 10pt (half-points)
              color: options?.color ?? "1E252B",
              font: "Calibri",
            }),
          ],
        }),
      ];
    } else {
      content = text;
    }

    return new TableCell({
      width: options?.widthPercent
        ? { size: options.widthPercent, type: WidthType.PERCENTAGE }
        : undefined,
      shading: options?.bg
        ? { fill: options.bg, type: ShadingType.CLEAR }
        : undefined,
      margins: {
        top: convertInchesToTwip(0.08),
        bottom: convertInchesToTwip(0.08),
        left: convertInchesToTwip(0.12),
        right: convertInchesToTwip(0.12),
      },
      children: content,
    });
  };

  // Build Chronology rows
  const chronologyRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell("Date / Timing", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 20 }),
        createCell("Factual Event Description", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 35 }),
        createCell("Parties Involved", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 20 }),
        createCell("Factual / Evidentiary Source", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 25 }),
      ],
    }),
  ];

  if (analysis.stage0?.chronology && analysis.stage0.chronology.length > 0) {
    analysis.stage0.chronology.forEach((c, index) => {
      chronologyRows.push(
        new TableRow({
          children: [
            createCell(c.date, { bold: true, bg: index % 2 === 0 ? "FDFBF7" : "FFFFFF" }),
            createCell(c.event, { bg: index % 2 === 0 ? "FDFBF7" : "FFFFFF" }),
            createCell(c.partiesInvolved || "Litigants", { bg: index % 2 === 0 ? "FDFBF7" : "FFFFFF" }),
            createCell(c.factualSource || "Case record", { bg: index % 2 === 0 ? "FDFBF7" : "FFFFFF" }),
          ],
        })
      );
    });
  } else {
    chronologyRows.push(
      new TableRow({
        children: [
          createCell("No chronological sequence dates extracted.", { widthPercent: 100 }),
        ],
      })
    );
  }

  // Build Precedents rows
  const precedentsRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell("Citation & Title", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 25 }),
        createCell("Forum & Year", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 15 }),
        createCell("Ratio Decidendi / Legal Holding", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 35 }),
        createCell("Statutory Application", { bold: true, bg: "1E252B", color: "FFFFFF", widthPercent: 25 }),
      ],
    }),
  ];

  if (analysis.stage2?.precedents && analysis.stage2.precedents.length > 0) {
    analysis.stage2.precedents.forEach((p, idx) => {
      const citationParas = [
        new Paragraph({
          children: [
            new TextRun({ text: p.citation, bold: true, size: 20, font: "Calibri", color: "1E252B" }),
          ],
        }),
      ];
      if (p.caseTitle) {
        citationParas.push(
          new Paragraph({
            children: [
              new TextRun({ text: p.caseTitle, italics: true, size: 18, font: "Calibri", color: "4B5563" }),
            ],
          })
        );
      }
      citationParas.push(
        new Paragraph({
          children: [
            new TextRun({ text: `✓ ${p.verificationStatus || "VERIFIED CANONICAL"}`, size: 16, font: "Consolas", color: "059669" }),
          ],
        })
      );

      precedentsRows.push(
        new TableRow({
          children: [
            createCell(citationParas, { bg: idx % 2 === 0 ? "F9FAFB" : "FFFFFF" }),
            createCell(`${p.court}\n${p.decisionYear ? `(${p.decisionYear})` : ""}`, { bg: idx % 2 === 0 ? "F9FAFB" : "FFFFFF" }),
            createCell(`"${p.holding}"`, { bg: idx % 2 === 0 ? "F9FAFB" : "FFFFFF" }),
            createCell(`${p.statutorySubject ? `Statute: ${p.statutorySubject}\n` : ""}${p.relevance}`, { bg: idx % 2 === 0 ? "F9FAFB" : "FFFFFF" }),
          ],
        })
      );
    });
  }

  // Key Parameters Table
  const paramTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        children: [
          createCell("Legal Parameter", { bold: true, bg: "E5E1D8", widthPercent: 35 }),
          createCell("BCCAA Deterministic Metric", { bold: true, bg: "E5E1D8", widthPercent: 65 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Primary Civil Domain"),
          createCell(analysis.stage1.primaryDomain, { bold: true }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Primary Statutory Act"),
          createCell(analysis.stage2.primaryAct, { bold: true }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Statutory Limitation Status"),
          createCell(
            `${isMaintainable ? "MAINTAINABLE" : "TIME-BARRED"} (Article ${analysis.stage3.limitationArticle || "N/A"})`,
            { bold: true, color: isMaintainable ? "059669" : "DC2626" }
          ),
        ],
      }),
      new TableRow({
        children: [
          createCell("Competent Court Forum"),
          createCell(analysis.stage5.pecuniary.courtLevel, { bold: true }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Court Fees & Valuation Strategy"),
          createCell(analysis.stage5.pecuniary.suitsValuationActNotes || "As per Court Fees Act 1870"),
        ],
      }),
    ],
  });

  // Create docx Document
  const doc = new Document({
    creator: "NEUMLEX BCCAA Engine",
    title: `BCCAA Litigation Brief - ${analysis.stage2.primaryAct}`,
    description: "Bangladesh Civil Case Analysis Architecture Forensic Brief",
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "CONFIDENTIAL & PRIVILEGED LEGAL BRIEF  |  NEUMLEX BCCAA v2.0",
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `License: ${watermark.issuedTo} (${watermark.licenseId})  |  Hash: ${watermark.forensicHash.slice(0, 16)}...  |  Page `,
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "BANGLADESH CIVIL CASE ANALYSIS ARCHITECTURE",
                bold: true,
                size: 32,
                color: "1E252B",
                font: "Georgia",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `BCCAA JURISPRUDENTIAL LITIGATION BRIEF  •  ${analysis.stage2.primaryAct.toUpperCase()}`,
                bold: true,
                size: 20,
                color: "C5A059",
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${formattedDate}  |  Forensic Case ID: ${watermark.caseId}`,
                size: 18,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Status Banner Box
          new Paragraph({
            shading: { fill: isMaintainable ? "ECFDF5" : "FEF2F2", type: ShadingType.CLEAR },
            spacing: { before: 100, after: 200 },
            children: [
              new TextRun({
                text: `  SUIT STATUS: ${isMaintainable ? "MAINTAINABLE WITHIN LIMITATION" : "TIME-BARRED UNDER SECTION 3 LIMITATION ACT"}  |  FORUM: ${analysis.stage5.pecuniary.courtLevel}  `,
                bold: true,
                size: 20,
                color: isMaintainable ? "065F46" : "991B1B",
                font: "Calibri",
              }),
            ],
          }),

          // Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "EXECUTIVE LITIGATION SYNTHESIS",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: analysis.stage13.overview,
                size: 22,
                color: "374151",
                font: "Calibri",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Core Parameters
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "DETERMINISTIC STATUTORY PARAMETERS",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          paramTable,

          // Gateway 0: Fact Matrix
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "GATEWAY 0: FACT MATRIX & OBJECTIVE CHRONOLOGY",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),

          ...(analysis.stage0?.factualSummary
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Factual Summary: ",
                      bold: true,
                      size: 20,
                      color: "1E252B",
                      font: "Calibri",
                    }),
                    new TextRun({
                      text: analysis.stage0.factualSummary,
                      size: 20,
                      color: "4B5563",
                      font: "Calibri",
                    }),
                  ],
                  spacing: { after: 150 },
                }),
              ]
            : []),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: chronologyRows,
          }),

          // Admitted & Disputed Facts
          new Paragraph({
            children: [
              new TextRun({
                text: "\nAdmitted Facts:",
                bold: true,
                size: 22,
                color: "065F46",
                font: "Calibri",
              }),
            ],
            spacing: { before: 200, after: 80 },
          }),
          ...((analysis.stage0?.admittedFacts || []).map(
            (af) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: af,
                    size: 20,
                    color: "374151",
                    font: "Calibri",
                  }),
                ],
              })
          )),

          new Paragraph({
            children: [
              new TextRun({
                text: "\nDisputed & Contested Points:",
                bold: true,
                size: 22,
                color: "991B1B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 150, after: 80 },
          }),
          ...((analysis.stage0?.disputedFacts || []).map(
            (df) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: df,
                    size: 20,
                    color: "374151",
                    font: "Calibri",
                  }),
                ],
              })
          )),

          // Precedents Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "GATEWAY 2: AUTHORITATIVE CANONICAL PRECEDENTS (SUPREME COURT)",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: precedentsRows,
          }),

          // Formulation of Issues
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "GATEWAY 7: FORMULATION OF ISSUES (ORDER XIV CPC)",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          ...((analysis.stage7?.issues || []).map(
            (issue) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Issue No. ${issue.issueNo} (${issue.type}): `,
                    bold: true,
                    size: 20,
                    color: "1E252B",
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: `${issue.title} [Burden: ${issue.burden}]`,
                    size: 20,
                    color: "374151",
                    font: "Calibri",
                  }),
                ],
                spacing: { after: 80 },
              })
          )),

          // Strategic Counsel Directives from Stage 13
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "GATEWAY 13: RELIEF, COSTS & EXECUTION PATHWAY",
                bold: true,
                size: 24,
                color: "1E252B",
                font: "Calibri",
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Relief & Decree Structure: ", bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: analysis.stage13.reliefDecree, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Costs Apportionment: ", bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: analysis.stage13.costsApportionment, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Execution Pathway: ", bold: true, size: 20, font: "Calibri" }),
              new TextRun({ text: analysis.stage13.executionPathway, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 120 },
          }),

          // Forensic Cryptographic Audit
          new Paragraph({
            spacing: { before: 400 },
            shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: `FORENSIC CRYPTOGRAPHIC AUDIT SEAL\n`,
                bold: true,
                size: 18,
                color: "1E252B",
                font: "Consolas",
              }),
              new TextRun({
                text: `Security Hash: ${watermark.forensicHash}\nLicense Holder: ${watermark.issuedTo} (${watermark.licenseId})\nCase Verification ID: ${watermark.caseId}\nTimestamp: ${new Date(watermark.timestamp).toLocaleString()}\nIntegrity Guarantee: 100% Deterministic Statutory Validation Node`,
                size: 16,
                color: "4B5563",
                font: "Consolas",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanAct = analysis.stage2.primaryAct.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `BCCAA_Case_Brief_${cleanAct}_${Date.now()}.docx`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a synthesized or user-edited Legal Memorandum / Courtroom Plaint Draft
 * as a high-fidelity Microsoft Word (.docx) document.
 */
export async function downloadDraftDOCX(
  title: string,
  contentMarkdown: string,
  analysis?: CaseAnalysisResponse | null,
  watermark?: Watermark | null
): Promise<void> {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = contentMarkdown.split("\n");
  const paragraphs: Paragraph[] = [];

  // Title Banner
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: title || "LEGAL MEMORANDUM & COURTROOM DRAFT",
          bold: true,
          size: 32,
          color: "1E252B",
          font: "Georgia",
        }),
      ],
      spacing: { after: 100 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Prepared via NEUMLEX BCCAA Engine  •  Date: ${formattedDate}`,
          size: 18,
          color: "6B7280",
          font: "Calibri",
        }),
      ],
      spacing: { after: 250 },
    })
  );

  // Parse markdown lines into styled docx paragraphs
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
      return;
    }

    if (trimmed.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: trimmed.replace("# ", ""),
              bold: true,
              size: 28,
              color: "1E252B",
              font: "Georgia",
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: trimmed.replace("## ", ""),
              bold: true,
              size: 24,
              color: "1E252B",
              font: "Calibri",
            }),
          ],
          spacing: { before: 180, after: 80 },
        })
      );
    } else if (trimmed.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: trimmed.replace("### ", ""),
              bold: true,
              size: 20,
              color: "C5A059",
              font: "Calibri",
            }),
          ],
          spacing: { before: 140, after: 60 },
        })
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.substring(2);
      const runs = parseInlineFormatting(text);
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: runs,
          spacing: { after: 50 },
        })
      );
    } else {
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        const runs = parseInlineFormatting(numMatch[2]);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${numMatch[1]}.  `,
                bold: true,
                color: "C5A059",
                font: "Calibri",
                size: 22,
              }),
              ...runs,
            ],
            spacing: { after: 60 },
          })
        );
      } else {
        const runs = parseInlineFormatting(trimmed);
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 100 },
          })
        );
      }
    }
  });

  const doc = new Document({
    creator: "NEUMLEX BCCAA Engine",
    title: title || "Legal Draft",
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "LEGAL DRAFTING MEMORANDUM  |  NEUMLEX BCCAA",
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: watermark ? `Security Token: ${watermark.forensicHash.slice(0, 16)}...  |  Page ` : "NEUMLEX Verified Statutory Draft  |  Page ",
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Legal_Memorandum_${Date.now()}.docx`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to parse **bold** and *italic* markdown spans
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split by bold (**...**)
  const boldParts = text.split(/\*\*(.*?)\*\*/g);

  boldParts.forEach((part, i) => {
    if (!part) return;
    const isBold = i % 2 === 1;

    // Check for italics (*...*) inside
    const italicParts = part.split(/\*(.*?)\*/g);
    italicParts.forEach((iPart, j) => {
      if (!iPart) return;
      const isItalic = j % 2 === 1;
      runs.push(
        new TextRun({
          text: iPart,
          bold: isBold,
          italics: isItalic,
          size: 22, // 11pt
          font: "Calibri",
          color: isBold ? "1E252B" : "374151",
        })
      );
    });
  });

  return runs.length > 0
    ? runs
    : [new TextRun({ text, size: 22, font: "Calibri", color: "374151" })];
}
