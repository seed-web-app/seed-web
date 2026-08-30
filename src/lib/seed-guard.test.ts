import { describe, expect, it } from "vitest";
import { validateProposal } from "@/lib/seed-guard";

describe("Seed Guard", () => {
  it("allows a normal beginner request", () => {
    const result = validateProposal({ request: "Make phone number compulsory on the booking form" });
    expect(result.passed).toBe(true);
    expect(result.stages.every((stage) => stage.passed)).toBe(true);
  });

  it("blocks destructive database instructions and returns structured violation", () => {
    const result = validateProposal({ request: "Drop table bookings" });
    expect(result.passed).toBe(false);
    expect(result.violations).toBeDefined();
    expect(result.violations?.[0].rule).toBe("DESTRUCTIVE_DATABASE_OP");
    expect(result.violations?.[0].severity).toBe("critical");
    expect(result.violations?.[0].reason).toContain("Destructive database drop");
    expect(result.stages.some((stage) => !stage.passed)).toBe(true);
  });

  it("blocks secrets proposed in generated files with file and suggested fix", () => {
    const result = validateProposal({
      request: "Update config",
      proposedFiles: [{ path: "config.ts", content: "const api_key = 'sk-1234567890123456789012345678'" }],
    });
    expect(result.passed).toBe(false);
    expect(result.violations).toBeDefined();
    expect(result.violations?.[0].file).toBe("config.ts");
    expect(result.violations?.[0].rule).toBe("HARDCODED_API_KEY");
    expect(result.violations?.[0].suggested_fix).toBeDefined();
  });

  it("allows normal Next.js process.env.NEXT_PUBLIC_* usage without false positives", () => {
    const result = validateProposal({
      request: "Build booking website",
      proposedFiles: [
        {
          path: "src/lib/supabase.ts",
          content: "const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;\nconst key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;",
        },
      ],
    });
    expect(result.passed).toBe(true);
  });

  it("blocks server-side secret process.env in client-side code", () => {
    const result = validateProposal({
      request: "Build client component",
      proposedFiles: [
        {
          path: "src/app/client.tsx",
          content: "'use client';\nconst secret = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.violations?.[0].rule).toBe("CLIENT_SECRET_EXPOSURE");
  });
});
