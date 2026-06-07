import React, { useState } from "react";
import { CodeReviewReport, CodeIssue, Severity } from "../types";
import { AccordionItem, CopyButton, MetricRing } from "./ReviewUIHelpers";
import ReactMarkdown from "react-markdown";
import {
  FileCheck,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Info,
  CheckCircle,
  Code2,
  ListFilter,
  RefreshCw,
  Sparkles,
  Layers,
} from "lucide-react";

interface ReviewOutputPaneProps {
  report: CodeReviewReport | null;
  isLoading: boolean;
  selectedLanguage: string;
  localIssues?: CodeIssue[];
  onInitiateAIScan?: () => void;
}

const SEVERITY_METRICS: Record<
  Severity,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  critical: {
    label: "Critical",
    bg: "bg-rose-500/10",
    text: "text-rose-450 text-rose-400",
    border: "border-rose-500/20",
    icon: ShieldAlert,
  },
  warning: {
    label: "Warning",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: AlertTriangle,
  },
  best_practice: {
    label: "Best Practice",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    icon: Sparkles,
  },
  info: {
    label: "Style & Info",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/20",
    icon: Info,
  },
};

export default function ReviewOutputPane({
  report,
  isLoading,
  selectedLanguage,
  localIssues,
  onInitiateAIScan,
}: ReviewOutputPaneProps) {
  const [activeTab, setActiveTab] = useState<"issues" | "refactored">("issues");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 min-h-[300px]">
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-505 border-t-indigo-500 rounded-full animate-spin" />
          <Code2 id="spinner-icon" className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 font-sans tracking-wide">
          Senior Lead Auditing...
        </h3>
        <p className="text-xs text-zinc-500 text-center max-w-xs font-normal">
          Refining syntax nodes, checking vulnerabilities, and writing optimized patterns.
        </p>
      </div>
    );
  }

  if (!report) {
    if (localIssues && localIssues.length > 0) {
      return (
        <div className="flex flex-col h-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <h3 className="text-xs font-semibold text-zinc-100 font-sans">
                Real-Time Live Diagnostics
              </h3>
            </div>
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-950/45 border border-indigo-900/30 px-2 py-0.5 rounded animate-pulse">
              LIVE_STREAMING
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className="bg-zinc-950/50 border border-zinc-850 p-3 rounded-lg text-center space-y-2">
              <p className="text-[11px] text-zinc-400 font-normal">
                Detected <strong>{localIssues.length} instant quality findings</strong> in your live code stream.
              </p>
              {onInitiateAIScan && (
                <button
                  onClick={onInitiateAIScan}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white font-medium text-[10px] rounded-md transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-300" />
                  <span>Launch Deep AI Evaluation</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {localIssues.map((issue) => {
                const metric = SEVERITY_METRICS[issue.severity];
                const SvgIcon = metric.icon;
                const isExpanded = expandedIssue === issue.id;

                return (
                  <div
                    key={issue.id}
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                      isExpanded
                        ? "bg-zinc-950/45 border-indigo-500/30 shadow-lg"
                        : "bg-zinc-950/10 border-zinc-850 hover:bg-zinc-950/20 hover:border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                      className="w-full flex items-start justify-between p-3 text-left cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-start space-x-2.5 pr-2">
                        <span className={`p-1 mt-0.5 rounded border ${metric.bg} ${metric.text} ${metric.border} shrink-0`}>
                          <SvgIcon className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="text-xs font-semibold text-zinc-200">
                              {issue.title}
                            </h5>
                            {issue.lineStart && (
                              <span className="font-mono text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-400">
                                L{issue.lineStart}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-normal">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-zinc-650 hover:text-zinc-400 text-[9px] font-mono self-center shrink-0 uppercase tracking-wider pl-1 font-normal">
                        {isExpanded ? "[ Close ]" : "[ Open ]"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-850 bg-zinc-950/40 p-3 space-y-3">
                        {(issue.snippetBefore || issue.snippetAfter) && (
                          <div className="grid grid-cols-1 gap-2.5">
                            {issue.snippetBefore && (
                              <div className="rounded-lg border border-red-500/10 bg-red-500/5 overflow-hidden">
                                <div className="text-[9px] font-mono tracking-wider font-semibold text-red-400 bg-red-950/10 px-2.5 py-1 border-b border-red-500/5 flex justify-between items-center">
                                  <span>FLAWED CODE</span>
                                  {issue.lineStart && <span>Line {issue.lineStart}</span>}
                                </div>
                                <pre className="p-2.5 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre">
                                  <code>{issue.snippetBefore}</code>
                                </pre>
                              </div>
                            )}

                            {issue.snippetAfter && (
                              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 overflow-hidden">
                                <div className="text-[9px] font-mono tracking-wider font-semibold text-emerald-450 text-emerald-400 bg-emerald-950/10 px-2.5 py-1 border-b border-emerald-500/5 flex justify-between items-center">
                                  <span>SUGGESTED CORRECTION</span>
                                  <span>Fix</span>
                                </div>
                                <pre className="p-2.5 text-[10px] font-mono text-zinc-200 overflow-x-auto whitespace-pre">
                                  <code>{issue.snippetAfter}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="prose prose-zinc prose-invert max-w-none text-zinc-300 text-xs bg-zinc-950/70 p-3 border border-zinc-800 rounded-lg">
                          <h6 className="text-[10px] font-mono font-medium tracking-wider text-indigo-400 uppercase mb-1 flex items-center space-x-1">
                            <span>Deep Tech Review</span>
                          </h6>
                          <div className="markdown-body text-xs leading-normal">
                            <ReactMarkdown>{issue.explanation}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 min-h-[305px] text-center">
        <div id="wrapper-icon-code" className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 mb-4">
          <Layers id="base-icon-code" className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="text-xs font-mono font-medium text-zinc-400 tracking-wider uppercase mb-1.5 animate-pulse">
          Subsystems Standby
        </h3>
        <p className="text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
          Detailed findings, code corrections, and direct visual refactoring metrics will be dynamically rendered here.
        </p>
      </div>
    );
  }

  // Filter issues
  const filteredIssues = report.issues.filter(
    (issue) => filterSeverity === "all" || issue.severity === filterSeverity
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-colors">
      {/* Header controls select tabs */}
      <div className="flex items-center justify-between border-b border-zinc-850 border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex space-x-1">
          <button
            id="tab-issues"
            onClick={() => setActiveTab("issues")}
            className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeTab === "issues"
                ? "bg-zinc-800 text-white border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Review Findings
          </button>
          <button
            id="tab-refactored"
            onClick={() => setActiveTab("refactored")}
            className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
              activeTab === "refactored"
                ? "bg-zinc-800 text-white border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refactored</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          findings_engine
        </span>
      </div>

      {activeTab === "issues" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {/* Header query selector list filter lines */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <h4 className="text-xs font-mono font-medium tracking-wider text-zinc-450 uppercase flex items-center space-x-1.5">
              <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Issues ({report.issues.length})</span>
            </h4>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1">
              <button
                id="filter-all"
                onClick={() => setFilterSeverity("all")}
                className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium border transition cursor-pointer ${
                  filterSeverity === "all"
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                All
              </button>
              {Object.entries(SEVERITY_METRICS).map(([id, meta]) => {
                const count = report.issues.filter((iss) => iss.severity === id).length;
                return (
                  <button
                    key={id}
                    id={`filter-${id}`}
                    onClick={() => setFilterSeverity(id as Severity)}
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium border transition cursor-pointer flex items-center space-x-1 ${
                      filterSeverity === id
                        ? "bg-zinc-800 text-white border-zinc-700"
                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span className="opacity-65 text-[8px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Issues scrolling area */}
          <div className="space-y-2">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-6 bg-zinc-950/20 border border-zinc-850 rounded-xl">
                <FileCheck className="w-6 h-6 text-emerald-500/80 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-mono">No findings recorded in this state.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const metric = SEVERITY_METRICS[issue.severity];
                const SvgIcon = metric.icon;
                const isExpanded = expandedIssue === issue.id;

                return (
                  <div
                    key={issue.id}
                    id={`issue-block-${issue.id}`}
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                      isExpanded
                        ? "bg-zinc-950/40 border-zinc-700"
                        : "bg-zinc-950/10 border-zinc-850 hover:bg-zinc-950/20 hover:border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                      className="w-full flex items-start justify-between p-3 text-left cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-start space-x-2.5 pr-2">
                        <span className={`p-1 mt-0.5 rounded border ${metric.bg} ${metric.text} ${metric.border} shrink-0`}>
                          <SvgIcon className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="text-xs font-semibold text-zinc-200">
                              {issue.title}
                            </h5>
                            {issue.lineStart && (
                              <span className="font-mono text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-400">
                                L{issue.lineStart}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-450 mt-0.5 leading-relaxed font-normal">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-zinc-600 hover:text-zinc-400 transition text-[9px] font-mono self-center uppercase tracking-wider">
                        {isExpanded ? "[ Close ]" : "[ Open ]"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-3 space-y-3">
                        {/* Code differences block comparison */}
                        {(issue.snippetBefore || issue.snippetAfter) && (
                          <div className="grid grid-cols-1 gap-2.5">
                            {issue.snippetBefore && (
                              <div className="rounded-lg border border-red-500/10 bg-red-500/5 overflow-hidden">
                                <div className="text-[9px] font-mono tracking-wider font-semibold text-red-400 bg-red-950/10 px-2.5 py-1 border-b border-red-500/5 flex justify-between items-center">
                                  <span>FLAWED CODE</span>
                                  {issue.lineStart && <span>Line {issue.lineStart}</span>}
                                </div>
                                <pre className="p-2.5 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre">
                                  <code>{issue.snippetBefore}</code>
                                </pre>
                              </div>
                            )}

                            {issue.snippetAfter && (
                              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 overflow-hidden">
                                <div className="text-[9px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/10 px-2.5 py-1 border-b border-emerald-500/5 flex justify-between items-center">
                                  <span>SUGGESTED CORRECTION</span>
                                  <span>Optimized</span>
                                </div>
                                <pre className="p-2.5 text-[10px] font-mono text-zinc-200 overflow-x-auto whitespace-pre">
                                  <code>{issue.snippetAfter}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text explanation */}
                        <div className="prose prose-zinc prose-invert max-w-none text-zinc-300 text-xs bg-zinc-950/70 p-3 border border-zinc-800 rounded-lg">
                          <h6 className="text-[10px] font-mono font-medium tracking-wider text-indigo-400 uppercase mb-1 flex items-center space-x-1">
                            <span>Deep Tech Review</span>
                          </h6>
                          <div className="markdown-body text-xs leading-normal">
                            <ReactMarkdown>{issue.explanation}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Code Tab Refactoring output view */
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 relative">
          <div className="absolute top-2.5 right-2.5 z-10">
            <CopyButton textToCopy={report.refactoredCode || ""} />
          </div>

          <div className="flex-1 overflow-auto p-3 font-mono text-xs text-zinc-300">
            <pre className="whitespace-pre overflow-x-auto select-all leading-relaxed p-3.5 bg-zinc-950/70 border border-zinc-850 border-zinc-800 rounded-lg shadow-inner h-full min-h-[220px]">
              <code>{report.refactoredCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
