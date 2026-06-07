import { CodeIssue } from "../types";

/**
 * Perform speed-of-light structural and quality scans of source code in the browser.
 * This ensures developers receive instant, sub-millisecond real-time syntax pointers as they type.
 */
export function runLocalQualityScan(code: string, language: string): CodeIssue[] {
  const findings: CodeIssue[] = [];
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

  // 1. Nested Loops Check (e.g. for inside for)
  let nestedLoopLine = -1;
  let inLoop = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/\b(for|while|forEach|map)\s*\(/.test(trimmed)) {
      if (inLoop) {
        nestedLoopLine = i + 1;
        break;
      }
      inLoop = true;
    } else if (trimmed === "}" || trimmed === ");") {
      inLoop = false;
    }
  }
  if (nestedLoopLine !== -1) {
    findings.push({
      id: "LOC-NESTED-LOOP",
      title: "Nested Loop Complexity Hazard (O(N²))",
      description: "Writing loops inside loops drastically scales execution time exponentially with large inputs.",
      severity: "warning",
      lineStart: nestedLoopLine,
      lineEnd: nestedLoopLine,
      snippetBefore: lines[nestedLoopLine - 1].trim(),
      snippetAfter: "// Consider flattening loops using hash-maps or pre-indexed lookup indexes\nconst indexMap = new Map(items.map(x => [x.id, x]));",
      explanation: "Nested loops cause quadratic or worse O(N²) scaling. Flatten structures by caching collections into indexed HashMaps so secondary searches become instant O(1) operations.",
    });
  }

  // 2. Empty Catch Block
  const emptyCatch = findLineNum(/catch\s*\([^)]*\)\s*\{\s*\}/);
  if (emptyCatch) {
    findings.push({
      id: "LOC-EMPTY-CATCH",
      title: "Empty Exception Handling Block",
      description: "Silently wrapping errors in empty catch logic suppresses crashes but conceals failing logic.",
      severity: "critical",
      lineStart: emptyCatch.line,
      lineEnd: emptyCatch.line,
      snippetBefore: emptyCatch.snippet,
      snippetAfter: "} catch (error) {\n  console.error('[Critical Execution Failure]:', error);\n  throw error;\n}",
      explanation: "Empty catches prevent application debugging by completely swallowing trace flags. Always log, trace, or rethrow unless there is an explicit structural reason to absorb the exception.",
    });
  }

  // 3. Leftover Debug Console Logs
  const consoleLog = findLineNum(/\bconsole\.(log|debug|trace)\b/);
  if (consoleLog) {
    findings.push({
      id: "LOC-CONSOLE-LOG",
      title: "Active Debugging Statements Leftover",
      description: "Console logger outputs block processes and can slow down performance in high frequency states.",
      severity: "info",
      lineStart: consoleLog.line,
      lineEnd: consoleLog.line,
      snippetBefore: consoleLog.snippet,
      snippetAfter: "// Use proper diagnostic logger or delete debug lines",
      explanation: "Leftover print channels clutter standard out logs and slightly block the thread in dense rendering screens.",
    });
  }

  // 4. Use of 'var' keyword
  const varUsage = findLineNum(/\bvar\s+[a-zA-Z0-9_$]+\s*=/);
  if (varUsage) {
    findings.push({
      id: "LOC-VAR-USAGE",
      title: "Legacy Variable Declaration Pattern",
      description: "Using the old 'var' keyword bypasses modern block scope scoping mechanisms.",
      severity: "best_practice",
      lineStart: varUsage.line,
      lineEnd: varUsage.line,
      snippetBefore: varUsage.snippet,
      snippetAfter: varUsage.snippet.replace(/\bvar\b/, "const"),
      explanation: "Modern block scope supports 'let' and 'const', which prevent hoisting side effects and keep memory pointers safe.",
    });
  }

  // 5. Extremely long lines
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 150) {
      findings.push({
        id: "LOC-LONG-LINE",
        title: "Large Inline Column Width",
        description: "Lines extending beyond 150 characters degrade readability and violate coding standard widths.",
        severity: "info",
        lineStart: i + 1,
        lineEnd: i + 1,
        snippetBefore: lines[i].trim().slice(0, 80) + "...",
        snippetAfter: "// Break large statements into multi-line variables",
        explanation: "Keep files wrapping cleanly at 100-120 columns max to facilitate split-screen review rooms.",
      });
      break;
    }
  }

  return findings;
}
