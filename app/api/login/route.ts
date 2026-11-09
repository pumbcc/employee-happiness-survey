import { NextResponse } from "next/server";
import { EMPLOYEE_COOKIE, SESSION_SECONDS, createEmployeeToken, isSameOrigin } from "@/lib/employee-session";
import { findActiveEmployee, hasSubmitted } from "@/lib/survey-data";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาตคำขอจากเว็บไซต์อื่น" }, { status: 403 });
  try {
    const { empId } = await request.json();
    if (typeof empId !== "string" || !empId.trim() || empId.length > 80) return NextResponse.json({ error: "กรุณากรอกรหัสพนักงาน" }, { status: 400 });
    const employee = await findActiveEmployee(empId.trim());
    if (!employee) return NextResponse.json({ error: "ไม่พบรหัสพนักงาน หรือรหัสนี้ไม่สามารถใช้งานได้" }, { status: 401 });
    const alreadySubmitted = await hasSubmitted(employee.emp_id);
    const response = NextResponse.json({ employee: { empId: employee.emp_id, name: employee.name, department: employee.department, division: employee.division }, alreadySubmitted }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(EMPLOYEE_COOKIE, createEmployeeToken(employee.emp_id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
    return response;
  } catch { return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองเข้าสู่ระบบอีกครั้ง" }, { status: 500 }); }
}
