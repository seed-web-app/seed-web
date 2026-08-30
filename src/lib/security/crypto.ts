import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
const ALGORITHM = "aes-256-gcm";
function encryptionKey() { const value = process.env.SEED_CREDENTIAL_ENCRYPTION_KEY; if (!value) throw new Error("SEED_CREDENTIAL_ENCRYPTION_KEY is required before storing credentials."); const key = Buffer.from(value, "base64"); if (key.length !== 32) throw new Error("SEED_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte base64 value."); return key; }
/** Ciphertext only; never pass this output through client props or logs. */
export function encryptCredential(plaintext: string) { const iv = randomBytes(12); const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv); const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64"); }
export function decryptCredential(ciphertext: string) { const input = Buffer.from(ciphertext, "base64"); const decipher = createDecipheriv(ALGORITHM, encryptionKey(), input.subarray(0, 12)); decipher.setAuthTag(input.subarray(12, 28)); return Buffer.concat([decipher.update(input.subarray(28)), decipher.final()]).toString("utf8"); }
