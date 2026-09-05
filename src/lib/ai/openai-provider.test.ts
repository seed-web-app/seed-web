import { beforeEach, describe, expect, it, vi } from "vitest";
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({ default: class { responses = { parse }; } }));
import { OpenAISeedProvider } from "./openai-provider";
import { skillsForRequest } from "@/lib/skills/catalog";

describe("design-aware planning", () => {
  beforeEach(() => parse.mockReset());
  it("sends actual reviewed yoga instructions, not just skill names", async () => {
    parse.mockResolvedValue({ output_parsed: { summary: "Yoga studio", skills: ["yoga-studio"], steps: [] } });
    await new OpenAISeedProvider("test-only").plan({ request: "Create a yoga site", skills: skillsForRequest("Create a yoga site") });
    const payload = parse.mock.calls[0][0];
    expect(payload.instructions).toContain("SEED SKILL: yoga-studio v1.0.0");
    expect(payload.instructions).toContain("SEED SKILL: website-design v1.0.0");
    expect(payload.instructions).toContain("Never invent testimonials");
    expect(payload.store).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("test-only");
  });
});
