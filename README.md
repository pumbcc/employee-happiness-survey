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
