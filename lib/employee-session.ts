import { createHmac, timingSafeEqual } from "node:crypto";

export const EMPLOYEE_COOKIE = "happiness_employee";
export const SESSION_SECONDS = 8 * 60 * 60;

function signingKey() {
  const secret = process.env.SURVEY_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Employee session signing is not configured");
  return createHmac("sha256", secret).update("happiness-employee-session-v1").digest();
}

export function createEmployeeToken(empId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ empId, exp: Math.floor(now / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${createHmac("sha256", signingKey()).update(payload).digest("base64url")}`;
}

export function verifyEmployeeToken(token: string, now = Date.now()): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = createHmac("sha256", signingKey()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.empId !== "string" || !data.empId || !Number.isFinite(data.exp) || data.exp <= Math.floor(now / 1000)) return null;
    return data.empId;
  } catch { return null; }
}

export function employeeIdFromRequest(request: Request) {
  const entry = (request.headers.get("cookie") || "").split(";").map(value => value.trim()).find(value => value.startsWith(`${EMPLOYEE_COOKIE}=`));
  return entry ? verifyEmployeeToken(entry.slice(EMPLOYEE_COOKIE.length + 1)) : null;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
