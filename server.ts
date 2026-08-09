import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import * as pdfParseModule from "pdf-parse";

dotenv.config();

const app = express();
const rawPort = process.env.PORT;
const PORT = rawPort && !isNaN(parseInt(rawPort, 10)) ? parseInt(rawPort, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "roleready-pmk-secure-jwt-key-2026";

// Unhandled process safeguards
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const ANALYSES_FILE = path.join(DATA_DIR, "analyses.json");

// Local DB Helpers
function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading users.json:", err);
  }
  return [];
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users.json:", err);
  }
}

function loadAnalyses(): any[] {
  try {
    if (fs.existsSync(ANALYSES_FILE)) {
      const data = fs.readFileSync(ANALYSES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading analyses.json:", err);
  }
  return [];
}

function saveAnalyses(analyses: any[]) {
  try {
    fs.writeFileSync(ANALYSES_FILE, JSON.stringify(analyses, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing analyses.json:", err);
  }
}

// Auth Middleware
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
}

// Body parser middleware for handling large PDF base64 payloads
app.use(express.json({ limit: "25mb" }));

// Helper to initialize GoogleGenAI lazily
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helpers for robust PDF text extraction
function cleanPdfText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "")
    .replace(/\\f/g, "")
    .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function extractRawPdfTextStreams(buffer: Buffer): string {
  const str = buffer.toString("binary");
  const textChunks: string[] = [];

  // Match Tj strings: (string) Tj
  const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*T[jJ]/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(str)) !== null) {
    const unescaped = unescapePdfString(match[1]);
    if (unescaped.trim().length > 0) {
      textChunks.push(unescaped);
    }
  }

  // Match TJ arrays: [ (str1) -10 (str2) ] TJ
  const arrayTjRegex = /\[\s*((?:\([^()\\]*(?:\\.[^()\\]*)*\)|-?\d+\s*)+)\s*\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(str)) !== null) {
    const inner = match[1];
    const subStrRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    let subMatch: RegExpExecArray | null;
    let chunk = "";
    while ((subMatch = subStrRegex.exec(inner)) !== null) {
      chunk += unescapePdfString(subMatch[1]);
    }
    if (chunk.trim().length > 0) {
      textChunks.push(chunk);
    }
  }

  // Fallback scan for readable ASCII words
  if (textChunks.length === 0) {
    const words = str.match(/[A-Za-z0-9,.:;'\x22\s-]{4,}/g) || [];
    const filtered = words.filter((w) => {
      const trimmed = w.trim();
      return (
        trimmed.length > 3 &&
        !trimmed.includes("endobj") &&
        !trimmed.includes("stream") &&
        !trimmed.includes("FlateDecode") &&
        !trimmed.includes("Font") &&
        !trimmed.includes("Catalog") &&
        !trimmed.includes("MediaBox")
      );
    });
    return filtered.join(" ");
  }

  return textChunks.join(" ");
}

async function extractPdfTextFromBuffer(buffer: Buffer): Promise<{ text: string; pages: number; method: string }> {
  const isPdfMagic = buffer.length >= 4 && buffer.toString("binary", 0, 4) === "%PDF";
  console.log(`[PDF Log] Processing PDF buffer (${buffer.length} bytes) | Magic Header (%PDF): ${isPdfMagic}`);

  if (!isPdfMagic && buffer.length > 10) {
    console.warn(`[PDF Log] Warning: Buffer header is missing standard %PDF magic bytes.`);
  }

  // Stage 1: Try pdf-parse v2 API (PDFParse class)
  try {
    const { PDFParse } = pdfParseModule;
    if (PDFParse && typeof PDFParse === "function") {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy().catch(() => {});

      if (result && typeof result.text === "string") {
        const cleaned = cleanPdfText(result.text);
        if (cleaned.length >= 15) {
          console.log(`[PDF Log] Stage 1 (PDFParse v2) extracted ${cleaned.length} chars.`);
          return {
            text: cleaned,
            pages: result.pages ? result.pages.length : (result.total || 1),
            method: "pdf-parse-v2",
          };
        }
      }
    }
  } catch (err: any) {
    console.warn(`[PDF Log] Stage 1 (PDFParse v2) error: ${err.message || err}`);
  }

  // Stage 2: Try legacy function export if available
  try {
    const parseFn = typeof pdfParseModule === "function" 
      ? pdfParseModule 
      : (pdfParseModule as any).default;

    if (typeof parseFn === "function") {
      const result = await parseFn(buffer);
      if (result && typeof result.text === "string") {
        const cleaned = cleanPdfText(result.text);
        if (cleaned.length >= 15) {
          console.log(`[PDF Log] Stage 2 (legacy pdf-parse) extracted ${cleaned.length} chars.`);
          return {
            text: cleaned,
            pages: result.numpages || 1,
            method: "pdf-parse-v1",
          };
        }
      }
    }
  } catch (err: any) {
    console.warn(`[PDF Log] Stage 2 (legacy pdf-parse) error: ${err.message || err}`);
  }

  // Stage 3: Raw PDF text stream scanner fallback
  try {
    const rawText = extractRawPdfTextStreams(buffer);
    const cleaned = cleanPdfText(rawText);
    if (cleaned.length >= 15) {
      console.log(`[PDF Log] Stage 3 (raw stream scanner) extracted ${cleaned.length} chars.`);
      return {
        text: cleaned,
        pages: 1,
        method: "raw-stream-fallback",
      };
    }
  } catch (err: any) {
    console.warn(`[PDF Log] Stage 3 (raw stream scanner) error: ${err.message || err}`);
  }

  // Stage 4: Precise Diagnostics for Error Messages
  const pdfStr = buffer.toString("binary");
  if (pdfStr.includes("/Encrypt")) {
    throw new Error("This PDF document is password-protected or encrypted. Please remove password protection and try again.");
  }
  if ((pdfStr.includes("/Image") || pdfStr.includes("/XObject")) && !pdfStr.includes("BT")) {
    throw new Error("This PDF appears to be a scanned image without an embedded text layer. Please upload a text-based PDF resume or select a sample resume.");
  }

  throw new Error("Unable to extract text layer from PDF. The document structure may be image-based, encrypted, or non-standard.");
}

// 1. PDF Extraction Endpoint
app.post("/api/extract-pdf", async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF file data provided." });
    }

    // Safely extract pure base64 content regardless of data URI header variation
    const base64Data = (pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64).trim();
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      return res.status(400).json({ error: "Uploaded PDF file appears to be empty." });
    }

    const extractionResult = await extractPdfTextFromBuffer(buffer);

    res.json({
      success: true,
      text: extractionResult.text,
      numPages: extractionResult.pages,
      numWords: extractionResult.text ? extractionResult.text.split(/\s+/).filter(Boolean).length : 0,
      charCount: extractionResult.text.length,
      method: extractionResult.method,
    });
  } catch (err: any) {
    console.error("[PDF Extraction Failure]", err.message || err);
    res.status(422).json({
      error: err.message || "Unable to extract text from PDF. The document may be image-based, password-protected, or corrupted.",
      details: err.message || String(err),
    });
  }
});

