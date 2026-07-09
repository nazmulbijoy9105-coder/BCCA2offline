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

  // Lazy initialization helper for Gemini client (server-side)
  let aiClient: GoogleGenAI | null = null;
  const getGoogleGenAI = () => {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  };

  // Helper to clean up verbose or raw JSON error responses from the Gemini API
  const cleanGeminiErrorMessage = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    
    let msg = "";
    if (typeof err === "object") {
      msg = err.message || JSON.stringify(err);
    } else {
      msg = String(err);
    }

    // Check for Quota / Rate Limit (429 / RESOURCE_EXHAUSTED)
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate-limits")) {
      return "Gemini API Quota Limit Exceeded: The free tier of the Gemini API has a daily limit of 20 requests. Please wait a few minutes for the limit to reset, or add a paid API key via the 'Settings > Secrets' menu in AI Studio to continue without limits.";
    }

    // Check for 503 / Service Unavailable / Overloaded
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.toLowerCase().includes("overloaded") || msg.toLowerCase().includes("busy") || msg.toLowerCase().includes("high demand")) {
      return "The Gemini API is currently experiencing extremely high demand. Please wait a few seconds and try again.";
    }

    // Try parsing potential JSON error payload embedded in the message
    try {
      const jsonMatch = msg.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error && parsed.error.message) {
          return parsed.error.message;
        }
      }
    } catch (e) {
      // ignore parsing error
    }

    return msg;
  };

  // Helper to call Gemini with robust retries and fallback models
  const generateContentWithRetryAndFallback = async (
    prompt: string,
    maxCycles = 3
  ) => {
    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
    let lastError: any = null;

    // Retrieve lazy loaded client
    const ai = getGoogleGenAI();

    let delay = 1000; // Delay between cycles

    for (let cycle = 1; cycle <= maxCycles; cycle++) {
      console.log(`[AI Engine] Starting Cycle ${cycle}/${maxCycles} of model attempts`);
      
      for (const model of models) {
        try {
          console.log(`[AI Engine] Cycle ${cycle}: Attempting generation with model: ${model}`);
          const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
          });
          
          if (result && result.text) {
            console.log(`[AI Engine] Successfully generated content using model: ${model} on Cycle ${cycle}`);
            return result;
          }
          throw new Error("Empty response received from Gemini API");
        } catch (err: any) {
          const errMsg = err && typeof err === "object" ? (err.message || JSON.stringify(err)) : String(err);
          console.warn(`[AI Engine] Cycle ${cycle} with model ${model} failed:`, errMsg);
          lastError = err;

          const isBadRequest = err && typeof err === "object" && (err.status === 400 || err.statusCode === 400);
          if (isBadRequest) {
            console.log(`[AI Engine] Bad Request (400) encountered for model ${model}. Sparing further attempts for this model.`);
          }
        }
      }

      if (cycle < maxCycles) {
        console.log(`[AI Engine] Cycle ${cycle} exhausted all models. Waiting ${delay}ms before starting Cycle ${cycle + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
    
    // If we exhausted all models and retries
    throw lastError || new Error("Failed to generate content with all available Gemini models.");
  };

  // API Route: Compare offline facts analysis with Gemini AI
  app.post("/api/ai/compare", async (req, res) => {
    try {
      const { factPattern, engineAnalysis } = req.body;
      if (!factPattern) {
        return res.status(400).json({ error: "factPattern is required" });
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets." 
        });
      }

      const prompt = `You are a Senior Counsel and Advocate at the Supreme Court of Bangladesh.
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

Write in a highly authoritative, professional, and sophisticated judicial tone. Keep it structured, legally precise, and deeply rooted in Bangladeshi civil jurisprudence.`;

      // Call our robust retry & fallback handler
      const response = await generateContentWithRetryAndFallback(prompt);

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API ultimate failure:", error);
      const cleanMessage = cleanGeminiErrorMessage(error);
      res.status(500).json({ 
        error: cleanMessage
      });
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
