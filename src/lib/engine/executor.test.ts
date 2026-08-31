import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyPreviewUrl } from "@/lib/engine/executor";

describe("verifyPreviewUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("recognizes a ready preview protected by Vercel Authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(null, {
          status: 302,
          headers: {
            location:
              "https://vercel.com/sso-api?url=https%3A%2F%2Fpreview.example.vercel.app%2Fapi%2Fhealth",
          },
        }),
      ),
    );

    await expect(verifyPreviewUrl("https://preview.example.vercel.app", 1, 0)).resolves.toEqual({
      ok: true,
      protected: true,
      reason: "vercel_authentication_required",
    });
  });

  it("does not accept an unrelated redirect as a verified preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com/login" },
        }),
      ),
    );

    await expect(verifyPreviewUrl("https://preview.example.vercel.app", 1, 0)).resolves.toEqual({
      ok: false,
      reason: "preview_did_not_respond",
    });
  });
});