// 2. Resume AI Analysis Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { pdfBase64, rawText, targetRole, customTargetRole, experienceLevel, targetCountry } = req.body;

    const selectedRole = customTargetRole || targetRole || "Software Engineer";
    const level = experienceLevel || "Mid-Level";
    const country = targetCountry || "United States";

    if (!pdfBase64 && (!rawText || rawText.trim().length < 30)) {
      return res.status(400).json({
        error: "Please provide either a PDF resume file or sufficient resume text content (at least 30 characters).",
      });
    }

    const ai = getGenAIClient();

    const parts: any[] = [];

    // If PDF base64 is provided, supply it directly to Gemini
    if (pdfBase64) {
      const cleanBase64 = (pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64).trim();
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64,
        },
      });
    }

    // If plain text is provided, add it
    if (rawText && rawText.trim()) {
      parts.push({
        text: `RESUME TEXT CONTENT:\n${rawText.trim()}\n`,
      });
    }

    // System instruction & Prompt with strict anti-hallucination directives
    const systemInstruction = `You are an expert career intelligence engine and technical recruiter for RoleReady AI.
CRITICAL GROUNDING & EVIDENCE MANDATES FOR ALL ANALYSIS AND RESUME REWRITES:
1. STRICT TRUTHFULNESS: Every claim, skill, technology, framework, project, metric, percentage, company, and certification attributed to the candidate MUST be grounded ONLY in explicit evidence extracted from the CURRENTLY uploaded candidate resume.
2. CATEGORIZATION OF EVIDENCE:
   - Confirmed Evidence: Explicitly stated in the uploaded resume (e.g. "C++17 and Qt experience").
   - Reasonable Inference: Logical background context (e.g., "familiarity with object-oriented software design"). Use cautious wording and NEVER present as confirmed tool proficiency if the tool/skill itself is absent.
   - Missing / Unsupported: Any requirement from the target role not found in the resume. NEVER present as an existing candidate skill, achievement, or bullet point.
3. SEPARATION OF CONCEPTS:
   - CURRENT_RESUME_EVIDENCE: Candidate's actual current capabilities.
   - RECOMMENDED_FUTURE_SKILLS: Skills or learning actions needed for the target role (used ONLY in careerRoadmap and missingTechnicalSkills).
   - NEVER convert RECOMMENDED_FUTURE_SKILLS or missing target role requirements into existing candidate experience or skills in Resume Rewrites (bulletFixes).
4. PREVENT FABRICATION:
   - If the resume says "Completed Cadence Verilog training", do NOT claim "Strong digital logic verification skills" or "Production ASIC chip design expertise".
   - If the original resume lacks exact numbers or metrics, DO NOT fabricate percentages or dollar amounts. Rephrase professionally using strong action verbs based ONLY on verified facts.
   - NEVER insert meta-disclaimers or notes such as "Quantification unavailable", "No measurable result", or similar text inside the recommended bullet point itself.
5. NO CROSS-RESUME MEMORY: Analyze solely the provided text for this specific request session.
6. VALIDATION STEP: Verify that every tool, metric, and achievement in 'originalContext' and 'suggestedImprovement' maps directly to evidence extracted from the provided resume text.
7. MATCHED SKILLS GROUNDING:
   - matchedTechnicalSkills MUST strictly contain ONLY technical skills, tools, frameworks, or databases that are EXPLICITLY mentioned in or directly supported by the candidate's uploaded resume text.
   - NEVER list unmentioned concepts such as "System Design", "System Design Fundamentals", "Cloud DevOps", "Microservices", or "AWS" in matchedTechnicalSkills unless those exact terms or direct equivalent technologies are explicitly present in the candidate's resume.
   - If a skill (like System Design) is expected for the target role but absent from the resume, it MUST be listed in missingTechnicalSkills or gaps or careerRoadmap, NEVER in matchedTechnicalSkills.`;

    const promptText = `
Perform a thorough, honest, and actionable Career Intelligence Analysis for this candidate's resume.

TARGET CAREER ROLE: "${selectedRole}"
TARGET EXPERIENCE LEVEL: "${level}"
TARGET JOB MARKET / COUNTRY: "${country}"

Your evaluation must strictly analyze the uploaded resume against real-world industry benchmarks for a "${selectedRole}" at "${level}" in the "${country}" job market.

CRITICAL MARKET INSIGHTS LOCALIZATION REQUIREMENT:
- You MUST localize all marketInsights (avgSalaryRange, topHiringLocationsOrRemote, keyIndustryTrends) specifically for the target country "${country}".
- For "avgSalaryRange", use the local currency and realistic salary range for "${country}":
  * If India: use INR ₹ (e.g. "₹15,00,000 - ₹32,00,000 INR" or "15 - 32 LPA INR"). NEVER use USD for India!
  * If United States: use USD $ (e.g. "$120,000 - $165,000 USD").
  * If United Kingdom: use GBP £ (e.g. "£60,000 - £95,000 GBP").
  * If Canada: use CAD C$ (e.g. "C$85,000 - C$135,000 CAD").
  * If Germany / Europe: use EUR € (e.g. "€65,000 - €95,000 EUR").
  * If Australia: use AUD A$ (e.g. "A$110,000 - A$160,000 AUD").
  * If Singapore: use SGD S$ (e.g. "S$80,000 - S$135,000 SGD").
  * If Remote / Global: use USD or global competitive remote salary scale.
- For "topHiringLocationsOrRemote", list top tech hubs in "${country}" (e.g. for India: "Bengaluru, Hyderabad, Pune, NCR, Remote"; for USA: "San Francisco, NYC, Seattle, Austin, Remote"; for UK: "London, Manchester, Remote", etc.).

Provide a comprehensive analysis conforming EXACTLY to the specified JSON schema with:
1. overallScore: integer 0-100 representing market readiness and role fit.
2. headline: Punchy, high-impact headline summary (e.g. "Strong Full-Stack foundation with React & Node; needs AWS DevOps and System Design exposure for Senior role").
3. summary: Concise 2-3 sentence strategic executive summary.
4. matchCategory: One of ["Exceptional Match", "Strong Match", "Moderate Match", "Significant Gaps"].
5. strengths: 4 to 6 specific highlighted strengths found in the resume.
6. gaps: 3 to 5 critical skill/experience gaps relative to target position.
7. skillsAnalysis:
   - matchedTechnicalSkills: array of technical skills candidate possesses that match target role (MUST be present in resume!)
   - missingTechnicalSkills: array of missing technical skills high in demand for target role
   - softSkills: soft skills demonstrated or implied in resume
   - skillScores: array of 4 key categories (e.g. Core Languages/Frameworks, System Architecture & Backend, Cloud & DevOps, Engineering Best Practices) with score (0-10) and maxScore (10).
8. careerRoadmap:
   - shortTerm (Next 30 Days): timeFrame string, array of 3 concrete learning/skill-building actions
   - mediumTerm (3-6 Months): timeFrame string, array of 3 concrete actions
   - longTerm (6-12 Months): timeFrame string, array of 3 strategic actions
9. resumeOptimization:
   - overallAdvice: strategic advice on how to improve resume impact without exaggerating facts
   - bulletFixes: array of 3 specific bullet point rewrites showing original Context/Weakness -> Grounded High-Impact Action Rewrite -> Reason. (MUST NOT invent missing technologies or fake metrics!)
   - formattingFeedback: 3 formatting, ATS readability, or structural recommendations
10. interviewPrep:
   - likelyQuestions: 4 high-probability interview questions for this target role based on candidate's background (category, question, tip, sampleAnswerOutline)
   - technicalFocusAreas: 4 technical topics candidate should review
11. marketInsights:
   - demandLevel: One of ["Very High", "High", "Moderate", "Niche"]
   - avgSalaryRange: estimated market salary range in local currency for "${country}"
   - topHiringLocationsOrRemote: top hiring hubs in "${country}" or Remote
   - keyIndustryTrends: 3 current hiring trends in this domain in "${country}"
`;

    parts.push({ text: promptText });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.INTEGER, description: "Match score 0-100" },
        headline: { type: Type.STRING },
        summary: { type: Type.STRING },
        matchCategory: {
          type: Type.STRING,
          enum: ["Exceptional Match", "Strong Match", "Moderate Match", "Significant Gaps"],
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        gaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        skillsAnalysis: {
          type: Type.OBJECT,
          properties: {
            matchedTechnicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingTechnicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            skillScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  maxScore: { type: Type.INTEGER },
                },
                required: ["category", "score", "maxScore"],
              },
            },
          },
          required: ["matchedTechnicalSkills", "missingTechnicalSkills", "softSkills", "skillScores"],
        },
        careerRoadmap: {
          type: Type.OBJECT,
          properties: {
            shortTerm: {
              type: Type.OBJECT,
              properties: {
                timeFrame: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["timeFrame", "actions"],
            },
            mediumTerm: {
              type: Type.OBJECT,
              properties: {
                timeFrame: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["timeFrame", "actions"],
            },
            longTerm: {
              type: Type.OBJECT,
              properties: {
                timeFrame: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["timeFrame", "actions"],
            },
          },
          required: ["shortTerm", "mediumTerm", "longTerm"],
        },
        resumeOptimization: {
          type: Type.OBJECT,
          properties: {
            overallAdvice: { type: Type.STRING },
            bulletFixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalContext: { type: Type.STRING },
                  suggestedImprovement: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["originalContext", "suggestedImprovement", "reason"],
              },
            },
            formattingFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["overallAdvice", "bulletFixes", "formattingFeedback"],
        },
        interviewPrep: {
          type: Type.OBJECT,
          properties: {
            likelyQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ["Technical", "Behavioral", "System Design", "Domain Specific"] },
                  tip: { type: Type.STRING },
                  sampleAnswerOutline: { type: Type.STRING },
                },
                required: ["question", "category", "tip", "sampleAnswerOutline"],
              },
            },
            technicalFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["likelyQuestions", "technicalFocusAreas"],
        },
        marketInsights: {
          type: Type.OBJECT,
          properties: {
            demandLevel: { type: Type.STRING, enum: ["Very High", "High", "Moderate", "Niche"] },
            avgSalaryRange: { 
              type: Type.STRING, 
              description: "Salary range MUST be localized in currency of target country (e.g. ₹15,00,000 - ₹32,00,000 INR for India, £60k-£95k for UK, C$85k-C$130k for Canada, €65k-€95k for Europe, $120k-$165k for USA)." 
            },
            topHiringLocationsOrRemote: { 
              type: Type.STRING, 
              description: "Top hiring tech hubs located inside target country or remote (e.g. Bengaluru, Hyderabad, Pune for India; London, Manchester for UK; SF, NYC, Seattle for USA)." 
            },
            keyIndustryTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["demandLevel", "avgSalaryRange", "topHiringLocationsOrRemote", "keyIndustryTrends"],
        },
      },
      required: [
        "overallScore",
        "headline",
        "summary",
        "matchCategory",
        "strengths",
        "gaps",
        "skillsAnalysis",
        "careerRoadmap",
        "resumeOptimization",
        "interviewPrep",
        "marketInsights",
      ],
    };

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const jsonText = aiResponse.text;
    if (!jsonText) {
      throw new Error("No response returned from Gemini API.");
    }

    const result = JSON.parse(jsonText);

    // Strict evidence post-processing for matchedTechnicalSkills
    if (result.skillsAnalysis && Array.isArray(result.skillsAnalysis.matchedTechnicalSkills)) {
      const resumeSearchText = (rawText || "").toLowerCase();
      const validMatched: string[] = [];
      const extraMissing: string[] = [];

      for (const sk of result.skillsAnalysis.matchedTechnicalSkills) {
        const skLower = sk.toLowerCase().trim();
        
        // If raw text is present and does not mention "system design", "system architecture", etc.
        if (resumeSearchText.length > 30) {
          if (
            (skLower.includes("system design") || skLower.includes("system architecture")) &&
            !resumeSearchText.includes("system design") &&
            !resumeSearchText.includes("system architecture") &&
            !resumeSearchText.includes("distributed system")
          ) {
            extraMissing.push(sk);
            continue;
          }
        }
        validMatched.push(sk);
      }

      result.skillsAnalysis.matchedTechnicalSkills = validMatched;
      if (extraMissing.length > 0) {
        const existingMissing = new Set(result.skillsAnalysis.missingTechnicalSkills || []);
        extraMissing.forEach((m) => existingMissing.add(m));
        result.skillsAnalysis.missingTechnicalSkills = Array.from(existingMissing);
      }
    }

    // Strict Market Insights Localization Guard
    if (result.marketInsights) {
      const cLower = country.toLowerCase();
      let salary = result.marketInsights.avgSalaryRange || "";
      let locations = result.marketInsights.topHiringLocationsOrRemote || "";

      if (cLower.includes("india")) {
        if (!salary.includes("₹") && !salary.includes("INR") && !salary.includes("LPA")) {
          salary = "₹12,00,000 - ₹28,00,000 INR (12 - 28 LPA)";
        }
        if (!locations.toLowerCase().includes("bengaluru") && !locations.toLowerCase().includes("hyderabad") && !locations.toLowerCase().includes("pune") && !locations.toLowerCase().includes("mumbai") && !locations.toLowerCase().includes("delhi")) {
          locations = "Bengaluru, Hyderabad, Pune, Gurgaon / NCR, Mumbai, Remote (India)";
        }
      } else if (cLower.includes("uk") || cLower.includes("united kingdom")) {
        if (!salary.includes("£") && !salary.includes("GBP")) {
          salary = "£55,000 - £90,000 GBP";
        }
        if (!locations.toLowerCase().includes("london") && !locations.toLowerCase().includes("manchester")) {
          locations = "London, Manchester, Edinburgh, Bristol, Cambridge, Remote (UK)";
        }
      } else if (cLower.includes("canada")) {
        if (!salary.includes("CAD") && !salary.includes("C$")) {
          salary = "C$85,000 - C$135,000 CAD";
        }
        if (!locations.toLowerCase().includes("toronto") && !locations.toLowerCase().includes("vancouver")) {
          locations = "Toronto, Vancouver, Montreal, Ottawa, Calgary, Remote (Canada)";
        }
      } else if (cLower.includes("germany") || cLower.includes("europe")) {
        if (!salary.includes("€") && !salary.includes("EUR")) {
          salary = "€65,000 - €95,000 EUR";
        }
        if (!locations.toLowerCase().includes("berlin") && !locations.toLowerCase().includes("munich") && !locations.toLowerCase().includes("amsterdam")) {
          locations = "Berlin, Munich, Amsterdam, Frankfurt, Paris, Remote (Europe)";
        }
      } else if (cLower.includes("australia")) {
        if (!salary.includes("AUD") && !salary.includes("A$")) {
          salary = "A$110,000 - A$160,000 AUD";
        }
        if (!locations.toLowerCase().includes("sydney") && !locations.toLowerCase().includes("melbourne")) {
          locations = "Sydney, Melbourne, Brisbane, Perth, Remote (Australia)";
        }
      } else if (cLower.includes("singapore")) {
        if (!salary.includes("SGD") && !salary.includes("S$")) {
          salary = "S$85,000 - S$140,000 SGD";
        }
        if (!locations.toLowerCase().includes("singapore")) {
          locations = "Singapore (Central Business District, One-North), Remote (Asia-Pacific)";
        }
      } else if (cLower.includes("remote") || cLower.includes("global")) {
        if (!locations.toLowerCase().includes("worldwide") && !locations.toLowerCase().includes("global")) {
          locations = "Worldwide Remote, Distributed Global Teams";
        }
      }

      result.marketInsights.avgSalaryRange = salary;
      result.marketInsights.topHiringLocationsOrRemote = locations;
    }

    res.json({ success: true, analysis: result });
  } catch (err: any) {
    console.error("Analysis API Error:", err);
    res.status(500).json({
      error: err.message || "Failed to complete career analysis. Please try again.",
    });
  }
});

