import { createHash, timingSafeEqual } from "node:crypto";

// SHA-256 verifier for the randomly generated owner code. The code itself stays on the owner's computer.
const OWNER_PIN_HASH = "8c3c82cd7c5bd110694d6f406b93eef667a95343f18eb13696947ca41a870f85";
export function verifyAdminPin(pin: unknown) {
  if (typeof pin !== "string" || !pin || pin.length > 256) return false;
  const expected = Buffer.from(process.env.ADMIN_PIN_HASH || OWNER_PIN_HASH, "hex");
  const actual = createHash("sha256").update(pin).digest();
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
