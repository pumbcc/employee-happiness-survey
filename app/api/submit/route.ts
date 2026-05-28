import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sections } from "@/lib/questions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empId, answers, open01, open02 } = body;

    if (!empId || typeof empId !== "string") {
      return NextResponse.json({ error: "ไม่พบรหัสพนักงาน" }, { status: 400 });
    }

   const { data: employee } = await supabaseAdmin
  .from("employees")
  .select("emp_id, department")
  .eq("emp_id", empId.trim())
  .single();

const isHQ = employee?.department === "สำนักงานใหญ่";

const scaleIds = sections
  .flatMap(section => section.questions)
  .filter(q => q.type === "scale")
  .filter(q => !q.hqOnly || isHQ)
  .map(q => q.id);

    const missing = scaleIds.filter(id => !answers?.[id]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `ยังตอบคำถามไม่ครบ ${missing.length} ข้อ` }, { status: 400 });
    }

    const numericAnswers: Record<string, number> = {};
    for (const id of scaleIds) {
      const value = Number(answers[id]);
      if (value < 1 || value > 6) {
        return NextResponse.json({ error: "คำตอบ scale ต้องอยู่ระหว่าง 1-6" }, { status: 400 });
      }
      numericAnswers[id] = value;
    }

    const averageScore =
      Object.values(numericAnswers).reduce((sum, value) => sum + value, 0) / scaleIds.length;

    const { error } = await supabaseAdmin.from("responses").insert({
      emp_id: empId.trim(),
      answers: numericAnswers,
      open_answer_1: open01 || "",
      open_answer_2: open02 || "",
      average_score: Number(averageScore.toFixed(2)),
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "รหัสพนักงานนี้เคยส่งแบบฟอร์มแล้ว" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ส่งข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
