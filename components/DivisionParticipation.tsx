"use client";

import { useState } from "react";

type Participation = {
  updatedAt: string;
  divisions: { division: string; total: number; completed: number }[];
};

const percentFormat = new Intl.NumberFormat("th-TH", { style: "percent", maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" });

export default function DivisionParticipation() {
  const [data, setData] = useState<Participation>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/participation", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "โหลดภาพรวมไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="team-panel division-participation" onToggle={event => {
      if (event.currentTarget.open && !data && !loading && !error) void refresh();
    }}>
      <summary>ดูภาพรวมการตอบแบบสำรวจรายฝ่าย</summary>
      <p className="team-help">คิดจากจำนวนผู้ส่งแบบสำรวจเทียบกับจำนวนผู้มีสิทธิ์ตอบในแต่ละฝ่าย</p>
      {error && <p className="error" role="alert">{error}</p>}
      {data && <>
        <ul className="division-progress-list">
          {data.divisions.map(({ division, completed, total }) => {
            const rate = completed / total;
            const label = completed < total && rate >= 0.9995 ? ">99.9%" : percentFormat.format(rate);
            return (
              <li key={division}>
                <div className="division-progress-label">
                  <strong>{division}</strong>
                  <span>{completed.toLocaleString("th-TH")} / {total.toLocaleString("th-TH")} คน · <strong>{label}</strong></span>
                </div>
                <div className="progress-bar" aria-hidden="true"><div style={{ width: `${rate * 100}%` }} /></div>
              </li>
            );
          })}
        </ul>
        {data.divisions.length === 0 && <p className="team-help">ยังไม่มีข้อมูลรายฝ่าย</p>}
        <p className="team-updated">ข้อมูล ณ {timeFormat.format(new Date(data.updatedAt))}</p>
      </>}
      <button className="secondary compact-button division-refresh" onClick={refresh} disabled={loading}>
        {loading ? "กำลังโหลด..." : "อัปเดตภาพรวม"}
      </button>
    </details>
  );
}
