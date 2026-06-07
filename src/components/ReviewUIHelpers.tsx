import React, { useState } from "react";
import { Check, Clipboard } from "lucide-react";

// Helper 1: Clipboard Copying Button
export function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <button
      id="btn-copy-code"
      onClick={handleCopy}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border cursor-pointer select-none transition shadow-sm ${
        copied
          ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/30"
          : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
      }`}
    >
      {copied ? (
        <>
          <Check id="check-icon" className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Clipboard id="copy-icon" className="w-3.5 h-3.5" />
          <span>Copy Code</span>
        </>
      )}
    </button>
  );
}

// Helper 2: Accordion Container Block
export function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20">
      <button
        onClick={onToggle}
        className="w-full text-left p-3 flex justify-between items-center hover:bg-slate-950/50 transition cursor-pointer"
      >
        <span className="text-xs font-mono font-semibold tracking-wide text-slate-300">{title}</span>
        <span className="text-slate-500 text-xs font-mono">{isOpen ? "[ HIDE ]" : "[ SHOW ]"}</span>
      </button>
      {isOpen && <div className="p-3 border-t border-slate-800 bg-slate-950/40">{children}</div>}
    </div>
  );
}

// Helper 3: Radial Scoring Dial Ring Gauge
interface MetricRingProps {
  label: string;
  value: number; // 0-100
  color: "rose" | "amber" | "emerald" | "indigo";
}

export function MetricRing({ label, value, color }: MetricRingProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorStyles = {
    rose: {
      text: "text-rose-400",
      circle: "stroke-rose-500",
      bgFill: "bg-rose-500/5",
      border: "border-rose-500/10",
      trail: "stroke-rose-950/40",
    },
    amber: {
      text: "text-amber-400",
      circle: "stroke-amber-500",
      bgFill: "bg-amber-500/5",
      border: "border-amber-500/10",
      trail: "stroke-amber-950/45",
    },
    emerald: {
      text: "text-emerald-400",
      circle: "stroke-emerald-500",
      bgFill: "bg-emerald-500/5",
      border: "border-emerald-500/10",
      trail: "stroke-emerald-950/40",
    },
    indigo: {
      text: "text-indigo-400",
      circle: "stroke-indigo-500",
      bgFill: "bg-indigo-500/5",
      border: "border-indigo-500/10",
      trail: "stroke-indigo-950/40",
    },
  }[color];

  return (
    <div className={`flex items-center space-x-3 p-3 bg-slate-950/40 border ${colorStyles.border} ${colorStyles.bgFill} rounded-xl shadow-sm`}>
      {/* SVG Arc Progress Loader bar */}
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className={`${colorStyles.trail} fill-none`}
            strokeWidth="3.5"
          />
          {/* Foreground active ring path */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className={`${colorStyles.circle} fill-none transition-all duration-1000 ease-out`}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Absolute center percentage text */}
        <span className="absolute text-xs font-mono font-bold text-slate-100">
          {value}%
        </span>
      </div>

      <div className="min-w-0">
        <span className="block text-[11px] font-semibold text-slate-200 truncate">{label}</span>
        <span className={`text-[10px] font-mono ${colorStyles.text}`}>
          {value >= 85 ? "Excellent" : value >= 65 ? "Moderate" : "Needs Fix"}
        </span>
      </div>
    </div>
  );
}
