import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Gemini features will fail.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Review focus instructions map
const FOCUS_INSTRUCTIONS: Record<string, string> = {
  all: "Check for everything: bugs, runtime crash risks, formatting, security flaws, performance degradation, and code style issues.",
  security: "Prioritize security flaws, inputs validation, SQL injections, insecure usage of packages, cross-site scripting (XSS), leakage of secrets, and safety hazards.",
  performance: "Prioritize runtime efficiency, memory usage, wasteful loops, unnecessary objects instantiation, Big-O complexity optimizations, and thread-blocking logic.",
  readability: "Prioritize formatting consistency, self-documenting naming conventions, redundancy, modular function splitting, clean code rules, and ease of comprehension.",
};

// Senior Developer persona prompt prefixes
const PERSONA_PROMPTS: Record<string, string> = {
  mentor: "You are the 'Classic Mentor'. You are patient, kind, constructive, and balanced. You explain concepts clearly, teaching 'why' things are bad and celebrating what the coder got right while ensuring bugs are fixed.",
  speedrunner: "You are 'The Speedrunner' (Extreme Performance Architect). You care deeply about high-speed execution, minimal allocation, optimized CPU cycles, caching, clean algorithms, and Big-O complexity. You can be direct, highly focused on nanosecond reductions, and concise.",
  auditor: "You are the paranoid 'Security Auditor'. You treat all code as potentially vulnerable. You look for security holes, injection vectors, data structures leaks, OWASP top 10 flaws, and trust boundaries. Your feedback is rigorous, security-focused, and formal.",
  pragmatist: "You are 'The Pragmatist'. You focus purely on real-world maintainability, ease of reading, sensible defaults, avoiding premature optimizations, and simplicity. You prefer simple, maintainable code over overly sophisticated abstraction.",
};

// JSON Schema for review report
const ReviewReportSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: "Overall health score from 0 (broken/unusable/insecure) to 100 (production-ready)",
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        security: { type: Type.INTEGER, description: "Security hygiene rating from 0 to 100" },
        performance: { type: Type.INTEGER, description: "Resource and runtime speed estimation rating from 0 to 100" },
        readability: { type: Type.INTEGER, description: "Styling, documentation, and structure mapping from 0 to 100" },
        maintainability: { type: Type.INTEGER, description: "Modularity, robustness, and ease of testing from 0 to 100" },
      },
      required: ["security", "performance", "readability", "maintainability"],
    },
    summary: {
      type: Type.STRING,
      description: "A professional senior developer overview of the code quality, high-level highlights, and key areas of improvement.",
    },
    issues: {
      type: Type.ARRAY,
      description: "List of code issues categorized with severities. Keep list focused on concrete issues.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique short identifier (e.g. bug_1, perf_2)" },
          title: { type: Type.STRING, description: "Clear, concise bug description title" },
          description: { type: Type.STRING, description: "A summary sentence of why this code line/pattern is bad or buggy" },
          severity: {
            type: Type.STRING,
            description: "Severity category",
            enum: ["critical", "warning", "best_practice", "info"],
          },
          lineStart: { type: Type.INTEGER, description: "Opening line number (1-based, integer) in original file where issue lies" },
          lineEnd: { type: Type.INTEGER, description: "Closing line number (1-based, integer) in original file" },
          snippetBefore: { type: Type.STRING, description: "The original buggy snippet from user code (exact match)" },
          snippetAfter: { type: Type.STRING, description: "Refactored/corrected replacement snippet specifically for this issue" },
          explanation: { type: Type.STRING, description: "Detailed technical explanation explaining why it was bad, the underlying principle, and why the fix works." },
        },
        required: ["id", "title", "description", "severity", "explanation"],
      },
    },
    refactoredCode: {
      type: Type.STRING,
      description: "Strictly complete, syntactically correct refactored file content integrating ALL of your recommended fixes. Ensure it compiles perfectly.",
    },
  },
  required: ["overallScore", "metrics", "summary", "issues", "refactoredCode"],
};

// JSON Schema for Security scan results
const SecurityScanResultSchema = {
  type: Type.OBJECT,
  properties: {
    vulnerabilityCount: {
      type: Type.INTEGER,
      description: "Total number of security issues detected",
    },
    rating: {
      type: Type.INTEGER,
      description: "Overall security rating/score from 0 (insecure) to 100 (hardened)",
    },
    status: {
      type: Type.STRING,
      description: "Risk categorization rating",
      enum: ["secure", "warn", "danger"],
    },
    vulnerabilities: {
      type: Type.ARRAY,
      description: "Detailed list of security flaws",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Vulnerability short identifier (e.g. SEC-1)" },
          title: { type: Type.STRING, description: "Actionable vulnerable title description" },
          cwe: { type: Type.STRING, description: "Common Weakness Enumeration ID (e.g. CWE-89)" },
          severity: {
            type: Type.STRING,
            description: "Severity rating",
            enum: ["critical", "high", "medium", "low"],
          },
          description: { type: Type.STRING, description: "Technical summary of why this code line/pattern is unsafe" },
          lineStart: { type: Type.INTEGER, description: "Vulnerable code start line (1-based)" },
          lineEnd: { type: Type.INTEGER, description: "Vulnerable code end line (1-based)" },
          snippetBefore: { type: Type.STRING, description: "The original insecure code segment (exact match)" },
          snippetAfter: { type: Type.STRING, description: "Secured replacement snippet addressing this specific vulnerability" },
          impact: { type: Type.STRING, description: "Exploit risk impact description" },
          remediation: { type: Type.STRING, description: "Targeted step-by-step resolution advice" },
          owaspCategory: { type: Type.STRING, description: "OWASP Top 10 category (e.g. A03:2021-Injection)" },
        },
        required: ["id", "title", "cwe", "severity", "description", "owaspCategory", "remediation", "impact"],
      },
    },
  },
  required: ["vulnerabilityCount", "rating", "status", "vulnerabilities"],
};

