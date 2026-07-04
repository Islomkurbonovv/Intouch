-- ============================================================
-- RNP Dashboard — 007: eski "rnp_storage" jadvalini qulflash (XAVFSIZLIK)
-- rnp_storage — ilovaning eski (relational jadvallardan oldingi) KV-store'i.
-- Joriy kodda umuman ishlatilmaydi, lekin unda "public" (hatto anonim)
-- INSERT/UPDATE/SELECT siyosatlari bor edi — spam/suiiste'mol yo'li.
-- Ma'lumotga tegmaymiz; faqat RLS'ni yoqib, barcha ochiq siyosatlarni
-- olib tashlaymiz. Endi faqat service-role kira oladi.
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'rnp_storage') then
    execute 'alter table public.rnp_storage enable row level security';
    execute 'drop policy if exists "Allow public read"   on public.rnp_storage';
    execute 'drop policy if exists "Allow public insert" on public.rnp_storage';
    execute 'drop policy if exists "Allow public update" on public.rnp_storage';
    execute 'drop policy if exists "Allow public delete" on public.rnp_storage';
    execute 'drop policy if exists "Allow public select" on public.rnp_storage';
  end if;
end $$;