// 3. Interactive Follow-up Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, resumeText, targetRole, targetCountry, analysisSummary, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    const ai = getGenAIClient();
    const roleName = targetRole || "Software Engineer";
    const countryName = targetCountry || "United States";

    const systemInstruction = `
You are the official RoleReady AI Assistant — An AI Career Platform by PMK.
You are a senior technical recruiter, career strategist, and executive interview coach.

The candidate is seeking career advice regarding their resume analysis for the role of "${roleName}" in the "${countryName}" job market.

FULL CANDIDATE & ANALYSIS CONTEXT:
1. Target Role: "${roleName}"
2. Target Market / Country: "${countryName}"
3. Candidate's Uploaded Resume Text:
${resumeText ? resumeText.substring(0, 4000) : "Resume provided for analysis."}

4. Analysis Summary Data:
${JSON.stringify(analysisSummary || {}, null, 2)}

STRICT CORE RULES:
1. ZERO HALLUCINATION POLICY FOR CONFIRMED SKILLS:
   - NEVER invent, claim, or assume any skill, technology, framework, database, tool, certification, project, or achievement that is NOT explicitly present in the candidate's uploaded resume text.
   - You MUST maintain a strict separation between "Confirmed Resume Evidence" (skills found in the resume) and "Recommended Skills / Skill Gaps" (skills the candidate needs to learn for the target role).
   - If the candidate asks you to rewrite a resume bullet point, use ONLY facts, metrics, tools, and experiences mentioned in their resume. Do not fabricate fake metrics or technologies.

2. LOCALIZED MARKET & CAREER ADVICE:
   - For salary, hiring hubs, or market demand questions, refer to the localized market insights for "${countryName}". Use local currencies (e.g. INR ₹ for India, USD $ for USA, GBP £ for UK, CAD C$ for Canada, EUR € for Europe, AUD A$ for Australia, SGD S$ for Singapore).

3. COMPREHENSIVE CAREER GUIDANCE:
   - Provide highly specific, actionable advice on:
     * Closing technical skill gaps (referencing their Career Roadmap).
     * Resume STAR rewrites (Situation, Task, Action, Result).
     * Technical & behavioral interview preparation.
     * Career elevator pitches and role positioning.

4. FORMATTING & TONE:
   - Professional, encouraging, crisp, and direct.
   - Use clean Markdown with bolding, bullet points, and code blocks where helpful.
`;

    // Construct conversation messages
    const contents: any[] = [];

    if (history && Array.isArray(history)) {
      history.slice(-10).forEach((msg) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      reply: response.text || "I am here to help you navigate your career path with RoleReady AI by PMK. Could you please specify your question?",
    });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    res.status(500).json({
      error: err.message || "Unable to process chat request. Please try again.",
    });
  }
});

