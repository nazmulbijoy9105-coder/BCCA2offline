import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client (server-side)
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Compare offline facts analysis with Gemini AI
  app.post("/api/ai/compare", async (req, res) => {
    try {
      const { factPattern, engineAnalysis } = req.body;
      if (!factPattern) {
        return res.status(400).json({ error: "factPattern is required" });
      }

      // Check if API key is configured
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets." 
        });
      }

      // Generate content using gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a Senior Counsel and Advocate at the Supreme Court of Bangladesh.
You are passed a JSON deterministic baseline from a rule engine.

FACT PATTERN:
"${factPattern}"

DETERMINISTIC ENGINE FINDINGS:
${JSON.stringify(engineAnalysis, null, 2)}

### CRITICAL RULES & CONSTRAINTS:
1. YOU ARE STRICTLY FORBIDDEN from altering or contradicting the mathematical shares (e.g., 2/7ths to sons, 1/7th to daughter, or any other Sharia ratios calculated by the engine), the limitation dates (e.g., 15 January 2026), or the limitation verdict (e.g., WITHIN LIMITATION). Treat these deterministic rule-engine findings as absolute, non-negotiable legal baselines.
2. YOUR TARGET TASK is to apply:
   - **Order XXXIX (39) CPC Injunction Strategy**: Detail the prima facie case, balance of convenience, and irreparable loss. Focus on preventing hostile third-party sales (such as the threatened sale discovered on 20 June 2026), preserving joint possession, and maintaining the status quo of the undivided suit land.
   - **Specific Relief Act 1877 Equitable Doctrines**: Address Section 42 (declarations of legal character/right), Section 54 (perpetual injunctions), and equitable doctrines (such as estoppel, laches, and spes successionis under Section 6 of Transfer of Property Act / Shariat application). Address how Tejya Putro (disowning) has zero legal effect on vested inheritance under Sunni Hanafi law.
   - **Court Fees Act 1870 & Suits Valuation Act 1887 Optimization**: Outline the exact valuation and court fees strategy. Since the property is valued at BDT 1,80,00,000, discuss pecuniary jurisdiction of the Joint District Judge, fixed court fees for partition under Schedule II Article 17(vi) of Court Fees Act (if joint possession is claimed), versus ad valorem court fees under Section 7(iv)(c) if ouster/dispossession is found or if declaration is coupled with consequential relief of possession.

Provide your expert civil legal counsel. Format your response clearly with these markdown sections:
1. ## FACTUAL VERITY & SUFFICIENCY AUDIT
Check if the fact pattern has sufficient particulars to sustain a civil action in Bangladesh (e.g. registration details, specific dates, exact locations of Mouza Shibpur, Gazipur). Focus on the disowning affidavit (10 Sept 2025) and its total nullity under the Muslim Personal Law (Shariat) Application Act 1937.

2. ## DETAILED LEGAL ANALYSIS (ACTS & APPLICABILITY)
Apply the Specific Relief Act 1877 (declarations of co-ownership, partition, and injunctions), Transfer of Property Act 1882, and Sunni Sharia law. Analyze why the "disowned" sons are full legal heirs.

3. ## DETERMINISTIC VS. AI COMPARISON MATRIX (CONSTRAINED)
Reiterate the engine's findings exactly (Mathematical Shares, Accrual Date, Limitation Verdict) as immutable, and supplement them with Supreme Court of Bangladesh precedents (e.g., that mutation enures to the benefit of all co-sharers, and disowning is void).

4. ## TACTICAL COURTROOM STRATEGY & COURT FEES ACT OPTIMIZATION
Detail the Order 39 CPC temporary injunction application draft and strategy. Detail how to optimize court fees (fixed partition court fees of BDT 500/1000 under the amended Court Fees Act for Bangladesh if joint constructive possession is pleaded, versus the risk of ad valorem fees on the full BDT 1,80,00,000 valuation). Deliver Order VII Rule 11 CPC risk mitigation.

Write in a highly authoritative, professional, and sophisticated judicial tone. Keep it structured, legally precise, and deeply rooted in Bangladeshi civil jurisprudence.`,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "An error occurred during AI comparison" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
