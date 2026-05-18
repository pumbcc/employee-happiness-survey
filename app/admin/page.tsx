"use client";

import { useState } from "react";
import { BarChart3, LockKeyhole, Users } from "lucide-react";

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

  if (!data) {
    return (
      <main className="page-shell login-page">
        <section className="login-card">
          <div className="brand-pill"><BarChart3 size={16} /> Admin Dashboard</div>
          <h1>เข้าสู่หน้า Admin</h1>
          <p>กรอกรหัส Admin เพื่อดู Dashboard</p>
          <div className="login-box">
            <label>Admin PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadDashboard()}
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
          <div className="brand-pill">Admin Dashboard</div>
          <h1>ภาพรวมผลสำรวจความสุขพนักงาน</h1>
          <p>Average score scale 1-6</p>
        </div>
      </header>

      <section className="dashboard-grid">
        <div className="metric-card">
          <Users />
          <span>จำนวนผู้ตอบ</span>
          <strong>{data.totalResponses}</strong>
        </div>
        <div className="metric-card">
          <BarChart3 />
          <span>คะแนนเฉลี่ยรวม</span>
          <strong>{data.overallAverage}</strong>
        </div>
      </section>

      <section className="admin-card">
        <h2>คะแนนเฉลี่ยรายข้อ</h2>
        <div className="summary-list">
          {data.questionSummary.map(q => (
            <div className="summary-row" key={q.id}>
              <div>
                <strong>{q.id.toUpperCase()}</strong>
                <p>{q.text}</p>
              </div>
              <div className="score-badge">{q.average}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>Open-ended Responses</h2>
        <div className="response-list">
          {data.responses.map(r => (
            <div className="open-card" key={r.id}>
              <strong>
  {r.employees?.name || r.emp_id}
  {r.employees?.department ? ` · ${r.employees.department}` : ""}
  {r.employees?.division ? ` · ${r.employees.division}` : ""}
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