// 1. Instantly Fast Security Scan Endpoint
app.post("/api/security-scan", async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code submitted for scanning." });
  }

  const systemPrompt = `
You are a highly paranoid, certified Lead Application Security Auditor (OSCP/SecOps).
Your sole agenda is to perform a rapid, precise, high-fidelity security scan of the user's submitted code.

Language of the code: ${language}.

Analyze the code rigorously for:
1. SQL Injection (SQLi), Cross-Site Scripting (XSS), Command Injections, LDAP/NoSQL exploits.
2. Hardcoded API secrets, embedded credential strings, database keys, authorization tokens.
3. Cryptographic flaws, insecure custom hashing (MD5/SHA1), static salts, weak verify loops.
4. Broken Access Controls, IDOR vectors, Session leakages, missing CORS control, header bypasses.
5. Directory travel paths, prototype pollutions, unchecked deserialization.

Keep your evaluation extremely fast and targeted. ONLY output findings that represent bona fide security flaws.
For each finding, supply a short localized 'snippetAfter' that exhibits the secure coding pattern.
Include OWASP Top 10 categories (e.g. A03:2021-Injection) and CWE IDs.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: "Perform a security scan on this code:\n\n" + code }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: SecurityScanResultSchema,
        temperature: 0.1, // Highly precise and low entropy analysis
      },
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error("Empty response from AI security auditing system.");
    }

    res.json(JSON.parse(reportText));
  } catch (error: any) {
    console.error("Gemini API Security Scan Error:", error);
    res.status(500).json({
      error: "Failed to compile security scan report.",
      details: error.message || String(error),
    });
  }
});

// 2. Code Review Endpoint
app.post("/api/review", async (req, res) => {
  const { code, language, focus, persona } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code submitted for review." });
  }

  const focusInstruction = FOCUS_INSTRUCTIONS[focus] || FOCUS_INSTRUCTIONS.all;
  const personaInstruction = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.mentor;

  const systemPrompt = `
You are a highly skilled, world-class Senior Developer and Technical Lead.
${personaInstruction}

Your task is to comprehensively review the user's submitted code.
Language of the code: ${language}.
Focus area: ${focusInstruction}.

Analyze the code for:
1. Critical runtime bugs, crashes, state issues, infinite loops.
2. Performance drains, high scaling complexity, slow loops, leakage of memory/handlers.
3. Security threats, SQL injections, unsafe system processes, secrets leakage.
4. General clean-code style, readability, naming conventions, redundancy.

You must fill out the final structured JSON review report exactly answering the requested Schema.
Ensure the 'refactoredCode' is the complete, working, production-ready replacement of the user's input with all your fixes incorporated.
For individual code issues, identify 'lineStart', 'lineEnd', 'snippetBefore', and 'snippetAfter' wherever possible to facilitate inline overlays.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: "Here is the code to review:\n\n" + code }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: ReviewReportSchema,
        temperature: 0.2, // Low temperature for consistent analysis
      },
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error("Empty response from AI engine.");
    }

    const report = JSON.parse(reportText);
    res.json(report);
  } catch (error: any) {
    console.error("Gemini API Code Review Error:", error);
    res.status(500).json({
      error: "Failed to parse code review response.",
      details: error.message || String(error),
    });
  }
});

// 2. Chat Follow-Up Endpoint (Real-Time Streaming)
app.post("/api/review/chat", async (req, res) => {
  const { code, language, report, messages, persona } = req.body;

  if (!code || !messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing conversation context." });
  }

  const personaInstruction = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.mentor;

  // Format historical messages
  const formattedHistory = messages.slice(0, -1).map((m: any) => {
    return `${m.sender === "user" ? "Developer (User)" : "Senior Reviewer (AI)"}: ${m.text}`;
  }).join("\n\n");

  const latestMessage = messages[messages.length - 1].text;

  const systemPrompt = `
You are a Senior Reviewer answering follow-up questions from a developer regarding your recent code review.
${personaInstruction}

Code language: ${language}.

Here is the original submitted code under discussion:
\`\`\`${language}
${code}
\`\`\`

Here is a summary of the code review report you drafted earlier:
- Score: ${report?.overallScore}/100
- Brief Summary: ${report?.summary}
- Number of issues identified: ${report?.issues?.length || 0}

Rules for writing follow-up answers:
1. Always stay in character as defined by your persona (${personaInstruction}).
2. Support your explanations with concise, accurate code blocks.
3. Be respectful and educational, promoting high-quality engineering decisions.
4. Keep answers brief, elegant, and directly in line with what is asked.
`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: [
        { text: `Conversation History:\n${formattedHistory}\n\nLatest Question: ${latestMessage}` }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Gemini API Chat Error:", error);
    // If headers already sent, we cannot send standard json error response
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred mid-generation" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        error: "Reviewer could not formulate a response.",
        details: error.message || String(error),
      });
    }
  }
});

// Vite middleware flow or production static assets handling and server startup wrapped in async bootstrap to avoid top-level await issues
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Senior Developer Review Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap error:", err);
});