// ==========================================
// AUTHENTICATION & SAVED ANALYSES ENDPOINTS
// ==========================================

// 1. Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Please provide a valid email and a password of at least 6 characters." });
    }

    const users = loadUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      email: email.toLowerCase().trim(),
      name: (name || email.split("@")[0]).trim(),
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = jsonwebtoken.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, {
      expiresIn: "30d",
    });

    const userObj = { id: newUser.id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt };
    res.json({ success: true, token, user: userObj });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create user account." });
  }
});

// 2. Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const users = loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jsonwebtoken.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: "30d",
    });

    const userObj = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
    res.json({ success: true, token, user: userObj });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to authenticate user." });
  }
});

// 3. Request Password Reset
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Please enter your registered email address." });
    }

    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (userIndex === -1) {
      return res.status(404).json({ error: "No account found with this email address. Please check your spelling or create an account." });
    }

    const user = users[userIndex];

    // Generate a secure 6-digit numeric reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresMs = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    users[userIndex].resetToken = resetToken;
    users[userIndex].resetTokenExpires = expiresMs;
    saveUsers(users);

    const resendApiKey = process.env.RESEND_API_KEY || process.env.RESET_API_KEY;

    if (resendApiKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RoleReady AI <onboarding@resend.dev>",
            to: [user.email],
            subject: "Your RoleReady AI Password Reset Code",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
                <h2 style="color: #38bdf8; margin-top: 0;">Password Reset Request</h2>
                <p>Hello ${user.name || "User"},</p>
                <p>We received a request to reset your password for your <strong>RoleReady AI</strong> account.</p>
                <p>Your 6-digit verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; padding: 16px 24px; background-color: #1e293b; border-radius: 12px; display: inline-block; margin: 16px 0; border: 1px solid #334155;">
                  ${resetToken}
                </div>
                <p style="color: #94a3b8; font-size: 14px;">This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errData = await emailRes.json().catch(() => ({}));
          console.error("Resend API error:", errData);
          return res.status(500).json({ error: `Failed to deliver email: ${errData.message || emailRes.statusText}` });
        }
      } catch (emailErr: any) {
        console.error("Email send exception:", emailErr);
        return res.status(500).json({ error: "Failed to send reset code email. Please try again later." });
      }
    } else {
      console.warn("RESEND_API_KEY / RESET_API_KEY is not configured in server environment.");
      return res.status(500).json({
        error: "Password reset email could not be sent because RESEND_API_KEY is not configured in server environment variables. Please add RESEND_API_KEY to your server secrets."
      });
    }

    // NEVER return resetToken in the API response or client logs
    res.json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${user.email}. Please check your inbox and enter the code.`,
      expiresInMinutes: 15,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process password reset request." });
  }
});

// 4. Perform Password Reset
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Please provide a valid reset token and a new password of at least 6 characters." });
    }

    const users = loadUsers();
    let userIndex = -1;

    if (email) {
      userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.resetToken === resetToken.trim());
    } else {
      userIndex = users.findIndex((u) => u.resetToken === resetToken.trim());
    }

    if (userIndex === -1) {
      return res.status(400).json({ error: "Invalid password reset token or email. Please check your token and try again." });
    }

    const user = users[userIndex];

    if (!user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
      // Clear expired token
      users[userIndex].resetToken = null;
      users[userIndex].resetTokenExpires = null;
      saveUsers(users);
      return res.status(400).json({ error: "The password reset token has expired. Please request a new password reset." });
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].passwordHash = hashedPassword;

    // Single-use token invalidation
    users[userIndex].resetToken = null;
    users[userIndex].resetTokenExpires = null;

    saveUsers(users);

    res.json({
      success: true,
      message: "Your password has been successfully reset! You can now log in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// 5. Get Current User Info
app.get("/api/auth/me", authMiddleware, (req: any, res: any) => {
  res.json({ success: true, user: req.user });
});

// 4. Save Career Analysis
app.post("/api/analyses", authMiddleware, (req: any, res: any) => {
  try {
    const { title, targetRole, targetCountry, experienceLevel, overallScore, matchCategory, resumeData, analysisData } = req.body;

    if (!analysisData) {
      return res.status(400).json({ error: "Missing analysis data to save." });
    }

    const analyses = loadAnalyses();
    const newAnalysis = {
      id: "anl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId: req.user.id,
      title: title || `${targetRole || "Career"} Analysis - ${new Date().toLocaleDateString()}`,
      targetRole: targetRole || "Software Engineer",
      targetCountry: targetCountry || "United States",
      experienceLevel: experienceLevel || "Mid-Level",
      overallScore: overallScore || analysisData.overallScore || 0,
      matchCategory: matchCategory || analysisData.matchCategory || "Strong Match",
      resumeData: resumeData || null,
      analysisData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    analyses.unshift(newAnalysis);
    saveAnalyses(analyses);

    res.json({ success: true, analysis: newAnalysis });
  } catch (err: any) {
    console.error("Save analysis error:", err);
    res.status(500).json({ error: "Failed to save analysis report." });
  }
});

// 5. Get User's Saved Analyses
app.get("/api/analyses", authMiddleware, (req: any, res: any) => {
  try {
    const analyses = loadAnalyses();
    const userAnalyses = analyses.filter((a) => a.userId === req.user.id);
    res.json({ success: true, analyses: userAnalyses });
  } catch (err: any) {
    console.error("Get analyses error:", err);
    res.status(500).json({ error: "Failed to load saved analyses." });
  }
});

// 6. Get Single Saved Analysis by ID
app.get("/api/analyses/:id", authMiddleware, (req: any, res: any) => {
  try {
    const analyses = loadAnalyses();
    const item = analyses.find((a) => a.id === req.params.id && a.userId === req.user.id);
    if (!item) {
      return res.status(404).json({ error: "Saved analysis report not found." });
    }
    res.json({ success: true, analysis: item });
  } catch (err: any) {
    console.error("Get analysis item error:", err);
    res.status(500).json({ error: "Failed to load analysis." });
  }
});

// 7. Rename Analysis
app.put("/api/analyses/:id", authMiddleware, (req: any, res: any) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty." });
    }

    const analyses = loadAnalyses();
    const index = analyses.findIndex((a) => a.id === req.params.id && a.userId === req.user.id);
    if (index === -1) {
      return res.status(404).json({ error: "Saved analysis report not found." });
    }

    analyses[index].title = title.trim();
    analyses[index].updatedAt = new Date().toISOString();
    saveAnalyses(analyses);

    res.json({ success: true, analysis: analyses[index] });
  } catch (err: any) {
    console.error("Rename analysis error:", err);
    res.status(500).json({ error: "Failed to rename analysis." });
  }
});

// 8. Delete Analysis
app.delete("/api/analyses/:id", authMiddleware, (req: any, res: any) => {
  try {
    const analyses = loadAnalyses();
    const filtered = analyses.filter((a) => !(a.id === req.params.id && a.userId === req.user.id));
    saveAnalyses(filtered);
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    console.error("Delete analysis error:", err);
    res.status(500).json({ error: "Failed to delete analysis." });
  }
});

// Global Error Handler Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Express Error Handler:", err);
  res.status(500).json({ error: err.message || "An internal server error occurred." });
});

// Serve frontend in dev / production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RoleReady AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
