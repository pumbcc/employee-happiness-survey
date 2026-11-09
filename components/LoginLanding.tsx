"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, LoaderCircle, Smile, Sparkles } from "lucide-react";

type LoginLandingProps = {
  empId: string;
  onEmpIdChange: (value: string) => void;
  onStart: () => Promise<void>;
  loading: boolean;
  error: string;
};

export default function LoginLanding({ empId, onEmpIdChange, onStart, loading, error }: LoginLandingProps) {
  return (
    <main className="happiness-landing">
      <header className="campaign-header">
        <div className="campaign-brand"><Smile size={30} strokeWidth={1.6} aria-hidden="true" /><span>FOOD<span>PASSION</span></span></div>
        <div className="campaign-edition"><span className="edition-dot" /> EMPLOYEE HAPPINESS SURVEY <span className="edition-year">2026</span></div>
      </header>

      <section className="campaign-hero" aria-labelledby="campaign-title">
        <div className="campaign-copy">
          <div className="campaign-eyebrow"><span /> YOUR VOICE. OUR HAPPINESS.</div>
          <h1 id="campaign-title">แบบสำรวจความสุข<span>พนักงานและความผูกพัน</span><em>ประจำปี 2569<span className="title-spark" aria-hidden="true">✳</span></em></h1>
          <p className="campaign-english" lang="en">Employee Happiness Survey</p>
          <p className="campaign-invite">มาเช็กอุณหภูมิความสุขไปด้วยกัน<br />เพราะทุกเสียงของคุณ มีความหมายกับเรา</p>

          <form className="campaign-form" onSubmit={event => { event.preventDefault(); if (!loading) void onStart(); }} aria-busy={loading}>
            <label htmlFor="campaign-employee-id">รหัสพนักงานของคุณ</label>
            <div className="campaign-input-wrap"><input id="campaign-employee-id" name="empId" value={empId} onChange={event => onEmpIdChange(event.target.value)} placeholder="กรอกรหัสพนักงาน" autoComplete="username" required disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? "campaign-login-error" : "campaign-login-hint"} /><span aria-hidden="true">↗</span></div>
            {error && <div id="campaign-login-error" className="error" role="alert">{error}</div>}
            <button className="campaign-start" type="submit" disabled={loading}><span>{loading ? "กำลังตรวจสอบ..." : "เริ่มทำแบบสำรวจ"}</span><span className="start-arrow">{loading ? <LoaderCircle className="campaign-spinner" size={21} aria-hidden="true" /> : <ArrowRight size={23} aria-hidden="true" />}</span></button>
            <p id="campaign-login-hint" className="campaign-form-hint">ใช้รหัสพนักงานเพื่อเข้าสู่แบบสำรวจของคุณ</p>
          </form>
          <div className="campaign-dates"><CalendarDays size={18} aria-hidden="true" /><span>9–20 พฤศจิกายน 2569</span><span className="dates-divider" /><span>มาร่วมส่งเสียงไปด้วยกัน</span></div>
        </div>

        <div className="campaign-art">
          <div className="campaign-art-word" aria-hidden="true">HAPPY<br /><span>TOGETHER.</span></div>
          <div className="campaign-orbit" aria-hidden="true" />
          <div className="campaign-poster-frame"><Image src="/images/happiness-survey-2569.png" width={1080} height={1350} alt="โปสเตอร์ Employee Happiness Survey แบบสำรวจความสุขและความผูกพัน ประจำปี 2569 วันที่ 9–20 พฤศจิกายน" priority sizes="(max-width: 760px) 88vw, (max-width: 1100px) 43vw, 440px" /></div>
          <div className="campaign-sticker" aria-hidden="true"><Smile size={36} strokeWidth={1.4} /><span>HAPPINESS<br />STARTS WITH YOU</span></div>
          <div className="campaign-art-caption"><Sparkles size={17} aria-hidden="true" /><span>ความสุขของเรา เริ่มต้นจากเสียงของคุณ</span></div>
        </div>
      </section>

      <div className="campaign-ribbon" aria-hidden="true"><div className="campaign-ribbon-track">{[0, 1].map(copy => <span key={copy}>YOUR VOICE MATTERS <i>✳</i> HAPPY TOGETHER <i>✳</i> ทุกเสียงมีความหมาย <i>✳</i> EMPLOYEE HAPPINESS SURVEY <i>✳</i> </span>)}</div></div>
      <footer className="campaign-footer"><span>FOOD PASSION · PEOPLE & HAPPINESS</span><span>เติบโตไปด้วยกัน อย่างมีความสุข <span aria-hidden="true">↗</span></span></footer>
    </main>
  );
}
