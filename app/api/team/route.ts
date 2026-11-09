import { NextResponse } from "next/server";
import { employeeIdFromRequest } from "@/lib/employee-session";
import { findActiveEmployee, hasSubmitted } from "@/lib/survey-data";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const empId = employeeIdFromRequest(request);
  if (!empId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  try {
    const employee = await findActiveEmployee(empId);
    if (!employee) return NextResponse.json({ error: "ไม่พบสิทธิ์การเข้าถึง" }, { status: 403 });
    if (!await hasSubmitted(empId)) return NextResponse.json({ error: "กรุณาส่งแบบสำรวจก่อนดูสถานะทีม" }, { status: 403 });
    const members: { emp_id: string; name: string | null }[] = [];
    const hasTeam = Boolean(employee.department && employee.division);
    for (let offset = 0; ; offset += 1000) {
      let query = supabaseAdmin.from("employees").select("emp_id,name").eq("is_active", true).order("emp_id").range(offset, offset + 999);
      query = hasTeam ? query.eq("department", employee.department!).eq("division", employee.division!) : query.eq("emp_id", empId);
      const { data, error } = await query;
      if (error) throw error;
      members.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const completed = new Set<string>();
    for (let offset = 0; offset < members.length; offset += 200) {
      const { data, error } = await supabaseAdmin.from("responses").select("emp_id").in("emp_id", members.slice(offset, offset + 200).map(member => member.emp_id));
      if (error) throw error;
      for (const response of data || []) completed.add(response.emp_id);
    }
    return NextResponse.json({
      team: { department: employee.department, division: employee.division },
      total: members.length, completed: completed.size, pending: members.length - completed.size,
      limitedScope: !hasTeam, updatedAt: new Date().toISOString(),
      members: members.map(member => ({ name: member.name || "ไม่ระบุชื่อ", completed: completed.has(member.emp_id), isYou: member.emp_id === empId })).sort((a, b) => a.name.localeCompare(b.name, "th")),
    }, { headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
  } catch { return NextResponse.json({ error: "โหลดสถานะทีมไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500 }); }
}
