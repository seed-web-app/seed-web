import { describe, expect, it } from "vitest";
import { prepareGuardedRun } from "@/lib/seed-run";

describe("Seed run",()=>{it("requires valid attribution and pauses for approval",()=>{const result=prepareGuardedRun({userId:"user-1",workspaceId:"workspace-1",projectId:"project-1",runId:"run-1"},"Create a booking website",{summary:"Build safely",skills:["booking"],steps:[{title:"Inspect",kind:"inspect"}]});expect(result.status).toBe("waiting_for_user");expect(result.guard.passed).toBe(true);});it("cannot bypass Guard",()=>{expect(()=>prepareGuardedRun({userId:"user-1",workspaceId:"workspace-1",projectId:"project-1",runId:"run-1"},"TRUNCATE bookings",{summary:"Unsafe",skills:["database"],steps:[]})).toThrow("Seed Guard blocked");});});
