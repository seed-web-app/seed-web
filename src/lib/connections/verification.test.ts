import { describe, expect, it } from "vitest";
import { verifyStoredConnection } from "@/lib/connections/verification";
import { encryptCredential } from "@/lib/security/crypto";

describe("verifyStoredConnection", () => {
  it("fails gracefully on invalid ciphertext", async () => {
    const result = await verifyStoredConnection("openai", "invalid:cipher:data");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Could not decrypt");
  });

  it("fails gracefully when OpenAI API key is invalid", async () => {
    process.env.SEED_CREDENTIAL_ENCRYPTION_KEY =
      process.env.SEED_CREDENTIAL_ENCRYPTION_KEY || "f/bXWWy7oqul0Xg/pOKx1Tz3fUdDO738s5XOmcoOkSs=";
    const encrypted = encryptCredential(JSON.stringify({ apiKey: "sk-invalid-mock-key-12345" }));
    const result = await verifyStoredConnection("openai", encrypted);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("fails gracefully when GitHub installation ID is missing", async () => {
    process.env.SEED_CREDENTIAL_ENCRYPTION_KEY =
      process.env.SEED_CREDENTIAL_ENCRYPTION_KEY || "f/bXWWy7oqul0Xg/pOKx1Tz3fUdDO738s5XOmcoOkSs=";
    const encrypted = encryptCredential(JSON.stringify({ accountLogin: "test" }));
    const result = await verifyStoredConnection("github", encrypted);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No GitHub App installation ID stored");
  });

  it("fails gracefully when Vercel token is missing or invalid", async () => {
    process.env.SEED_CREDENTIAL_ENCRYPTION_KEY =
      process.env.SEED_CREDENTIAL_ENCRYPTION_KEY || "f/bXWWy7oqul0Xg/pOKx1Tz3fUdDO738s5XOmcoOkSs=";
    const encrypted = encryptCredential(JSON.stringify({ access_token: "invalid-token" }));
    const result = await verifyStoredConnection("vercel", encrypted);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
