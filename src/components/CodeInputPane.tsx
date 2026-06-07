import React, { useRef, useEffect } from "react";
import { Language, ReviewFocus, PersonaId, PersonaDef } from "../types";
import { DUMMY_EXAMPLES } from "../utils/dummyExamples";
import { Code, Bot, Shield, Zap, Sparkles, Terminal, FileCode2 } from "lucide-react";

interface CodeInputPaneProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: Language;
  setLanguage: (lang: Language) => void;
  focus: ReviewFocus;
  setFocus: (focus: ReviewFocus) => void;
  selectedPersona: PersonaId;
  setSelectedPersona: (p: PersonaId) => void;
  isLoading: boolean;
  onReview: () => void;
}

export const PERSONAS: PersonaDef[] = [
  {
    id: "mentor",
    name: "Classic Mentor",
    role: "Engineering Manager",
    avatar: "👨‍🏫",
    description: "Constructive feedback and solid engineering fundamentals for everyday coding.",
    emoji: "👨‍🏫",
  },
  {
    id: "speedrunner",
    name: "Speedrunner",
    role: "Performance Lead",
    avatar: "⚡",
    description: "Latency metrics, optimization loops, and custom asymptotic performance.",
    emoji: "⚡",
  },
  {
    id: "auditor",
    name: "Security Lead",
    role: "SecOps Specialist",
    avatar: "🛡️",
    description: "Rigorous vulnerability checking, injection vectors, and data security standards.",
    emoji: "🛡️",
  },
  {
    id: "pragmatist",
    name: "Pragmatist",
    role: "Senior Consultant",
    avatar: "🔧",
    description: "Simple, highly read templates following long-term sustainable software patterns.",
    emoji: "🔧",
  },
];

const STYLES_BY_LANG: Record<Language, { label: string; ext: string }> = {
  typescript: { label: "TypeScript", ext: ".ts" },
  javascript: { label: "JavaScript", ext: ".js" },
  python: { label: "Python", ext: ".py" },
  cpp: { label: "C++", ext: ".cpp" },
  rust: { label: "Rust", ext: ".rs" },
  go: { label: "Go", ext: ".go" },
  java: { label: "Java", ext: ".java" },
  html_css_js: { label: "HTML/CSS/JS", ext: ".html" },
};

export default function CodeInputPane({
  code,
  setCode,
  language,
  setLanguage,
  focus,
  setFocus,
  selectedPersona,
  setSelectedPersona,
  isLoading,
  onReview,
}: CodeInputPaneProps) {
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const numbersEl = document.getElementById("line-numbers-col-bento");
    if (numbersEl) {
      numbersEl.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
    }
  };

  const loadExample = (codeText: string, lang: Language) => {
    setCode(codeText);
    setLanguage(lang);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-colors">
      {/* Examples Header Section */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-4 py-2.5 gap-2">
        <div className="flex items-center space-x-2">
          <Terminal id="icon-terminal" className="w-4.5 h-4.5 text-indigo-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            source_workspace
          </span>
        </div>

        {/* Example snippets */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-zinc-500 font-mono">Presets:</span>
          <div className="flex flex-wrap gap-1">
            {DUMMY_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                id={`btn-example-${idx}`}
                onClick={() => loadExample(ex.code, ex.language)}
                className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-750 active:bg-zinc-950 border border-zinc-700 rounded transition font-medium cursor-pointer"
              >
                {ex.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor controllers bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-850 border-zinc-805 border-zinc-800/60 bg-zinc-950/20 px-4 py-2 gap-2">
        <div className="flex items-center space-x-1.5">
          <FileCode2 id="icon-lang" className="w-4 h-4 text-emerald-400" />
          <select
            id="select-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-zinc-800 text-zinc-200 text-[11px] font-mono px-2 py-0.5 border border-zinc-700 rounded focus:outline-none cursor-pointer"
          >
            {Object.entries(STYLES_BY_LANG).map(([id, def]) => (
              <option key={id} value={id}>
                {def.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Focus */}
        <div className="flex items-center space-x-0.5 bg-zinc-950/50 p-1 border border-zinc-800 rounded-lg">
          <button
            id="focus-all"
            onClick={() => setFocus("all")}
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded transition font-medium cursor-pointer ${
              focus === "all"
                ? "bg-indigo-600 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            Comprehensive
          </button>
          <button
            id="focus-security"
            onClick={() => setFocus("security")}
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded transition font-medium flex items-center space-x-1 cursor-pointer ${
              focus === "security"
                ? "bg-rose-600/90 text-white"
                : "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/40"
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Security</span>
          </button>
          <button
            id="focus-performance"
            onClick={() => setFocus("performance")}
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded transition font-medium flex items-center space-x-1 cursor-pointer ${
              focus === "performance"
                ? "bg-amber-600/90 text-white"
                : "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/40"
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Performance</span>
          </button>
          <button
            id="focus-readability"
            onClick={() => setFocus("readability")}
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded transition font-medium flex items-center space-x-1 cursor-pointer ${
              focus === "readability"
                ? "bg-emerald-600/90 text-white"
                : "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/40"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Readability</span>
          </button>
        </div>
      </div>

      {/* Editor Workspace view */}
      <div className="flex-1 flex min-h-[220px] relative bg-zinc-950/20">
        {/* Line Numbers */}
        <div
          id="line-numbers-col-bento"
          className="w-10 select-none text-right font-mono text-[10px] sm:text-xs text-zinc-600 bg-zinc-950/40 py-3 pr-2.5 overflow-hidden h-full flex flex-col pointer-events-none opacity-60 border-r border-zinc-900"
          style={{ scrollbarWidth: "none" }}
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-5 leading-5">
              {num}
            </div>
          ))}
        </div>

        {/* Input box */}
        <textarea
          id="textarea-editor"
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          placeholder="// Paste sub-optimal functions, code segments, or full scripts to audit...\n// Select presets from the top list to test loops, SQL queries or API risks."
          className="flex-1 resize-none bg-transparent font-mono text-xs sm:text-sm text-zinc-200 p-3 leading-5 focus:outline-none overflow-y-auto h-full scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent select-all"
          spellCheck="false"
        />
      </div>

      {/* Persona Selecting Frame */}
      <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 shrink-0">
        <h4 className="text-[10px] font-mono font-medium tracking-wider text-zinc-450 uppercase mb-2 flex items-center space-x-1">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Evaluation Persona Agent</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {PERSONAS.map((person) => (
            <button
              key={person.id}
              id={`btn-persona-${person.id}`}
              onClick={() => setSelectedPersona(person.id)}
              className={`flex flex-col items-start p-2 rounded-lg border text-left transition cursor-pointer select-none ${
                selectedPersona === person.id
                  ? "bg-indigo-950/20 border-indigo-500 text-indigo-300 shadow-sm"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-550 hover:bg-zinc-850 hover:border-zinc-705 matches hover:border-zinc-750"
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className="text-xs">{person.avatar}</span>
                <span className="text-[11px] font-semibold text-zinc-200">{person.name}</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-normal line-clamp-2">
                {person.description}
              </p>
            </button>
          ))}
        </div>

        {/* Action button */}
        <button
          id="btn-trigger-review"
          onClick={onReview}
          disabled={isLoading || !code.trim()}
          className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Refining Syntax Analysis...</span>
            </div>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5" />
              <span>Execute AI Code review</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
