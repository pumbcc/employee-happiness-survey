import { NextResponse } from "next/server";
import { verifyAdminPin } from "@/lib/admin-auth";
import { sections } from "@/lib/questions";
import { readAllRows } from "@/lib/survey-data";
import { buildAggregateReport, type ReportEmployee, type ReportResponse } from "@/lib/report";

const attempts = new Map<string, { failures: number; reset: number }>();
function headers(request: Request) {
  return { "Cache-Control": "private, no-store", "Vary": "Origin" };
}
export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: { ...headers(request), "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" } });
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: headers(request) });
  if (origin && origin !== new URL(request.url).origin) return reply({ error: "ไม่อนุญาตเว็บไซต์นี้" }, 403);
  try {
    const { pin, department = "", division = "" } = await request.json();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();
    for (const [key, value] of attempts) if (value.reset < now) attempts.delete(key);
    const attempt = attempts.get(ip);
    if (attempt && attempt.failures >= 5) return reply({ error: "กรอกรหัสไม่ถูกต้องหลายครั้ง กรุณารอ 15 นาที" }, 429);
    if (!verifyAdminPin(pin)) {
      attempts.set(ip, { failures: (attempt?.failures || 0) + 1, reset: attempt?.reset || now + 15 * 60 * 1000 });
      return reply({ error: "รหัส Admin ไม่ถูกต้อง" }, 401);
    }
    attempts.delete(ip);
    if (typeof department !== "string" || typeof division !== "string" || department.length > 300 || division.length > 300) return reply({ error: "ตัวกรองไม่ถูกต้อง" }, 400);
    const [employees, responses] = await Promise.all([
      readAllRows<ReportEmployee>("employees", "emp_id,department,division", true),
      readAllRows<ReportResponse>("responses", "emp_id,answers,average_score"),
    ]);
    return reply(buildAggregateReport(employees, responses, sections, department, division));
  } catch { return reply({ error: "โหลดภาพรวมไม่สำเร็จ กรุณาลองใหม่" }, 500); }
}
