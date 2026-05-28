"use client";

import { useMemo, useState } from "react";
import { BarChart3, LockKeyhole, Users, Trophy, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { sections } from "@/lib/questions";

type Summary = {
  totalResponses: number;
  overallAverage: number;
  questionSummary: { id: string; text: string; average: number; count: number }[];
  responses: any[];
};

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [division, setDivision] = useState("ทั้งหมด");
  const [department, setDepartment] = useState("ทั้งหมด");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error || "เข้า Admin ไม่สำเร็จ");
      return;
    }

    setData(result);
  }

  const filteredResponses = useMemo(() => {
    if (!data) return [];

    return data.responses.filter((r) => {
      const empDivision = r.employees?.division || "";
      const empDepartment = r.employees?.department || "";

      const matchDivision = division === "ทั้งหมด" || empDivision === division;
      const matchDepartment = department === "ทั้งหมด" || empDepartment === department;

      return matchDivision && matchDepartment;
    });
  }, [data, division, department]);

  const divisions = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(data.responses.map((r) => r.employees?.division).filter(Boolean))
    );
  }, [data]);

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(
        data.responses
          .filter((r) => division === "ทั้งหมด" || r.employees?.division === division)
          .map((r) => r.employees?.department)
          .filter(Boolean)
      )
    );
  }, [data, division]);

  const scaleQuestions = sections.flatMap((s) =>
    s.questions
      .filter((q) => q.type === "scale")
      .map((q) => ({
        ...q,
        sectionTitle: s.title,
      }))
  );

  const questionSummary = useMemo(() => {
    return scaleQuestions.map((q) => {
      const values = filteredResponses
        .map((r) => Number(r.answers?.[q.id]))
        .filter((v) => !Number.isNaN(v));

      const average =
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;

      return {
        id: q.id,
        text: q.text,
        sectionTitle: q.sectionTitle,
        average: Number(average.toFixed(2)),
        count: values.length,
      };
    });
  }, [filteredResponses]);

  const sectionSummary = useMemo(() => {
    return sections
      .filter((s) => s.questions.some((q) => q.type === "scale"))
      .map((section) => {
        const questionIds = section.questions.filter((q) => q.type === "scale").map((q) => q.id);

        const values: number[] = [];

        filteredResponses.forEach((r) => {
          questionIds.forEach((id) => {
            const value = Number(r.answers?.[id]);
            if (!Number.isNaN(value)) values.push(value);
          });
        });

        const average =
          values.length > 0
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : 0;

        return {
          name: section.title,
          average: Number(average.toFixed(2)),
        };
      });
  }, [filteredResponses]);

  const overallAverage = useMemo(() => {
    if (filteredResponses.length === 0) return 0;
    const avg =
      filteredResponses.reduce((sum, r) => sum + Number(r.average_score || 0), 0) /
      filteredResponses.length;

    return Number(avg.toFixed(2));
  }, [filteredResponses]);

  const top5 = [...questionSummary]
    .filter((q) => q.count > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const bottom5 = [...questionSummary]
    .filter((q) => q.count > 0)
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);

  if (!data) {
    return (
      <main className="page-shell login-page">
        <section className="login-card">
          <div className="brand-pill">
            <BarChart3 size={16} /> Admin Dashboard
          </div>
          <h1>เข้าสู่หน้า Admin</h1>
          <p>กรอกรหัส Admin เพื่อดู Dashboard</p>

          <div className="login-box">
            <label>Admin PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDashboard()}
            />
            {error && <div className="error">{error}</div>}
            <button onClick={loadDashboard} disabled={loading}>
              <LockKeyhole size={18} />
              {loading ? "กำลังโหลด..." : "เข้าสู่ Dashboard"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="survey-header">
        <div>
          <div className="brand-pill">Admin Dashboard V2</div>
          <h1>ภาพรวมผลสำรวจความสุขพนักงาน</h1>
          <p>Filter by Division / Department</p>
        </div>
      </header>

      <section className="admin-card">
        <h2>Filter</h2>

        <div className="dashboard-grid">
          <div>
            <label>ฝ่าย / Division</label>
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setDepartment("ทั้งหมด");
              }}
            >
              <option>ทั้งหมด</option>
              {divisions.map((d: any) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label>แผนก / Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option>ทั้งหมด</option>
              {departments.map((d: any) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="metric-card">
          <Users />
          <span>จำนวนผู้ตอบ</span>
          <strong>{filteredResponses.length}</strong>
        </div>

        <div className="metric-card">
          <BarChart3 />
          <span>คะแนนเฉลี่ยรวม</span>
          <strong>{overallAverage}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="metric-card">
          <Trophy />
          <span>คะแนนสูงสุด</span>
          <strong>{top5[0]?.average || "-"}</strong>
          <p>{top5[0]?.text || "-"}</p>
        </div>

        <div className="metric-card">
          <AlertTriangle />
          <span>คะแนนต่ำสุด</span>
          <strong>{bottom5[0]?.average || "-"}</strong>
          <p>{bottom5[0]?.text || "-"}</p>
        </div>
      </section>

      <section className="admin-card">
        <h2>คะแนนเฉลี่ยรายหมวด</h2>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={sectionSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 6]} />
              <Tooltip />
              <Bar dataKey="average" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="admin-card">
        <h2>Ranking จุดแข็ง Top 5</h2>
        <div className="summary-list">
          {top5.map((q, index) => (
            <div className="summary-row" key={q.id}>
              <div>
                <strong>#{index + 1} · {q.id.toUpperCase()}</strong>
                <p>{q.text}</p>
              </div>
              <div className="score-badge">{q.average}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>Ranking จุดที่ควรพัฒนา Bottom 5</h2>
        <div className="summary-list">
          {bottom5.map((q, index) => (
            <div className="summary-row" key={q.id}>
              <div>
                <strong>#{index + 1} · {q.id.toUpperCase()}</strong>
                <p>{q.text}</p>
              </div>
              <div className="score-badge">{q.average}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>คะแนนเฉลี่ยรายข้อ</h2>
        <div style={{ width: "100%", height: 720 }}>
          <ResponsiveContainer>
            <BarChart data={questionSummary} layout="vertical" margin={{ left: 40, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 6]} />
              <YAxis dataKey="id" type="category" width={60} />
              <Tooltip
                formatter={(value) => [`${value}`, "คะแนนเฉลี่ย"]}
                labelFormatter={(label) => {
                  const q = questionSummary.find((item) => item.id === label);
                  return q?.text || label;
                }}
              />
              <Bar dataKey="average" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="admin-card">
        <h2>Open-ended Responses</h2>
        <div className="response-list">
          {filteredResponses.map((r) => (
            <div className="open-card" key={r.id}>
              <strong>
                {r.employees?.name || r.emp_id}
                {r.employees?.division ? ` · ${r.employees.division}` : ""}
                {r.employees?.department ? ` · ${r.employees.department}` : ""}
              </strong>
              <p><b>บริษัทช่วยเพิ่มความสุข:</b> {r.open_answer_1 || "-"}</p>
              <p><b>ตัวเองช่วยเพิ่มความสุข:</b> {r.open_answer_2 || "-"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

