import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { AIProvider, SeedPlan } from "@/lib/providers/contracts";

export const generatedPlanSchema = z.object({
  summary: z.string().min(1).max(600),
  skills: z.array(z.enum(["base-app", "business-website", "lead-form", "booking", "admin-panel", "auth", "database", "media"])).min(1),
  steps: z.array(z.object({ title: z.string().min(1).max(140), kind: z.enum(["inspect", "generate", "validate", "deploy"]) })).min(4).max(14),
});

export class OpenAISeedProvider implements AIProvider {
  private client: OpenAI;
  constructor(apiKey: string, private model = process.env.OPENAI_MODEL ?? "gpt-5-mini") { this.client = new OpenAI({ apiKey }); }
  async plan(input: { request: string; skills: string[] }): Promise<SeedPlan> {
    const response = await this.client.responses.parse({
      model: this.model,
      store: false,
      instructions: "You are Seed's planner for simple business, lead, and booking websites. Produce a small safe plan. Always inspect current repository, database, and deployment state first. Never include credentials, SQL, code, or provider tokens. Never propose destructive database changes. End with validation, preview, and production deployment steps.",
      input: `User request: ${input.request}\nAllowed skills: ${input.skills.join(", ")}`,
      text: { format: zodTextFormat(generatedPlanSchema, "seed_plan") },
    });
    if (!response.output_parsed) throw new Error("Seed AI did not return a valid plan.");
    return response.output_parsed;
  }
  async generate(): Promise<never> { throw new Error("Generation is available only inside a registered Seed tool run."); }
  async review(): Promise<never> { throw new Error("Review is available only inside Seed Guard."); }
  async repair(input: {
    violations: Array<{ file?: string; rule: string; severity: string; reason: string; suggested_fix?: string }>;
    files: Array<{ path: string; content: string }>;
  }): Promise<Array<{ path: string; content: string }>> {
    const filesToRepair = input.files.filter((f) =>
      input.violations.some((v) => v.file === f.path || !v.file),
    );
    if (filesToRepair.length === 0) return input.files;

    const repairedSchema = z.object({
      repairedFiles: z.array(
        z.object({
          path: z.string(),
          content: z.string(),
        }),
      ),
    });

    const response = await this.client.responses.parse({
      model: this.model,
      store: false,
      instructions:
        "You are Seed's safety repair engine. Seed Guard blocked some generated files due to security or policy violations. You must repair ONLY the files that had violations, addressing the exact reasons and suggested fixes while keeping the website working cleanly. Never introduce secrets, API keys, or destructive database operations.",
      input: `Violations:\n${JSON.stringify(input.violations, null, 2)}\n\nFiles to repair:\n${JSON.stringify(filesToRepair, null, 2)}`,
      text: { format: zodTextFormat(repairedSchema, "repaired_files") },
    });

    if (!response.output_parsed?.repairedFiles) {
      return input.files;
    }

    const resultMap = new Map(input.files.map((f) => [f.path, f.content]));
    for (const rf of response.output_parsed.repairedFiles) {
      resultMap.set(rf.path, rf.content);
    }

    return Array.from(resultMap.entries()).map(([path, content]) => ({ path, content }));
  }
}
