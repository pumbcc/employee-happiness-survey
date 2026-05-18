import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { empId } = await request.json();

    if (!empId || typeof empId !== "string") {
      return NextResponse.json({ error: "กรุณากรอกรหัสพนักงาน" }, { status: 400 });
    }

    const cleanEmpId = empId.trim();

    const { data: employee, error } = await supabaseAdmin
      .from("employees")
      .select("emp_id, name, department, division, is_active")
      .eq("emp_id", cleanEmpId)
      .eq("is_active", true)
      .single();

    if (error || !employee) {
      return NextResponse.json({ error: "ไม่พบรหัสพนักงาน หรือรหัสนี้ไม่สามารถใช้งานได้" }, { status: 401 });
    }

    const { data: existing } = await supabaseAdmin
      .from("responses")
      .select("id")
      .eq("emp_id", cleanEmpId)
      .maybeSingle();

    return NextResponse.json({
      employee: {
        empId: employee.emp_id,
        name: employee.name,
        department: employee.department,
        division: employee.division,
      },
      alreadySubmitted: Boolean(existing),
    });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  }
}
