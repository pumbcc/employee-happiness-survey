import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { employeeIdFromRequest } from "@/lib/employee-session";
import { findActiveEmployee, readAllRows } from "@/lib/survey-data";

const readParticipation = unstable_cache(async () => {
  const [employees, responses] = await Promise.all([
    readAllRows<{ emp_id: string; division: string | null }>("employees", "emp_id,division", true),
    readAllRows<{ emp_id: string }>("responses", "emp_id"),
  ]);
  const submitted = new Set(responses.map(response => response.emp_id));
  const groups = new Map<string, { total: number; completed: number }>();

  for (const employee of employees) {
    const division = employee.division?.trim() || "ไม่ระบุฝ่าย";
    if (division.toUpperCase() === "UC") continue;
    const group = groups.get(division) ?? { total: 0, completed: 0 };
    group.total++;
    if (submitted.has(employee.emp_id)) group.completed++;
    groups.set(division, group);
  }

  return {
    updatedAt: new Date().toISOString(),
    divisions: Array.from(groups, ([division, { total, completed }]) => ({
      division, total, completed,
    })).sort((a, b) => a.division.localeCompare(b.division, "th", { numeric: true })),
  };
}, ["survey-participation-by-division"], { revalidate: 60 });

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  const empId = employeeIdFromRequest(request);
  if (!empId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401, headers });

  try {
    if (!await findActiveEmployee(empId)) {
      return NextResponse.json({ error: "ไม่พบสิทธิ์การเข้าถึง" }, { status: 403, headers });
    }
    return NextResponse.json(await readParticipation(), { headers });
  } catch {
    return NextResponse.json({ error: "โหลดภาพรวมไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500, headers });
  }
}
