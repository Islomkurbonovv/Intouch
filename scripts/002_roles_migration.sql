-- ============================================================
-- RNP Dashboard — 002: "Bosh admin" (super_admin) rolini qo'shish
-- MAVJUD bazasi uchun. Supabase -> SQL Editor da bir marta ishga tushiring.
-- (Yangi o'rnatishlarda 001_init.sql yetarli — buni ishlatish shart emas.)
-- ============================================================

-- 1) Eski rol cheklovini olib tashlab, uch rolli yangisini qo'yamiz
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'salesperson'));

-- 2) Mavjud "admin" loginli hisobni Bosh adminga ko'taramiz
update public.profiles set role = 'super_admin' where login = 'admin';
