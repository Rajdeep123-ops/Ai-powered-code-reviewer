import { SecureVulnerability } from "../types";

/**
 * Perform speed-of-light static analysis of source code using regex matches
 * to instantly surface common visual flaws before the AI completes its deep evaluation.
 */
export function runLocalSecurityScan(code: string, language: string): SecureVulnerability[] {
  const findings: SecureVulnerability[] = [];
  const lines = code.split("\n");

  // Helper to find line numbers of a pattern
  const findLineNum = (regex: RegExp): { line: number; snippet: string } | null => {
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        return { line: i + 1, snippet: lines[i].trim() };
      }
    }
    return null;
  };

  // 1. Check for 'eval(' usage
  const evalMatch = findLineNum(/\beval\s*\(/);
  if (evalMatch) {
    findings.push({
      id: "LOC-EVAL",
      title: "Insecure Dynamic Code Execution via eval()",
      cwe: "CWE-95",
      severity: "critical",
      description: "Direct invocation of eval() deserializes and executes strings of code with privileges, introducing a critical remote code execution vector.",
      lineStart: evalMatch.line,
      lineEnd: evalMatch.line,
      snippetBefore: evalMatch.snippet,
      snippetAfter: "// Avoid eval! Parse JSON cleanly or refactor into structured maps.\nconst data = JSON.parse(safePayloadString);",
      impact: "Allows attackers to execute arbitrary system code in the runtime scope by manipulating the argument string.",
      remediation: "Eliminate any use of eval(). Rely on native JSON parsers, explicit hash routing tables, or strictly mapped function callbacks.",
      owaspCategory: "A03:2021-Injection",
    });
  }

  // 2. Check for child_process or system execution
  const execMatch = findLineNum(/\b(exec|execSync)\b/);
  if (execMatch && (language === "javascript" || language === "typescript")) {
    findings.push({
      id: "LOC-EXEC",
      title: "Arbitrary Command Injection Hazard",
      cwe: "CWE-78",
      severity: "high",
      description: "Passing raw parameters directly to system command shells allows commands to be injected and run contextually.",
      lineStart: execMatch.line,
      lineEnd: execMatch.line,
      snippetBefore: execMatch.snippet,
      snippetAfter: "// Use execFile or spawn with argument arrays to prevent parameter injection\nchild_process.execFile('/bin/ls', ['-la', userDir]);",
      impact: "Can lead to complete host container takeover by injecting shell control symbols (e.g. '; rm -rf').",
      remediation: "Never pass unsanitized variables to command chains. Use spawn or execFile where arguments are isolated array strings.",
      owaspCategory: "A03:2021-Injection",
    });
  }

  // 3. Check for SQL Injection patterns (concatenation)
  const sqlMatch = findLineNum(/(SELECT|INSERT|UPDATE|DELETE).*?\+.*?['"\x60].*?schema|SELECT.*?FROM.*?\$\{/i);
  if (sqlMatch) {
    findings.push({
      id: "LOC-SQLI",
      title: "Potential SQL Injection Concatenation",
      cwe: "CWE-89",
      severity: "critical",
      description: "Constructing SQL queries dynamically via string concatenation or template literals bypasses engine escape protocols, enabling prompt injections.",
      lineStart: sqlMatch.line,
      lineEnd: sqlMatch.line,
      snippetBefore: sqlMatch.snippet,
      snippetAfter: "// Always leverage parameter placeholders or parameterized queries\nconst results = await db.query('SELECT * FROM users WHERE id = ?', [userId]);",
      impact: "Attackers can bypass logins, extract complete relational tables, modify databases, or delete critical indexes.",
      remediation: "Use parameterized query interfaces, prepared statements, or modern Object-Relational Mappers (ORMs) such as Drizzle or Prisma.",
      owaspCategory: "A03:2021-Injection",
    });
  }

  // 4. Check for dangerouslySetInnerHTML
  const xssMatch1 = findLineNum(/dangerouslySetInnerHTML/);
  const xssMatch2 = findLineNum(/\.innerHTML\s*=/);
  const xssMatch = xssMatch1 || xssMatch2;
  if (xssMatch) {
    findings.push({
      id: "LOC-XSS",
      title: "Cross-Site Scripting (XSS) Hazard",
      cwe: "CWE-79",
      severity: "high",
      description: "Directly mounting unsanitized user content into browser DOM renders malicious scripts, leading to cross-site cookie leaks and session hijacks.",
      lineStart: xssMatch.line,
      lineEnd: xssMatch.line,
      snippetBefore: xssMatch.snippet,
      snippetAfter: "// Safely display text variables using standard text rendering\n<span>{safeContentText}</span>",
      impact: "Enables arbitrary JavaScript code execution inside the victim's session, resulting in account hijacking, phishing, or redirection.",
      remediation: "Use standard JSX variable escaping, or filter HTML strings with robust libraries such as DOMPurify.",
      owaspCategory: "A03:2021-Injection",
    });
  }

  // 5. Hardcoded sensitive APIs/Secrets
  const secretMatch = findLineNum(/(API_KEY|api_key|token|secret|password|private_key|auth_key)\s*=\s*['"][a-zA-Z0-9_\-+=/]{15,}['"]/i);
  if (secretMatch) {
    findings.push({
      id: "LOC-SECRET",
      title: "Embedded plaintext Credentials & Key Exposure",
      cwe: "CWE-798",
      severity: "critical",
      description: "Hardcoding cryptographic keys, tokens, or app credentials directly inside static source files compromises system secret vaults.",
      lineStart: secretMatch.line,
      lineEnd: secretMatch.line,
      snippetBefore: secretMatch.snippet,
      snippetAfter: "// Standardize environment variable mappings\nconst apiKey = process.env.SERVICE_SECRET_KEY;",
      impact: "Allows anyone with read-access to the repository to immediately authenticating as high-privilege service configurations.",
      remediation: "Remove the credentials instantly. Migrate them into .env stores or serverless secret vaults, and rotate the exposed secrets.",
      owaspCategory: "A05:2021-Security Misconfiguration",
    });
  }

  return findings;
}
