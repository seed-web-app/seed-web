import { describe, expect, it } from "vitest";
import { validateProposal } from "@/lib/seed-guard";

describe("Seed Guard", () => {
  it("allows a normal beginner request", () => { const result=validateProposal({request:"Make phone number compulsory on the booking form"}); expect(result.passed).toBe(true); expect(result.stages.every(stage=>stage.passed)).toBe(true); });
  it("blocks destructive database instructions", () => { const result=validateProposal({request:"Drop table bookings"}); expect(result.passed).toBe(false); expect(result.stages.some(stage=>!stage.passed)).toBe(true); });
  it("blocks secrets proposed in generated files", () => { const result=validateProposal({request:"Update config",proposedFiles:[{path:"config.ts",content:"const api_key = 'secret'"}]}); expect(result.passed).toBe(false); });
});
