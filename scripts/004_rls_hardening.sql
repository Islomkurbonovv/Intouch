-- ============================================================
-- RNP Dashboard — 004: RLS mustahkamlash (XAVFSIZLIK)
-- Supabase -> SQL Editor da bir marta ishga tushiring.
--
-- MUAMMO: 001_init.sql dagi yozish siyosatlari
--   (for all to authenticated using(true) with check(true))
-- har qanday tizimga kirgan foydalanuvchiga (jumladan sotuvchiga) to'g'ridan-
-- to'g'ri (brauzerdagi ochiq anon key orqali) byudjet/reja/boshqa hodim
-- ma'lumotlarini o'zgartirishga imkon beradi. Server action'lardagi rol
-- tekshiruvlari bu yo'lni to'smaydi.
--
-- YECHIM: rolni bazaning o'zida (RLS) tekshiramiz. Legitim menejer/egalar
-- ilova orqali baribir ishlayveradi; service-role (hodim qo'shish/o'chirish)
-- RLS'ni chetlab o'tadi, shuning uchun u ham ta'sirlanmaydi.
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

-- Joriy foydalanuvchi menejer (super_admin/admin) ekanini aniqlaydi.
-- SECURITY DEFINER — profiles RLS'iga rekursiya qilmasligi uchun.
create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
  );
$$;

grant execute on function public.is_manager() to authenticated;

-- 1) Marketing byudjeti — faqat menejerlar yoza oladi
drop policy if exists "write marketing" on public.marketing_daily;
create policy "write marketing" on public.marketing_daily
  for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- 2) Reja sozlamalari — faqat menejerlar yoza oladi
drop policy if exists "write plan" on public.plan_settings;
create policy "write plan" on public.plan_settings
  for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- 3) Hodim kunlik natijalari — menejer yoki qatorning egasi (o'zi) yoza oladi
drop policy if exists "write employee_daily" on public.employee_daily;
create policy "write employee_daily" on public.employee_daily
  for all to authenticated
  using (public.is_manager() or employee_id = auth.uid())
  with check (public.is_manager() or employee_id = auth.uid());

-- Eslatma: "read ..." siyosatlari (SELECT, using(true)) o'zgarmaydi — barcha
-- tizimga kirganlar o'qiy oladi. Yuqoridagi "write" siyosatlari faqat
-- INSERT/UPDATE/DELETE uchun kuchга kiradi.
-- ============================================================
