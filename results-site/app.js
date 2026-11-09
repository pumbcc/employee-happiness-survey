"use strict";
// The only remote endpoint accepts the owner's Admin PIN and returns aggregates only.
const API = "https://employee-happiness-survey.vercel.app/api/admin/summary";
const $ = id => document.getElementById(id);
let activePin = "";
let report = null;
let busy = false;
let requestSequence = 0;
function node(tag, className = "", text = "") { const element = document.createElement(tag); if (className) element.className = className; if (text !== "") element.textContent = String(text); return element; }
function replace(id, children) { $(id).replaceChildren(...children); }
function score(value) { return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—"; }
function bar(value) { const track = node("div", "bar-track"); const fill = node("div", "bar-fill"); fill.style.width = `${typeof value === "number" ? Math.max(0, Math.min(100, value / 6 * 100)) : 0}%`; track.append(fill); return track; }
function setError(id, message = "") { $(id).textContent = message; $(id).hidden = !message; }
function setBusy(value) { busy = value; ["login-button", "refresh", "apply-filter", "department", "division"].forEach(id => $(id).disabled = value); $("report-busy").hidden = !value; $("login-button").textContent = value ? "กำลังตรวจสอบ..." : "เปิดดูผลสำรวจ ↗"; }
function options(id, values, selected, placeholder) { const all = node("option", "", placeholder); all.value = ""; $(id).replaceChildren(all, ...values.map(value => { const option = node("option", "", value); option.value = value; return option; })); $(id).value = selected || ""; }
async function loadReport(pin, initial = false) {
 if (busy) return;
 const sequence = ++requestSequence;
 setBusy(true); setError("login-error"); setError("report-error");
 try {
  const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", cache: "no-store", body: JSON.stringify({ pin, department: initial ? "" : $("department").value, division: initial ? "" : $("division").value }) });
  const data = await response.json();
  if (sequence !== requestSequence) return;
  if (!response.ok) throw new Error(data.error || "โหลดผลสำรวจไม่สำเร็จ");
  if (!Array.isArray(data.sectionSummary) || !Array.isArray(data.participation) || "responses" in data) throw new Error("เว็บกำลังอัปเดตรูปแบบรายงาน กรุณาลองใหม่อีกครั้ง");
  activePin = pin; report = data; $("admin-pin").value = "";
  $("login-screen").hidden = true; $("report-screen").hidden = false;
  render();
 } catch (error) { if (sequence === requestSequence) setError(initial ? "login-error" : "report-error", error.message || "เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
 finally { if (sequence === requestSequence) setBusy(false); }
}
function metric(label, value, detail, accent = false) { const card = node("div", `metric${accent ? " accent" : ""}`); card.append(node("span", "metric-label", label), node("strong", "metric-value", value), node("small", "", detail)); return card; }
function renderRanking(id, questions) { if (!questions.length) { replace(id, [node("p", "empty", "ยังไม่มีข้อมูลคะแนนที่แสดงได้")]); return; } replace(id, questions.map((question, index) => { const row = node("div", "ranking-row"); const text = node("div", "rank-question", question.text); text.append(node("small", "", `${question.id.toUpperCase()} · ${question.section}`)); row.append(node("span", "rank-number", String(index + 1).padStart(2, "0")), text, node("span", "rank-score", score(question.average))); return row; })); }
function renderQuestions() {
 if (!report) return;
 const search = $("question-search").value.trim().toLocaleLowerCase("th");
 const questions = report.questionSummary.filter(question => `${question.id} ${question.text} ${question.section}`.toLocaleLowerCase("th").includes(search));
 replace("question-list", questions.map(question => { const row = node("div", "question-row"); const text = node("div", "question-text", question.text); text.append(node("small", "", `${question.section} · ผู้ตอบ ${question.count} คน`)); row.append(node("span", "question-id", question.id.toUpperCase()), text, bar(question.average), node("span", "bar-value", score(question.average))); return row; }));
 if (!questions.length) replace("question-list", [node("p", "empty", "ไม่พบข้อคำถามที่ตรงกับคำค้น")]);
}
function render() {
 options("department", report.departments, report.filters.department, "ทุกหน่วยงาน");
 options("division", report.divisions, report.filters.division, "ทุกฝ่าย / สาขา");
 $("scope-label").textContent = [report.filters.department || "ทุกหน่วยงาน", report.filters.division || "ทุกฝ่าย / สาขา"].join(" / ");
 replace("metrics", [metric("ผู้ตอบแบบสำรวจ", report.totalResponses.toLocaleString("th-TH"), `จากพนักงาน ${report.totalEmployees.toLocaleString("th-TH")} คน`), metric("อัตราการตอบ", `${report.completionRate}%`, "ของพนักงานที่อยู่ในขอบเขตนี้", true), metric("คะแนนเฉลี่ยรวม", score(report.overallAverage), "จากคะแนนเต็ม 6"), metric("ยังไม่ทำแบบสำรวจ", Math.max(0, report.totalEmployees - report.totalResponses).toLocaleString("th-TH"), "คน ในขอบเขตที่เลือก")]);
 $("privacy-notice").textContent = report.suppressed ? `ยังมีคำตอบไม่ถึง ${report.minimumResponses} คนในขอบเขตนี้ จะแสดงจำนวนผู้ตอบก่อน และแสดงคะแนนเมื่อมีอย่างน้อย ${report.minimumResponses} คน เพื่อปกป้องความเป็นส่วนตัว` : `รายงานแสดงเฉพาะภาพรวม คะแนนของแต่ละหมวดหรือข้อคำถามจะแสดงเมื่อมีผู้ตอบอย่างน้อย ${report.minimumResponses} คน ไม่แสดงชื่อ รหัสพนักงาน หรือคำตอบรายบุคคล`;
 replace("section-chart", report.sectionSummary.map(section => { const row = node("div", "bar-row"); row.append(node("span", "bar-label", section.title), bar(section.average), node("span", "bar-value", score(section.average))); return row; }));
 const ranked = report.questionSummary.filter(question => typeof question.average === "number");
 renderRanking("top-ranking", [...ranked].sort((a,b) => b.average - a.average).slice(0,5));
 renderRanking("bottom-ranking", [...ranked].sort((a,b) => a.average - b.average).slice(0,5));
 renderQuestions();
 replace("participation", report.participation.map(group => { const row = node("tr"); const rate = group.total ? Math.round(group.completed / group.total * 100) : 0; const cell = node("td"); const visual = node("div", "rate-cell"); const track = bar(rate / 100 * 6); visual.append(track, node("span", "", `${rate}%`)); cell.append(visual); row.append(node("td", "", group.department), node("td", "", group.division), node("td", "", `${group.completed} / ${group.total}`), cell); return row; }));
 if (!report.participation.length) { const row = node("tr"); const cell = node("td", "empty", "ยังไม่มีข้อมูลในขอบเขตนี้"); cell.colSpan = 4; row.append(cell); replace("participation", [row]); }
 $("updated-at").textContent = "อัปเดตล่าสุด " + new Date(report.updatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
}
$("login-form").addEventListener("submit", event => { event.preventDefault(); void loadReport($("admin-pin").value, true); });
$("refresh").addEventListener("click", () => void loadReport(activePin));
$("apply-filter").addEventListener("click", () => void loadReport(activePin));
$("department").addEventListener("change", () => { $("division").value = ""; void loadReport(activePin); });
$("question-search").addEventListener("input", renderQuestions);
$("logout").addEventListener("click", () => { requestSequence++; activePin = ""; report = null; $("report-screen").hidden = true; $("login-screen").hidden = false; $("admin-pin").value = ""; $("question-search").value = ""; setError("login-error"); setBusy(false); ["metrics","section-chart","top-ranking","bottom-ranking","question-list","participation"].forEach(id => replace(id,[])); $("admin-pin").focus(); });
