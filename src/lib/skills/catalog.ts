import websiteDesign from "../../../skills/website-design/skill.json";
import yogaStudio from "../../../skills/yoga-studio/skill.json";

// Static imports keep versioned instructions available in serverless deployments.
// Only these reviewed skills may enter model context; never load a user-given path.
export const skillNames = ["base-app", "business-website", "lead-form", "booking", "admin-panel", "auth", "database", "media", "website-design", "yoga-studio"] as const;
export type SkillName = (typeof skillNames)[number];
const designSkills = [websiteDesign, yogaStudio];

export function isYogaProject(context: string): boolean {
  return /\b(?:yoga|yog|yogic|asana|asanas|vinyasa|hatha|pranayama)\b|योग|योगा/i.test(context);
}

export function skillsForRequest(request: string, projectContext = ""): SkillName[] {
  const context = `${request}\n${projectContext}`;
  const skills: SkillName[] = ["base-app", "business-website", "website-design"];
  if (isYogaProject(context)) skills.push("yoga-studio");
  if (/\b(?:book(?:ing|ings)?|reservations?)\b|बुकिंग/i.test(context)) skills.push("booking", "admin-panel", "database");
  if (/\b(?:lead|contact)\b/i.test(context)) skills.push("lead-form");
  return skills;
}

export function skillInstructions(names: readonly string[]): string {
  return designSkills.filter(skill => names.includes(skill.name)).map(skill =>
    `SEED SKILL: ${skill.name} v${skill.version}\n${skill.instructions.map(instruction => `- ${instruction}`).join("\n")}`,
  ).join("\n\n");
}

export function skillVersions(names: readonly string[]): Record<string, string> {
  return Object.fromEntries(designSkills.filter(skill => names.includes(skill.name)).map(skill => [skill.name, skill.version]));
}
