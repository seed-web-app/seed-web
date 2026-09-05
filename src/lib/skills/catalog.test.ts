import { describe, expect, it } from "vitest";
import { isYogaProject, skillInstructions, skillsForRequest, skillVersions } from "./catalog";

describe("Seed design skill selection", () => {
  it.each(["Build a yoga booking website", "Mujhe yoga website chahiye", "योग स्टूडियो की वेबसाइट", "Vinyasa classes"])("recognizes %s", request => {
    expect(skillsForRequest(request)).toEqual(expect.arrayContaining(["website-design", "yoga-studio"]));
  });
  it("uses project context for a follow-up without yoga in the request", () => {
    expect(skillsForRequest("Make the heading smaller", "Prana — a yoga studio")).toContain("yoga-studio");
  });
  it("preserves functional booking skills alongside design", () => {
    expect(skillsForRequest("Build a yoga booking website")).toEqual(expect.arrayContaining(["booking", "database", "admin-panel"]));
  });
  it("does not apply yoga to unrelated names or regular websites", () => {
    expect(isYogaProject("Toyoga software consultants")).toBe(false);
    expect(skillsForRequest("Build an architecture website")).not.toContain("yoga-studio");
  });
  it("only loads reviewed instructions and exposes their versions", () => {
    expect(skillInstructions(["../../secrets", "invented"])).toBe("");
    expect(skillInstructions(["yoga-studio"])).toContain("Treat a preferred date/time submission as a booking request");
    expect(skillVersions(["yoga-studio"])).toEqual({ "yoga-studio": "1.0.0" });
  });
});
