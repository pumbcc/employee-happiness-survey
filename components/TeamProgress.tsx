"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, LogOut, RefreshCw, Search, Users } from "lucide-react";

type TeamData = { team: { department: string | null; division: string | null }; total: number; completed: number; pending: number; limitedScope: boolean; updatedAt: string; members: { name: string; completed: boolean; isYou: boolean }[] };
export default function TeamProgress() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "done" | "pending">("all");
  const [search, setSearch] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/team", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "โหลดสถานะทีมไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function logout() { const response = await fetch("/api/logout", { method: "POST" }); if (response.ok) window.location.reload(); }
  const visible = data?.members.filter(member => (filter === "all" || member.completed === (filter === "done")) && member.name.toLocaleLowerCase("th").includes(search.toLocaleLowerCase("th"))) || [];
  const percent = data?.total ? Math.round(data.completed / data.total * 100) : 0;
  return <main className="page-shell team-page">
    <header className="team-header"><span className="brand-pill">Employee Happiness Survey</span><button className="secondary compact-button" onClick={logout}><LogOut size={16} /> ออกจากระบบ</button></header>
    <section className="team-thanks"><CheckCircle2 size={40} aria-hidden="true" /><div><h1>ขอบคุณที่ร่วมส่งเสียง</h1><p>คุณส่งแบบสำรวจเรียบร้อยแล้ว มาช่วยติดตามความคืบหน้าในทีมไปด้วยกัน</p></div></section>
    <section className="team-panel"><div className="team-panel-heading"><div><span className="team-eyebrow"><Users size={16} /> สถานะการทำแบบสำรวจของทีม</span><h2>{data?.team.division || "ทีมของคุณ"}</h2><p>{data?.team.department || ""}</p></div><button className="secondary compact-button" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? "campaign-spinner" : ""} /> {loading ? "กำลังโหลด..." : "อัปเดตสถานะ"}</button></div>
      <div className="team-privacy">แสดงเฉพาะชื่อและสถานะการทำแบบสำรวจของฝ่าย/สาขาเดียวกัน ไม่แสดงคำตอบหรือคะแนนของบุคคล</div>
      {error && <div className="error" role="alert">{error}</div>}
      {data && <><div className="team-stats"><div><span>สมาชิกทั้งหมด</span><strong>{data.total}<small> คน</small></strong></div><div><span>ทำแล้ว</span><strong>{data.completed}<small> คน</small></strong></div><div><span>ยังไม่ทำ</span><strong>{data.pending}<small> คน</small></strong></div><div><span>ความคืบหน้า</span><strong>{percent}<small>%</small></strong></div></div><div className="progress-bar"><div style={{ width: `${percent}%` }} /></div>
      {data.limitedScope && <p className="team-help">ข้อมูลฝ่าย/สาขายังไม่ครบ จึงแสดงเฉพาะสถานะของคุณ กรุณาติดต่อผู้ดูแลเพื่ออัปเดตข้อมูลทีม</p>}
      <div className="team-tools"><div className="team-tabs" role="group" aria-label="กรองสถานะ"><button className={filter === "all" ? "selected" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>ทั้งหมด ({data.total})</button><button className={filter === "done" ? "selected" : ""} aria-pressed={filter === "done"} onClick={() => setFilter("done")}>ทำแล้ว ({data.completed})</button><button className={filter === "pending" ? "selected" : ""} aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>ยังไม่ทำ ({data.pending})</button></div><label className="team-search"><Search size={17} aria-hidden="true" /><input aria-label="ค้นหาชื่อในทีม" placeholder="ค้นหาชื่อในทีม" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <ul className="team-members">{visible.map((member, index) => <li key={`${member.name}-${index}`}><div className="team-person"><span className="team-avatar" aria-hidden="true">{member.name.trim().slice(0, 1)}</span><span>{member.name}{member.isYou && <small className="team-you">คุณ</small>}</span></div><span className={`team-status ${member.completed ? "done" : "pending"}`}>{member.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}{member.completed ? "ทำแล้ว" : "ยังไม่ทำ"}</span></li>)}</ul>{!visible.length && <p className="team-help">ไม่พบรายชื่อที่ตรงกับตัวกรอง</p>}<p className="team-updated">อัปเดตล่าสุด {new Date(data.updatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })}</p></>}
      {!data && loading && <p className="team-help" role="status">กำลังโหลดรายชื่อทีม...</p>}
    </section>
  </main>;
}
