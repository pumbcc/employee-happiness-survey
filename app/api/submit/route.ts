import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sections } from "@/lib/questions";
import { employeeIdFromRequest, isSameOrigin } from "@/lib/employee-session";
import { findActiveEmployee } from "@/lib/survey-data";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาต" }, { status: 403 });
  const empId = employeeIdFromRequest(request);
  if (!empId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่ก่อนส่งคำตอบ" }, { status: 401 });
  try {
    const { answers, open01, open02 } = await request.json();
    const employee = await findActiveEmployee(empId);
    if (!employee) return NextResponse.json({ error: "ไม่พบสิทธิ์ส่งแบบสำรวจ" }, { status: 403 });
    if ((open01 != null && typeof open01 !== "string") || (open02 != null && typeof open02 !== "string") || (open01?.length || 0) > 4000 || (open02?.length || 0) > 4000) return NextResponse.json({ error: "กรุณากรอกข้อเสนอแนะไม่เกิน 4,000 ตัวอักษรต่อข้อ" }, { status: 400 });
    const scaleIds = sections.flatMap(section => section.questions).filter(question => question.type === "scale" && (!question.hqOnly || employee.department === "สำนักงานใหญ่")).map(question => question.id);
    const numericAnswers: Record<string, number> = {};
    for (const id of scaleIds) {
      const value = Number(answers?.[id]);
      if (!Number.isInteger(value) || value < 1 || value > 6) return NextResponse.json({ error: "กรุณาตอบคำถามให้ครบทุกข้อ โดยเลือกคะแนน 1–6" }, { status: 400 });
      numericAnswers[id] = value;
    }
    const average = Object.values(numericAnswers).reduce((sum, value) => sum + value, 0) / scaleIds.length;
    const { error } = await supabaseAdmin.from("responses").insert({ emp_id: empId, answers: numericAnswers, open_answer_1: open01 || "", open_answer_2: open02 || "", average_score: Number(average.toFixed(2)) });
    if (error?.code === "23505") return NextResponse.json({ error: "คุณส่งแบบสำรวจแล้ว", alreadySubmitted: true }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "ส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500 }); }
}
