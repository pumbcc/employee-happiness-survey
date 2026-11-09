"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, LoaderCircle, Smile } from "lucide-react";

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
            <div className="campaign-input-wrap"><input id="campaign-employee-id" name="empId" value={empId} onChange={event => onEmpIdChange(event.target.value)} placeholder="กรอกรหัสพนักงาน" autoComplete="username" required disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? "campaign-login-error" : undefined} /><span aria-hidden="true">↗</span></div>
            {error && <div id="campaign-login-error" className="error" role="alert">{error}</div>}
            <button className="campaign-start" type="submit" disabled={loading}><span>{loading ? "กำลังตรวจสอบ..." : "เริ่มทำแบบสำรวจ"}</span><span className="start-arrow">{loading ? <LoaderCircle className="campaign-spinner" size={21} aria-hidden="true" /> : <ArrowRight size={23} aria-hidden="true" />}</span></button>
          </form>
          <div className="campaign-dates"><CalendarDays size={18} aria-hidden="true" /><span>9–20 พฤศจิกายน 2569</span></div>
        </div>

        <div className="campaign-art">
          <div className="campaign-orbit" aria-hidden="true" />
          <div className="campaign-layers">
            <Image className="campaign-lettering" src="/images/happiness-lettering.png" width={1080} height={1350} alt="" aria-hidden="true" priority sizes="(max-width: 760px) 88vw, 550px" />
            <Image className="campaign-person" src="/images/happiness-person.png" width={1080} height={1350} alt="พนักงานยิ้มแย้ม ร่วมแคมเปญสำรวจความสุขและความผูกพัน" priority sizes="(max-width: 760px) 88vw, 550px" />
          </div>
          <div className="campaign-sticker" aria-hidden="true"><Smile size={36} strokeWidth={1.4} /><span>HAPPINESS<br />STARTS WITH YOU</span></div>
        </div>
      </section>

    </main>
  );
}
