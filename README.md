# Employee Happiness Survey

ระบบแบบฟอร์มสำรวจความสุขพนักงาน ใช้ Next.js + Supabase + GitHub + Vercel

## วิธีใช้งาน
1. สร้าง Supabase Project
2. เปิด SQL Editor แล้ววางไฟล์ `supabase/schema.sql`
3. เพิ่มรายชื่อพนักงานในตาราง `employees`
4. copy `.env.example` เป็น `.env.local`
5. ใส่ค่า SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PIN
6. รัน

```bash
npm install
npm run dev
```

หน้าแบบฟอร์ม: http://localhost:3000  
หน้า Admin: http://localhost:3000/admin

## Deploy
Push ขึ้น GitHub แล้ว Import Project เข้า Vercel  
จากนั้นใส่ Environment Variables ใน Vercel ให้เหมือน `.env.local`

## Team progress and private results

- After submission (including a later login), employees see only names and completion status for active colleagues with the **same department and division**. These fields represent the business unit plus the employee's department/branch. Missing scope fails closed to that employee alone.
- `/api/team` and `/api/submit` require an HTTP-only, signed employee cookie; submission identity comes from that cookie, not a request-body employee ID. Sessions expire after eight hours. The existing employee-ID-only entry method remains; knowing another person's ID is not proof of identity, so stronger verification is needed if that threat must be prevented.
- Responses remain linked to employee IDs in the restricted database, as requested. Do not describe the survey as irreversibly anonymous. The public notice promises confidentiality and aggregate reporting.
- `/api/admin/summary` uses the existing `ADMIN_PIN`, returns aggregates only, and never serializes employee IDs, names, free-text answers, or individual response rows. Scores are suppressed below five respondents, per group/question. Participation counts remain visible to the owner.
- The separate results frontend is `results-site/`, run locally with `node results-site/local-server.cjs` or double-click `results-site/เปิดผลสำรวจ.command`. It binds only to `127.0.0.1:3035`. It needs no database credentials or hosting project. The local server forwards the Admin PIN over HTTPS to the survey's aggregate endpoint; it never saves/logs the PIN. Internet access is required for live data.
- Cross-origin browser access to the report endpoint is denied. The localhost server validates Host and Origin and forwards only the fixed report request, so it cannot act as a general proxy. The PIN stays in page memory and is cleared on logout/reload. No cloud results website is deployed.

## Validation

```sh
node --test tests/security.test.cjs tests/integration.test.cjs
```

Build first for the integration tests. The integration tests run the real app handlers against a local in-memory Supabase fixture; they never access production data. `node tests/preview-server.cjs` serves a local UI preview at `http://127.0.0.1:3030` and a test-only private dashboard at `/private/`.
