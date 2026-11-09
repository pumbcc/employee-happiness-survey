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
- The separate results frontend is `results-site/`. Deploy it as an **Other / static** Vercel project, root directory `results-site`, output `.`. It does not need database credentials or new environment variables; the Admin PIN is sent over HTTPS to the survey's protected aggregate endpoint. The owner PIN is held in page memory only and cleared on logout/reload.
- The allowed report origin is `https://employee-happiness-results.vercel.app`. Update it in the server endpoint and frontend links together if the results domain changes. No employee-facing link is added to the private results site.

## Validation

```sh
node --test tests/security.test.cjs tests/integration.test.cjs
```

Build first for the integration tests. The integration tests run the real app handlers against a local in-memory Supabase fixture; they never access production data. `node tests/preview-server.cjs` serves a local UI preview at `http://127.0.0.1:3030` and a test-only private dashboard at `/private/`.
