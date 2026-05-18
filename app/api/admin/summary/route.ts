import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sections } from "@/lib/questions";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "รหัส Admin ไม่ถูกต้อง" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("responses")
      .select("id, emp_id, answers, open_answer_1, open_answer_2, average_score, created_at, employees(name, department, division)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responses = data || [];
    const scaleQuestions = sections.flatMap(s => s.questions).filter(q => q.type === "scale");

    const questionSummary = scaleQuestions.map(q => {
      const values = responses
        .map((r: any) => Number(r.answers?.[q.id]))
        .filter((v: number) => !Number.isNaN(v));

      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return {
        id: q.id,
        text: q.text,
        average: Number(avg.toFixed(2)),
        count: values.length,
      };
    });

    const overallAverage = responses.length
      ? responses.reduce((sum: number, r: any) => sum + Number(r.average_score || 0), 0) / responses.length
      : 0;

    return NextResponse.json({
      totalResponses: responses.length,
      overallAverage: Number(overallAverage.toFixed(2)),
      questionSummary,
      responses,
    });
  } catch {
    return NextResponse.json({ error: "โหลด Dashboard ไม่สำเร็จ" }, { status: 500 });
  }
}
