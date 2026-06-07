import React from "react";
import { CodeReviewReport } from "../types";
import { MetricRing } from "./ReviewUIHelpers";
import { Shield, Award, Terminal, RefreshCw } from "lucide-react";

interface BentoSummaryCardProps {
  report: CodeReviewReport | null;
  isLoading: boolean;
}

export default function BentoSummaryCard({ report, isLoading }: BentoSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center items-center h-full min-h-[190px]">
        <div className="flex items-center space-x-2 animate-pulse text-zinc-400">
          <Terminal className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Compiling metrics...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between h-full min-h-[190px]">
        <div className="flex justify-between items-start">
          <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider font-mono">Review Score</h2>
          <span className="text-xl font-bold text-zinc-600">--/100</span>
        </div>
        <div className="w-full bg-zinc-850 h-2 rounded-full mt-4 overflow-hidden">
          <div className="bg-zinc-700 h-full w-0 transition-all duration-500"></div>
        </div>
        <p className="text-xs text-zinc-550 mt-4 leading-relaxed italic font-normal">
          "Awaiting code analysis to construct standard diagnostics & health score ratios."
        </p>
      </div>
    );
  }

  const getScoreColorAndBar = (score: number) => {
    if (score >= 85) return { text: "text-emerald-400", bar: "bg-emerald-500", label: "Production Ready" };
    if (score >= 65) return { text: "text-amber-500", bar: "bg-amber-500", label: "Needs Improvements" };
    return { text: "text-rose-500", bar: "bg-rose-500", label: "Critical Vulnerabilities" };
  };

  const scoreMeta = getScoreColorAndBar(report.overallScore);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between h-full space-y-4 hover:border-zinc-700/80 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-zinc-450 text-xs font-semibold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audit Score</span>
          </h2>
          <span className="text-xs font-medium text-zinc-500">{scoreMeta.label}</span>
        </div>
        <span className={`text-3xl font-mono font-bold ${scoreMeta.text}`}>
          {report.overallScore}<span className="text-xs text-zinc-600 font-normal">/100</span>
        </span>
      </div>

      {/* Embedded progress health bar */}
      <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div
          className={`${scoreMeta.bar} h-full transition-all duration-1000 ease-out`}
          style={{ width: `${report.overallScore}%` }}
        />
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed font-normal bg-zinc-950/20 p-2.5 border border-zinc-800/50 rounded-lg italic">
        "{report.summary}"
      </p>

      {/* Small inline secondary metrics list row */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-800/50">
        <div className="text-center">
          <span className="block text-[9px] font-mono text-zinc-500 uppercase">SEC</span>
          <span className="text-[11px] font-mono font-bold text-zinc-300">{report.metrics.security}</span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] font-mono text-zinc-500 uppercase">PERF</span>
          <span className="text-[11px] font-mono font-bold text-zinc-300">{report.metrics.performance}</span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] font-mono text-zinc-500 uppercase">READ</span>
          <span className="text-[11px] font-mono font-bold text-zinc-300">{report.metrics.readability}</span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] font-mono text-zinc-500 uppercase">MAINT</span>
          <span className="text-[11px] font-mono font-bold text-zinc-300">{report.metrics.maintainability}</span>
        </div>
      </div>
    </div>
  );
}
