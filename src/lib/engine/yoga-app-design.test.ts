import { describe, expect, it } from "vitest";
import ts from "typescript";
import { generateBookingApp } from "./booking-app-template";
import { validateProposal } from "@/lib/seed-guard";

const config = { projectName: "Prana Studio", request: "Build a yoga booking website", supabaseUrl: "https://unused.example", supabasePublishableKey: "unused-public-value", adminSecret: "TEST_SECRET_NEVER_IN_FILES" };
const files = generateBookingApp(config);
const byPath = new Map(files.map(file => [file.path, file.content]));

describe("generated yoga website", () => {
  it("selects yoga from the request even when the brand does not say yoga", () => {
    expect(byPath.get("src/app/page.tsx")).toContain("A deeper breath.");
    expect(byPath.get("src/app/globals.css")).toContain("prefers-reduced-motion");
    expect(byPath.has("public/images/yoga-garden.svg")).toBe(true);
  });
  it("preserves the booking/admin API and never includes credentials", () => {
    const generic = new Map(generateBookingApp({ ...config, request: "Business website" }).map(file => [file.path, file.content]));
    for (const file of files.filter(file => file.path.includes("/api/") || file.path.includes("/admin/"))) {
      expect(file.content).toBe(generic.get(file.path));
    }
    expect(JSON.stringify(files)).not.toContain(config.adminSecret);
    expect(JSON.stringify(files)).not.toContain(config.supabasePublishableKey);
  });
  it("uses real service data and truthful class-request wording", () => {
    expect(byPath.get("src/app/services/page.tsx")).toContain('from("services")');
    expect(byPath.get("src/app/services/page.tsx")).toContain("hasn't listed its classes yet");
    expect(byPath.get("src/app/book/page.tsx")).toContain("awaiting confirmation");
    expect(byPath.get("src/app/book/page.tsx")).not.toContain("confirm by email");
    expect(JSON.stringify(files)).not.toContain("Modern Minimalist Residence");
    expect(JSON.stringify(files)).not.toContain("hello@example.com");
  });
  it("keeps all required form field names and every local link resolvable", () => {
    for (const name of ["name", "email", "phone", "service", "preferred_datetime", "notes"]) {
      expect(byPath.get("src/app/book/page.tsx")).toContain(`name="${name}"`);
    }
    for (const { content } of files) {
      for (const match of content.matchAll(/href="(\/[^"#]*)"/g)) {
        const route = match[1] === "/" ? "" : match[1];
        expect(byPath.has(`src/app${route}/page.tsx`), match[1]).toBe(true);
      }
    }
  });
  it("emits valid TS/TSX even with quotes and JSX-like characters in the studio name", () => {
    for (const file of generateBookingApp({ ...config, projectName: 'Yoga "Space" <&> {calm}' }).filter(file => /\.tsx?$/.test(file.path))) {
      const result = ts.transpileModule(file.content, { fileName: file.path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017 } });
      expect(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), file.path).toEqual([]);
    }
  });
  it("passes Seed Guard for the design files", () => {
    const presentationFiles = files.filter(file => !file.path.includes("/api/") && !file.path.includes("/admin/"));
    expect(validateProposal({ request: config.request, proposedFiles: presentationFiles }).passed).toBe(true);
  });
  it("keeps ordinary business builds on their existing template", () => {
    const business = generateBookingApp({ ...config, request: "Build a consulting website" });
    expect(business.find(file => file.path === "src/app/page.tsx")?.content).toContain("Welcome to Prana Studio");
    expect(business.some(file => file.path.includes("yoga-garden"))).toBe(false);
  });
});
