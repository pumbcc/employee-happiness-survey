create extension if not exists "pgcrypto";

create table if not exists employees (
  emp_id text primary key,
  name text,
  department text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  emp_id text not null references employees(emp_id),
  answers jsonb not null,
  open_answer_1 text,
  open_answer_2 text,
  average_score numeric(4,2),
  created_at timestamptz default now(),
  unique(emp_id)
);

create index if not exists responses_created_at_idx on responses(created_at desc);
create index if not exists responses_answers_gin_idx on responses using gin(answers);

-- ตัวอย่างข้อมูลพนักงาน ลบทิ้ง/แก้ไขได้
insert into employees (emp_id, name, department)
values
  ('10001', 'Demo User 1', 'HR'),
  ('10002', 'Demo User 2', 'Operations'),
  ('10003', 'Demo User 3', 'Marketing')
on conflict (emp_id) do nothing;

-- หมายเหตุ:
-- โปรเจกต์นี้ใช้ Supabase Service Role ผ่าน Next.js API Route เท่านั้น
-- ไม่ควรนำ SUPABASE_SERVICE_ROLE_KEY ไปใช้ในฝั่ง client/browser
