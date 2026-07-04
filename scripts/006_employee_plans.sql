-- ============================================================
-- RNP Dashboard — 006: hodimlar uchun oylik tushum rejasi
-- Har bir hodimga har oy uchun daromad (tushum) rejasi qo'yiladi;
-- "Hodimlar natijalari" jadvalida bajarilish foizi ko'rsatiladi.
-- Supabase -> SQL Editor da bir marta ishga tushiring.
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

-- Menejer tekshiruvi (004 da aniqlangan). Jonli baza 004 dan oldingi bo'lishi
-- mumkin, shuning uchun bu migratsiya funksiyani o'zi ham ta'minlaydi.
create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin')
  );
$$;

grant execute on function public.is_manager() to authenticated;

create table if not exists public.employee_plans (
  employee_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,                        -- 'YYYY-MM'
  plan_tushum numeric not null default 0,     -- oylik daromad rejasi (USD)
  updated_at timestamptz not null default now(),
  primary key (employee_id, month)
);

-- ============================================================
-- RLS: barcha autentifikatsiya qilingan foydalanuvchilar o'qiy oladi
-- (hodim o'z rejasini ko'radi); faqat menejerlar yoza oladi.
-- ============================================================

alter table public.employee_plans enable row level security;

drop policy if exists "read employee_plans"  on public.employee_plans;
create policy "read employee_plans"  on public.employee_plans for select to authenticated using (true);

drop policy if exists "write employee_plans" on public.employee_plans;
create policy "write employee_plans" on public.employee_plans for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
