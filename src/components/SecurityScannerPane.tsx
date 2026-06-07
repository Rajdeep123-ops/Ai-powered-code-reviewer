import React, { useState } from "react";
import { SecurityScanResult, SecureVulnerability } from "../types";
import { CopyButton, MetricRing } from "./ReviewUIHelpers";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Zap, 
  BookOpen, 
  Terminal, 
  ChevronRight, 
  Info, 
  Copy, 
  Check, 
  AlertOctagon,
  Flame,
  UserCheck,
  Cpu
} from "lucide-react";

interface SecurityScannerPaneProps {
  scanResult: SecurityScanResult | null;
  localFindingsCount: number;
  isLoading: boolean;
  onInitiateScan: () => void;
  codeEmpty: boolean;
}

const SEVERITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string; bgHover: string }> = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    bgHover: "hover:bg-red-500/15"
  },
  high: {
    label: "High Strike",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    bgHover: "hover:bg-orange-500/15"
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    bgHover: "hover:bg-amber-500/15"
  },
  low: {
    label: "Low Advisory",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    bgHover: "hover:bg-blue-500/15"
  },
};

export default function SecurityScannerPane({
  scanResult,
  localFindingsCount,
  isLoading,
  onInitiateScan,
  codeEmpty,
}: SecurityScannerPaneProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySnippet = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet:", err);
    }
  };

  const statusMeta = () => {
    if (!scanResult) return { title: "Awaiting Scans", text: "text-zinc-500", border: "border-zinc-800", bg: "bg-zinc-950/20" };
    if (scanResult.vulnerabilityCount === 0) {
      return {
        title: "Fully Hardened Profile Verified",
        text: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        icon: ShieldCheck,
        desc: "No immediate vulnerabilities or OWASP security violations identified in syntax maps."
      };
    }
    if (scanResult.vulnerabilityCount <= 2 && scanResult.rating >= 70) {
      return {
        title: "Actionable Advisories Raised",
        text: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: ShieldAlert,
        desc: "Found local risks. Apply security pattern corrections immediately."
      };
    }
    return {
      title: "Exploitation Risks Identified",
      text: "text-rose-500 bg-rose-500/10 border-rose-500/30",
      icon: AlertOctagon,
      desc: "Critical vulnerabilities found. Immediately secure these sectors before shipping to production."
    };
  };

  const meta = statusMeta();

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-805 border-zinc-850 hover:border-zinc-700/80 transition-colors rounded-xl overflow-hidden shadow-xl">
      {/* Header element bar */}
      <div className="flex items-center justify-between border-b border-zinc-850 border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-center space-x-2">
          <Shield id="icon-security-shield" className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-zinc-100 tracking-wide font-sans">
            Security Shield Vulnerability Scanner
          </h3>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            owasp_scanner
          </span>
        </div>
      </div>

      {/* Main Body view */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
        {/* Dynamic Launch bar when not scanned yet */}
        {!scanResult && !isLoading && (
          <div className="text-center py-8 px-6 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-xl space-y-4">
            <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-inner text-zinc-400">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-zinc-250">Interactive Vulnerability Scanning</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Scan scripts immediately for critical code risks including SQL injection, cross-site scripting (XSS), token leakage, and authentication bypass vectors.
              </p>
            </div>

            {localFindingsCount > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg max-w-xs mx-auto flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  Instant scan detected {localFindingsCount} security concern{localFindingsCount > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <button
              id="btn-scan-vulnerabilities"
              onClick={onInitiateScan}
              disabled={codeEmpty}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-md flex items-center space-x-2 mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Targeted Security Audit</span>
            </button>
          </div>
        )}

        {/* Loading overlay spinner */}
        {isLoading && (
          <div className="text-center py-12 space-y-4 bg-zinc-950/10 border border-zinc-800 rounded-xl">
            <div className="relative flex items-center justify-center w-14 h-14 mx-auto">
              <div className="absolute inset-0 border-4 border-rose-500/10 rounded-full animate-pulse" />
              <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin" />
              <Shield className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest animate-pulse">Running Security Diagnostics</h4>
              <p className="text-[11px] text-zinc-550 max-w-xs mx-auto">
                Comparing abstract syntax patterns against OWASP vulnerabilities & CWE indices.
              </p>
            </div>
          </div>
        )}

        {/* Loaded scan metrics */}
        {scanResult && !isLoading && (
          <div className="space-y-4">
            
            {/* Bento score statistics bento tiles row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Radial Security rating */}
              <div className="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-xl flex items-center space-x-3 shadow-inner col-span-1">
                <MetricRing
                  label="Sec Score"
                  value={scanResult.rating}
                  color={scanResult.rating >= 85 ? "emerald" : scanResult.rating >= 60 ? "amber" : "rose"}
                />
              </div>

              {/* Vulnerabilities Count Card */}
              <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between shadow-inner col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">Total Security Breaches</span>
                  <span className={`text-2xl font-mono font-bold ${scanResult.vulnerabilityCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {scanResult.vulnerabilityCount}
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-zinc-400 font-normal leading-relaxed">
                  {scanResult.vulnerabilityCount === 0 
                    ? "Verified secure. Code is protected against basic injection surfaces." 
                    : `Discovered exploits requiring immediate refactoring fixes.`
                  }
                </p>
              </div>

            </div>

            {/* Overall status designation banner */}
            <div className={`p-4 rounded-xl border flex items-start space-x-3 ${meta.text}`}>
              {meta.icon && <meta.icon className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-xs font-bold font-sans tracking-wide uppercase">{meta.title}</h4>
                <p className="text-xs text-zinc-350 font-normal mt-1 leading-normal">{meta.desc}</p>
              </div>
            </div>

            {/* List index of found security vulnerabilities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Vulnerability Logs ({scanResult.vulnerabilities.length})</span>
                </h4>
                
                <button 
                  onClick={onInitiateScan}
                  className="text-[9px] hover:text-rose-300 text-rose-400 border border-rose-500/20 bg-rose-500/5 px-2.5 py-0.5 rounded-md cursor-pointer select-none transition-colors"
                >
                  Re-Scan Code
                </button>
              </div>

              {scanResult.vulnerabilities.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-500/70 mx-auto" />
                  <p className="text-xs text-zinc-450">Hardened criteria met. Complete security parameters validated successfully.</p>
                </div>
              ) : (
                scanResult.vulnerabilities.map((vuln) => {
                  const isExpanded = expandedId === vuln.id;
                  const badge = SEVERITY_BADGES[vuln.severity] || SEVERITY_BADGES.low;

                  return (
                    <div
                      key={vuln.id}
                      id={`vuln-card-${vuln.id}`}
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? "bg-zinc-950/30 border-rose-500/30 shadow-lg"
                          : "bg-zinc-950/10 border-zinc-850 hover:bg-zinc-950/20 hover:border-zinc-800"
                      }`}
                    >
                      {/* Interactive click row header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : vuln.id)}
                        className="w-full flex items-start justify-between p-3.5 text-left cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-start space-x-3 pr-2 select-none">
                          <span className={`${badge.bg} ${badge.text} ${badge.border} text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 uppercase tracking-wider`}>
                            {badge.label}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h5 className="text-xs font-semibold text-zinc-150">
                                {vuln.title}
                              </h5>
                              <span className="font-mono text-[9px] text-zinc-550 border border-zinc-800 px-1.5 rounded bg-zinc-950/30">
                                {vuln.cwe}
                              </span>
                              {vuln.lineStart && (
                                <span className="font-mono text-[9px] bg-indigo-950/40 text-indigo-400 px-1.5 py-0.2.5 rounded border border-indigo-900/30">
                                  L{vuln.lineStart}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed font-normal">
                              {vuln.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-zinc-650 hover:text-zinc-400 text-[10px] font-mono self-center shrink-0 uppercase tracking-wider pl-1.5">
                          {isExpanded ? "[ CLOSE ]" : "[ EXPAND ]"}
                        </span>
                      </button>

                      {/* Expanded Section Details */}
                      {isExpanded && (
                        <div className="border-t border-zinc-850 p-4 bg-zinc-950/40 space-y-4">
                          
                          {/* Metadata row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-zinc-850/60">
                            <div>
                              <span className="block text-[8px] font-mono text-zinc-600 uppercase font-bold tracking-wider">OWASP Category</span>
                              <span className="text-[11px] font-semibold text-zinc-350">{vuln.owaspCategory}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-mono text-zinc-600 uppercase font-bold tracking-wider font-semibold">CWE Vulnerability Code</span>
                              <span className="text-[11px] font-mono text-zinc-350">{vuln.cwe}</span>
                            </div>
                          </div>

                          {/* Attack vector impact description */}
                          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                            <span className="block text-[9px] font-mono font-bold text-red-400 uppercase mb-1">Potential Hacker Exploit Attack Vector</span>
                            <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">{vuln.impact}</p>
                          </div>

                          {/* Code Comparison Diffs */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pt-1">
                            {/* Flawed Snippet */}
                            {vuln.snippetBefore && (
                              <div className="rounded-lg border border-red-500/15 bg-red-500/5 overflow-hidden flex flex-col h-full">
                                <div className="text-[9px] font-mono font-semibold tracking-wider text-red-400 bg-red-950/10 px-2.5 py-1 border-b border-red-500/10">
                                  EXPLOITABLE FLOCKED PATTERN
                                </div>
                                <pre className="p-3 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre bg-zinc-950/30 font-normal leading-relaxed flex-1 select-all">
                                  <code>{vuln.snippetBefore}</code>
                                </pre>
                              </div>
                            )}

                            {/* Secured Snippet */}
                            {vuln.snippetAfter && (
                              <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 overflow-hidden flex flex-col h-full relative">
                                <div className="text-[9px] font-mono font-semibold tracking-wider text-emerald-400 bg-emerald-950/10 px-2.5 py-1 border-b border-emerald-500/10 flex justify-between items-center">
                                  <span>MITIGATED SECTOR PATTERN (SECURE)</span>
                                  <button
                                    onClick={() => handleCopySnippet(vuln.id, vuln.snippetAfter || "")}
                                    className="p-1 hover:text-emerald-300 text-emerald-400 bg-emerald-500/10 rounded transition-colors cursor-pointer flex items-center space-x-1"
                                    title="Copy Secure Fix"
                                  >
                                    {copiedId === vuln.id ? (
                                      <>
                                        <Check className="w-2.5 h-2.5" />
                                        <span className="text-[8px]">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-2.5 h-2.5" />
                                        <span className="text-[8px]">Copy Fix</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 text-[10px] font-mono text-zinc-150 overflow-x-auto whitespace-pre bg-zinc-950/30 font-normal leading-relaxed flex-1 select-all">
                                  <code>{vuln.snippetAfter}</code>
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* Remediation Action Steps */}
                          <div className="space-y-1 bg-zinc-950/50 p-3 border border-zinc-850 rounded-lg">
                            <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Remediation Procedures</span>
                            </span>
                            <p className="text-[11px] text-zinc-350 leading-relaxed font-normal whitespace-pre-line">
                              {vuln.remediation}
                            </p>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
