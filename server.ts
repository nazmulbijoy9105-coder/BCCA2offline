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
        contents: `You are a high-level Senior legal counsel and Advocate at the Supreme Court of Bangladesh.
You are comparing a deterministic rule-based offline legal analysis of a fact pattern with your own expert analysis.

FACT PATTERN:
"${factPattern}"

DETERMINISTIC ENGINE FINDINGS:
${JSON.stringify(engineAnalysis, null, 2)}

Provide your expert civil legal counsel. Format your response clearly with markdown sections:
1. ## FACTUAL VERITY & SUFFICIENCY AUDIT
Check if the fact pattern has sufficient particulars to sustain a civil action in Bangladesh (e.g. registry details, specific dates, monetary values for ad valorem court fees, precise locations, and ouster timeline). List any factual deficiencies.

2. ## DETAILED LEGAL ANALYSIS (ACTS & APPLICABILITY)
Analyze applicable statutory laws (such as the Specific Relief Act 1877, Limitation Act 1908, Civil Procedure Code 1908, Court Fees Act 1870, etc.). Explain how they apply to these facts.

3. ## DETERMINISTIC VS. AI COMPARISON MATRIX
Provide a side-by-side or point-by-point comparison with the engine's findings (e.g. Domain, Court Forum, Limitation, Maintainability). Identify if you agree or if you detect a nuanced legal exception (such as Section 5, 14, or 19 of the Limitation Act, or equity rules like estoppel or laches).

4. ## TACTICAL COURTROOM STRATEGY & COUNSEL NOTE
Deliver actionable advice for the pleader to patch factual gaps, secure temporary injunctions, deposit treasury balances, or structure their pleadings (e.g. Order VII Rule 11 CPC risk mitigation).

Write in a highly authoritative, professional, and sophisticated judicial tone. Keep it structured and precise.`,
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
