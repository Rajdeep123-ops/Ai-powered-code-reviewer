import { Type } from "@google/genai";

export type Language = 
  | "typescript" 
  | "javascript" 
  | "python" 
  | "cpp" 
  | "rust" 
  | "go" 
  | "java" 
  | "html_css_js";

export interface LanguageDef {
  id: Language;
  name: string;
  extension: string;
  placeholder: string;
}

export type ReviewFocus = 
  | "all" 
  | "security" 
  | "performance" 
  | "readability";

export type PersonaId = 
  | "mentor" 
  | "speedrunner" 
  | "auditor" 
  | "pragmatist";

export interface PersonaDef {
  id: PersonaId;
  name: string;
  role: string;
  avatar: string;
  description: string;
  emoji: string;
}

export type Severity = "critical" | "warning" | "best_practice" | "info";

export interface CodeIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  lineStart?: number;
  lineEnd?: number;
  snippetBefore?: string;
  snippetAfter?: string;
  explanation: string;
}

export interface CodeReviewReport {
  overallScore: number; // 0-100
  metrics: {
    security: number; // 0-100
    performance: number; // 0-100
    readability: number; // 0-100
    maintainability: number; // 0-100
  };
  summary: string;
  issues: CodeIssue[];
  refactoredCode?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "reviewer";
  text: string;
  timestamp: string;
}

export interface SecureVulnerability {
  id: string;
  title: string;
  cwe: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  lineStart?: number;
  lineEnd?: number;
  snippetBefore?: string;
  snippetAfter?: string;
  impact: string;
  remediation: string;
  owaspCategory: string;
}

export interface SecurityScanResult {
  vulnerabilityCount: number;
  rating: number; // 0-100 overall security score
  status: "secure" | "warn" | "danger";
  vulnerabilities: SecureVulnerability[];
}

