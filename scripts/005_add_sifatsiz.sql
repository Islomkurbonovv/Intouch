-- ============================================================
-- RNP Dashboard — 005: hodim kunlik natijasiga "sifatsiz" (sifatsiz lead) ustuni
-- Sotuvchilar endi sifatsiz lidlar sonini kiritadi; marketing jadvalidagi
-- "Sifatsiz" ustuni shu qiymatdan yig'iladi (avval jami_lead - sifatli edi).
-- Supabase -> SQL Editor da bir marta ishga tushiring.
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

alter table public.employee_daily
  add column if not exists sifatsiz int not null default 0;
