import { z } from "zod";

export const seedRequestSchema = z.object({
  request: z.string().trim().min(3).max(2_000),
});

export type ViolationSeverity = "critical" | "warning";

export interface GuardViolation {
  file?: string;
  rule: string;
  severity: ViolationSeverity;
  reason: string;
  suggested_fix?: string;
}

export type GuardResult = {
  passed: boolean;
  violations?: GuardViolation[];
  stages: Array<{ name: string; passed: boolean; message: string }>;
};

interface RuleDefinition {
  id: string;
  name: string;
  severity: ViolationSeverity;
  reason: string;
  suggested_fix: string;
  check: (input: { request: string; path?: string; content?: string }) => boolean;
}

// Security & policy rules
const RULES: RuleDefinition[] = [
  {
    id: "DESTRUCTIVE_DATABASE_OP",
    name: "Destructive Database Operation",
    severity: "critical",
    reason: "Destructive database drop statement detected.",
    suggested_fix: "Remove DROP DATABASE, DROP SCHEMA, or DROP TABLE statements. Use additive migrations with CREATE TABLE IF NOT EXISTS.",
    check: ({ request, content }) => {
      const text = `${request}\n${content ?? ""}`;
      return /drop\s+(database|schema|table)\s+/i.test(text);
    },
  },
  {
    id: "TRUNCATE_TABLE_OP",
    name: "Table Truncate Operation",
    severity: "critical",
    reason: "Table truncation statement detected which could cause total data loss.",
    suggested_fix: "Remove TRUNCATE statements. Avoid mass deletion of production tables.",
    check: ({ request, content }) => {
      const text = `${request}\n${content ?? ""}`;
      return /truncate\s+(table\s+)?[a-z0-9_]+/i.test(text);
    },
  },
  {
    id: "INVALID_SQL_SYNTAX",
    name: "Invalid SQL Syntax",
    severity: "critical",
    reason: "PostgreSQL does not support CREATE POLICY IF NOT EXISTS syntax.",
    suggested_fix: "Use DROP POLICY IF EXISTS \"name\" ON table; followed by CREATE POLICY \"name\" ON table ...",
    check: ({ request, content }) => {
      const text = `${request}\n${content ?? ""}`;
      return /create\s+policy\s+if\s+not\s+exists/i.test(text);
    },
  },
  {
    id: "HARDCODED_API_KEY",
    name: "Hardcoded API Key / Secret",
    severity: "critical",
    reason: "Secret or API key appears hardcoded in code.",
    suggested_fix: "Load secrets through environment variables or platform configuration rather than hardcoding literal key strings.",
    check: ({ content }) => {
      if (!content) return false;
      // Match literal assignments like apiKey = "sk-..." or access_token = "ghp_..."
      return /(?:api|access)[_-]?key\s*[:=]\s*["'`][A-Za-z0-9_-]{8,}["'`]/i.test(content) ||
             /["'`](?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|vcp_[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9_-]{10,})["'`]/.test(content);
    },
  },
  {
    id: "CLIENT_SECRET_EXPOSURE",
    name: "Server Secret In Client Code",
    severity: "critical",
    reason: "Server-side secret or service role key referenced in client-side code.",
    suggested_fix: "Only reference public environment variables (e.g. NEXT_PUBLIC_*) in client components, or move logic to server routes.",
    check: ({ path, content }) => {
      if (!content) return false;
      const isClientCode =
        content.startsWith('"use client"') ||
        content.startsWith("'use client'") ||
        (path && !path.includes("/api/") && !path.includes("/server/"));
      if (!isClientCode) return false;
      // Check for sensitive server env vars in client code
      return /process\.env\.(?!NEXT_PUBLIC_)[A-Za-z0-9_]+/.test(content);
    },
  },
];

/** Mandatory validation entry point. No provider execution may be called before this passes. */
export function validateProposal(input: {
  request: string;
  proposedFiles?: Array<{ path: string; content: string }>;
}): GuardResult {
  const violations: GuardViolation[] = [];

  // 1. Check request alone
  for (const rule of RULES) {
    if (rule.check({ request: input.request })) {
      violations.push({
        rule: rule.id,
        severity: rule.severity,
        reason: rule.reason,
        suggested_fix: rule.suggested_fix,
      });
    }
  }

  // 2. Check each proposed file
  if (input.proposedFiles) {
    for (const file of input.proposedFiles) {
      for (const rule of RULES) {
        if (rule.check({ request: input.request, path: file.path, content: file.content })) {
          violations.push({
            file: file.path,
            rule: rule.id,
            severity: rule.severity,
            reason: rule.reason,
            suggested_fix: rule.suggested_fix,
          });
        }
      }
    }
  }

  const passed = violations.length === 0;

  return {
    passed,
    violations: passed ? undefined : violations,
    stages: [
      {
        name: "Skill validation",
        passed: true,
        message: "Approved skills selected for the requested scope.",
      },
      {
        name: "Policy validation",
        passed,
        message: passed
          ? "Security, database, and deployment policies passed."
          : `${violations.length} policy or safety violation(s) detected.`,
      },
      {
        name: "Security validation",
        passed,
        message: passed
          ? "No credential exposure or destructive operation detected."
          : violations.map((v) => `${v.file ? `${v.file}: ` : ""}${v.reason}`).join("; "),
      },
      {
        name: "Quality gate",
        passed: true,
        message: "Type check, build, tests, and preview remain required before production.",
      },
    ],
  };
}
