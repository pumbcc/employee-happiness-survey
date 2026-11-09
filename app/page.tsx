"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { sections, scaleLabels } from "@/lib/questions";
import { ArrowLeft, ArrowRight } from "lucide-react";

import LoginLanding from "@/components/LoginLanding";
import TeamProgress from "@/components/TeamProgress";

type Employee = {
  empId: string;
  name: string;
  department: string;
  division: string;
};

export default function Home() {
  const [empId, setEmpId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [open01, setOpen01] = useState("");
  const [open02, setOpen02] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [instructionsRead, setInstructionsRead] = useState(false);
  const sectionHeading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    if (!employee || alreadySubmitted || submitted) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (instructionsRead) sectionHeading.current?.focus({ preventScroll: true });
  }, [step, employee, instructionsRead, alreadySubmitted, submitted]);

  const currentSection = sections[step];
  const isHQ = employee?.department === "สำนักงานใหญ่";

  const progress = useMemo(() => {
    const allScale = sections.flatMap(s => s.questions).filter(q => q.type === "scale");
    const answered = allScale.filter(q => answers[q.id]).length;
    return Math.round((answered / allScale.length) * 100);
  }, [answers]);

  async function login() {
    setLoading(true); setLoginError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empId }) });
      const data = await response.json();
      if (!response.ok) { setLoginError(data.error || "เข้าสู่ระบบไม่สำเร็จ"); return; }
      setEmployee(data.employee); setAlreadySubmitted(data.alreadySubmitted);
    } catch { setLoginError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { setLoading(false); }
  }

  function canGoNext() {
  const scaleQuestions = currentSection.questions
    .filter((q) => q.type === "scale")
   .filter((q) => !q.hqOnly || isHQ)

  return scaleQuestions.every((q) => answers[q.id]);
}

  async function submit() {
    if (!employee || loading) return;
    setLoading(true); setSubmitError("");
    try {
      const response = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, open01, open02 }) });
      const data = await response.json();
      if (response.status === 409 && data.alreadySubmitted) { setAlreadySubmitted(true); return; }
      if (!response.ok) { setSubmitError(data.error || "ส่งข้อมูลไม่สำเร็จ"); return; }
      setSubmitted(true);
    } catch { setSubmitError("เชื่อมต่อไม่สำเร็จ กรุณาลองส่งอีกครั้ง"); }
    finally { setLoading(false); }
  }

  if (!employee) {
    return (
      <LoginLanding empId={empId} onEmpIdChange={setEmpId} onStart={login} loading={loading} error={loginError} />
    );
  }

  if (alreadySubmitted || submitted) return <TeamProgress />;

  if (!instructionsRead) return (
    <main className="page-shell">
      <section className="question-card survey-introduction" aria-labelledby="instructions-title">
        <div className="brand-pill">Employee Happiness Survey · 2026</div>
        <h1 id="instructions-title">ยินดีต้อนรับสู่แบบสำรวจความสุขพนักงาน<br />และความผูกพัน ประจำปี 2569</h1>
        <p>Food Passion ให้ความสำคัญกับเสียงของพนักงานทุกคน แบบสำรวจนี้จะช่วยให้เราเข้าใจประสบการณ์ในการทำงาน และนำไปพัฒนาความสุขและสภาพแวดล้อมในการทำงานร่วมกัน</p>
        <h2>ก่อนเริ่มทำแบบสำรวจ</h2>
        <ol>
          <li>ตอบตามความรู้สึกและประสบการณ์จริงในการทำงานช่วง 1 ปีที่ผ่านมา ไม่มีคำตอบที่ถูกหรือผิด</li>
          <li>เลือกคำตอบที่ตรงกับความคิดเห็นของคุณมากที่สุดเพียงข้อเดียวในแต่ละคำถาม</li>
          <li>คำตอบจะถูกเก็บเป็นความลับและรายงานเฉพาะภาพรวม ไม่เปิดเผยคำตอบรายบุคคลต่อเพื่อนร่วมงานหรือในรายงานผล</li>
          <li>ส่วนข้อเสนอแนะสามารถแสดงความคิดเห็นเพิ่มเติมได้ โดยไม่ต้องระบุชื่อหรือข้อมูลส่วนตัว</li>
          <li>หลังส่งคำตอบ คุณจะดูได้ว่าเพื่อนร่วมฝ่ายหรือสาขาทำแบบสำรวจแล้วหรือยัง โดยไม่เห็นคำตอบของกันและกัน</li>
        </ol>
        <div className="nav-actions"><button onClick={() => setInstructionsRead(true)}>เข้าใจแล้ว เริ่มตอบแบบสำรวจ <ArrowRight size={18} /></button></div>
      </section>
    </main>
  );

  return (
    <main className="page-shell">
      <header className="survey-header">
        <div>
          <div className="brand-pill">Employee Happiness Survey</div>
          <h1 ref={sectionHeading} tabIndex={-1}>{currentSection.title}</h1>
          <p>{currentSection.subtitle}</p>
        </div>
        <div className="user-card">
          <strong>{employee.name || employee.empId}</strong>
          <span>
  {employee.department || "ไม่ระบุแผนก"}
  {employee.division ? ` • ${employee.division}` : ""}
</span>
        </div>
      </header>

      <div className="progress-wrap">
        <div className="progress-top">
          <span>ความคืบหน้า</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
      </div>

      <section className="question-card">
        <div className="section-count">หน้าที่ {step + 1} / {sections.length}</div>

        {currentSection.questions
 .filter((q) => !q.hqOnly || isHQ)
  .map((q, index) => (
          <div className="question-block" key={q.id}>
            <h3>{index + 1}. {q.text}</h3>

            {q.type === "scale" ? (
              <div className="scale-grid">
                {[1, 2, 3, 4, 5, 6].map(value => (
                  <label className={`scale-choice ${answers[q.id] === value ? "active" : ""}`} data-score={value} key={value}>
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === value}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: value }))}
                    />
                    <span className="score">{value}</span>
                    <span className="label">{scaleLabels[value - 1]}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                placeholder="พิมพ์คำตอบของคุณ..."
                maxLength={4000}
                value={q.id === "open01" ? open01 : open02}
                onChange={e => q.id === "open01" ? setOpen01(e.target.value) : setOpen02(e.target.value)}
              />
            )}
          </div>
        ))}

        {submitError && <div className="error">{submitError}</div>}

        <div className="nav-actions">
          <button className="secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={18} /> ย้อนกลับ
          </button>

          {step < sections.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canGoNext()}>
              ถัดไป <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={submit} disabled={loading}>
              {loading ? "กำลังส่ง..." : "ส่งคำตอบ"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
