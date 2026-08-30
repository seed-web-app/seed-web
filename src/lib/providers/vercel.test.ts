import { afterEach, describe, expect, it, vi } from "vitest";
import { VercelDeploymentProvider } from "@/lib/providers/vercel";

describe("VercelDeploymentProvider project identity", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the persisted project ID and identical team context for env writes", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.includes("/v9/projects/prj_exact")) {
          return Response.json({
            id: "prj_exact",
            name: "friendly-name",
            accountId: "team_exact",
          });
        }
        if (url.includes("/v10/projects/prj_exact/env") && init?.method === "POST") {
          return Response.json({ id: "env_1" });
        }
        return Response.json({ error: { message: "not found" } }, { status: 404 });
      }),
    );

    const provider = new VercelDeploymentProvider("secret", "prj_exact", "team_exact");
    await provider.requireProject("prj_exact", "team_exact");
    await provider.setEnvironmentVariable("NEXT_PUBLIC_EXAMPLE", "hidden");

    expect(calls).toEqual([
      "GET https://api.vercel.com/v9/projects/prj_exact?teamId=team_exact",
      "POST https://api.vercel.com/v10/projects/prj_exact/env?teamId=team_exact&upsert=true",
    ]);
    expect(calls.join("\n")).not.toContain("friendly-name/env");
  });

  it("blocks writes when the stored account does not own the project", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          id: "prj_exact",
          name: "friendly-name",
          accountId: "team_other",
        }),
      ),
    );

    const provider = new VercelDeploymentProvider("secret", "prj_exact", "team_exact");
    await expect(provider.requireProject("prj_exact", "team_exact")).rejects.toThrow(
      "belongs to account 'team_other'",
    );
  });
});
