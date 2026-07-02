-- ============================================================
-- RNP Dashboard — ma'lumotlar bazasi sxemasi
-- Supabase -> SQL Editor da bir marta ishga tushiring.
-- ============================================================

-- 1) Profiles — Supabase Auth foydalanuvchilariga bog'langan
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  login text not null unique,
  role text not null default 'salesperson' check (role in ('admin', 'salesperson')),
  created_at timestamptz not null default now()
);

-- 2) Marketing kunlik (1-jadval) — oyning har kuni uchun bitta qator
create table if not exists public.marketing_daily (
  id uuid primary key default gen_random_uuid(),
  month text not null,                        -- 'YYYY-MM'
  day int not null check (day between 1 and 31),
  byudjet numeric not null default 0,
  sifatli int not null default 0,
  jami_lead int not null default 0,
  sotuv int not null default 0,
  updated_at timestamptz not null default now(),
  unique (month, day)
);

-- 3) Reja sozlamalari — har oy uchun bitta qator
create table if not exists public.plan_settings (
  month text primary key,                     -- 'YYYY-MM'
  plan_byudjet numeric not null default 0,
  plan_lead numeric not null default 0,
  plan_sotuv numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- 4) Hodim kunlik (2-jadval drill-down) — har hodim/kun uchun bitta qator
create table if not exists public.employee_daily (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,                        -- 'YYYY-MM'
  day int not null check (day between 1 and 31),
  gaplashgan int not null default 0,
  sifatli int not null default 0,
  aniqlanmagan int not null default 0,
  sotilgan_mijoz int not null default 0,
  sotilgan_mahsulot int not null default 0,
  tushum numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id, month, day)
);

-- ============================================================
-- Row Level Security (RLS)
-- Autentifikatsiya qilingan foydalanuvchi o'qiy oladi; yozishni
-- server action'lar (admin/egalik tekshiruvi bilan) boshqaradi.
-- Hodim qo'shish/o'chirish service-role bilan RLS'ni chetlab o'tadi.
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.marketing_daily enable row level security;
alter table public.plan_settings   enable row level security;
alter table public.employee_daily  enable row level security;

-- O'qish (barcha autentifikatsiya qilingan foydalanuvchilar)
drop policy if exists "read profiles"        on public.profiles;
drop policy if exists "read marketing"       on public.marketing_daily;
drop policy if exists "read plan"            on public.plan_settings;
drop policy if exists "read employee_daily"  on public.employee_daily;

create policy "read profiles"        on public.profiles        for select to authenticated using (true);
create policy "read marketing"       on public.marketing_daily for select to authenticated using (true);
create policy "read plan"            on public.plan_settings    for select to authenticated using (true);
create policy "read employee_daily"  on public.employee_daily   for select to authenticated using (true);

-- Yozish (data jadvallariga; server action'lar rolni tekshiradi)
drop policy if exists "write marketing"      on public.marketing_daily;
drop policy if exists "write plan"           on public.plan_settings;
drop policy if exists "write employee_daily" on public.employee_daily;

create policy "write marketing"      on public.marketing_daily for all to authenticated using (true) with check (true);
create policy "write plan"           on public.plan_settings    for all to authenticated using (true) with check (true);
create policy "write employee_daily" on public.employee_daily   for all to authenticated using (true) with check (true);

-- ============================================================
-- Tayyor. Endi ilovaga /login orqali kiring:
--   Login: admin
--   Parol: admin12345
-- (birinchi ochilishда avtomatik yaratiladi — keyin parolni almashtiring)
-- ============================================================
