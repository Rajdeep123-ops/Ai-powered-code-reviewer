import React, { useState, useEffect } from "react";
import CodeInputPane, { PERSONAS } from "./components/CodeInputPane";
import BentoSummaryCard from "./components/BentoSummaryCard";
import ReviewOutputPane from "./components/ReviewOutputPane";
import FollowUpChat from "./components/FollowUpChat";
import SecurityScannerPane from "./components/SecurityScannerPane";
import { Language, ReviewFocus, PersonaId, CodeReviewReport, ChatMessage, SecurityScanResult } from "./types";
import { DUMMY_EXAMPLES } from "./utils/dummyExamples";
import { runLocalSecurityScan } from "./utils/localSecurityScanner";
import { runLocalQualityScan } from "./utils/localQualityScanner";
import { CodeIssue } from "./types";
import { Bot, Terminal, Code2, AlertCircle, Wrench, Shield, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

export default function App() {
  const [code, setCode] = useState<string>(DUMMY_EXAMPLES[0].code);
  const [language, setLanguage] = useState<Language>("typescript");
  const [focus, setFocus] = useState<ReviewFocus>("all");
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>("mentor");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<CodeReviewReport | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Security scanning states
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"review" | "security">("review");
  const [localFindingsCount, setLocalFindingsCount] = useState<number>(0);
  const [localQualityIssues, setLocalQualityIssues] = useState<CodeIssue[]>([]);

  // Auto run quick static pre-scan analysis instantly as user is typing
  useEffect(() => {
    if (!code) {
      setLocalFindingsCount(0);
      setLocalQualityIssues([]);
      return;
    }
    const localIssues = runLocalSecurityScan(code, language);
    setLocalFindingsCount(localIssues.length);

    const localQual = runLocalQualityScan(code, language);
    setLocalQualityIssues(localQual);
  }, [code, language]);

  const activePersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  useEffect(() => {
    let greetingText = "";
    switch (selectedPersona) {
      case "mentor":
        greetingText = `👋 Hello! Let me look over your script as the Classic Mentor. Paste you code and let's identify bugs or clean documentation standards together.`;
        break;
      case "speedrunner":
        greetingText = `⚡ Performance Architect listening. Supply sub-optimal algorithms and loops. I will rewrite them to maximize throughput and minimize cycles.`;
        break;
      case "auditor":
        greetingText = `🛡️ Security Auditor active. I am auditing for OWASP, leakage of secrets, input vulnerability flows, and memory risks. Let's harden your codebase.`;
        break;
      case "pragmatist":
        greetingText = `🔧 Pragmatist ready. Let's simplify over-engineered designs and focus on clean structures that are easy to maintain in production.`;
        break;
    }

    setMessages([
      {
        id: "greet",
        sender: "reviewer",
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [selectedPersona]);

  const handleReviewCode = async () => {
    if (!code.trim() || isLoading) return;

    setIsLoading(true);
    setErrorHeader(null);
    setReport(null);
    setActiveTab("review"); // switch back to code quality room on full analysis

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          focus,
          persona: selectedPersona,
        }),
      });

      if (!response.ok) {
        throw new Error("Local analysis backend responded with an error structure.");
      }

      const data = await response.json();
      setReport(data);

      const announcement: ChatMessage = {
        id: `ann_${Date.now()}`,
        sender: "reviewer",
        text: `📊 **Audit complete!** Raw health index score: **${data.overallScore}/100**.\n\n${
          data.issues.length === 0
            ? "Pristine execution! No critical security threats or syntax bugs identified."
            : `I've filed **${data.issues.length} actionable review findings** in your bento report! Head to **"Review Findings"** or click **"Refactored"** next to verify our recommended layouts.`
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, announcement]);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(
        err.message || "Failed to establish communication with background static review processor. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityScan = async () => {
    if (!code.trim() || isScanning) return;

    setIsScanning(true);
    setActiveTab("security");
    setErrorHeader(null);
    setScanResult(null);

    try {
      const response = await fetch("/api/security-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Security audit scanner backend responded with an error.");
      }

      const data = await response.json();
      setScanResult(data);

      const securityAnnouncement: ChatMessage = {
        id: `sec_${Date.now()}`,
        sender: "reviewer",
        text: `🛡️ **Security Scan Complete!** Overall Security Grade: **${data.rating}/100**.\n\n${
          data.vulnerabilityCount === 0
            ? "Safe profile verified! No immediate injection vectors, credentials leakage, or OWASP risks detected."
            : `Discovered **${data.vulnerabilityCount} security vulnerability areas** requiring remediation.`
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, securityAnnouncement]);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(
        err.message || "Failed to establish communication with background security scanner API."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setReport(null);
    setScanResult(null);
    setErrorHeader(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-sans select-none antialiased p-4 sm:p-6">
      {/* Upper Navigation bar segment */}
      <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl select-none">
            R
          </div>
          <div>
            <h1 className="text-zinc-100 font-semibold text-lg tracking-tight">AI-Powered Code Reviewer</h1>
            <p className="text-xs text-zinc-550 font-mono uppercase tracking-wider">
              v2.5 • Connected to Gemini-3.5-Flash
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-reset-workspace"
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800/80 hover:text-zinc-250 font-mono font-medium transition cursor-pointer flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Editor</span>
          </button>
          <div className="px-3 py-1.5 bg-zinc-950/40 border border-zinc-850 text-[10px] rounded-lg font-mono text-zinc-500 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>AI Ready</span>
          </div>
        </div>
      </header>

      {/* Connectivity error warning alerts drawer */}
      {errorHeader && (
        <div className="mb-6 p-4 bg-rose-955/20 bg-rose-950/20 border border-rose-500/20 text-rose-300 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-xs font-mono font-semibold uppercase tracking-wider">evaluation_halted</h5>
            <p className="text-xs text-zinc-300 mt-1 leading-normal">{errorHeader}</p>
          </div>
        </div>
      )}

      {/* Bento Grid layout room selector tab switcher */}
      <div className="flex bg-zinc-900 border border-zinc-800/80 p-1 rounded-xl shadow-inner max-w-lg mx-auto mb-6">
        <button
          onClick={() => setActiveTab("review")}
          id="tab-code-review-quality"
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
            activeTab === "review"
              ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>💻 Code General Audit Room</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          id="tab-security-shield-auditor"
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer relative ${
            activeTab === "security"
              ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>🛡️ Security Shield Room</span>
          {localFindingsCount > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-500 text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded-full animate-bounce">
              {localFindingsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main interactive grid following clean bento arrangement */}
      <div className="grid grid-cols-12 gap-4 flex-1 items-stretch min-h-0">
        
        {/* Bento Cell 1: Main Code Input / Editor Area */}
        <div className="col-span-12 lg:col-span-8 lg:row-span-4 flex flex-col h-full min-h-[420px]">
          <CodeInputPane
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            focus={focus}
            setFocus={setFocus}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            isLoading={isLoading || isScanning}
            onReview={activeTab === "security" ? handleSecurityScan : handleReviewCode}
          />
        </div>

        {activeTab === "review" ? (
          <>
            {/* Bento Cell 2: Aggregate Score Metric Status Card */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-2 flex flex-col min-h-[220px]">
              <BentoSummaryCard report={report} isLoading={isLoading} />
            </div>

            {/* Bento Cell 3: Detailed Findings, Accordions and Refactored Output */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-2 flex flex-col min-h-[300px]">
              <ReviewOutputPane
                report={report}
                isLoading={isLoading}
                selectedLanguage={language}
                localIssues={localQualityIssues}
                onInitiateAIScan={handleReviewCode}
              />
            </div>
          </>
        ) : (
          /* Bento Cell: Dedicated Security Vulnerability Scanner Pane replacing items on the right side */
          <div className="col-span-12 lg:col-span-4 lg:row-span-4 flex flex-col min-h-[450px]">
            <SecurityScannerPane
              scanResult={scanResult}
              localFindingsCount={localFindingsCount}
              isLoading={isScanning}
              onInitiateScan={handleSecurityScan}
              codeEmpty={!code.trim()}
            />
          </div>
        )}

        {/* Bento Cell 4: Follow up Dialogue Chat Panel with persona */}
        <div className="col-span-12 lg:col-span-12 lg:row-span-2 flex flex-col min-h-[300px]">
          <FollowUpChat
            code={code}
            language={language}
            report={report}
            personaDef={activePersona}
            messages={messages}
            setMessages={setMessages}
          />
        </div>

      </div>

      {/* System info metrics footer */}
      <footer className="mt-6 pt-4 border-t border-zinc-900 flex justify-between text-[10px] text-zinc-650 font-mono select-none">
        <div className="flex gap-4">
          <span>HOST: PORT_3000</span>
          <span>COMPLEXITY: BIG-O</span>
        </div>
        <div className="flex gap-2">
          <span>LOCAL_NODE: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
