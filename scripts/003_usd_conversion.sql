-- ============================================================
-- RNP Dashboard — 003: pul birligini so'mdan dollarga o'tkazish
-- Ilova endi barcha summalarni DOLLARDA saqlaydi va ko'rsatadi.
-- Bu migratsiya AVVAL so'mda kiritilgan mavjud qiymatlarni dollarga aylantiradi.
--
-- FAQAT eski (so'mli) ma'lumotlar bo'lgan bazada ishlatiladi.
-- Yangi/bo'sh o'rnatishlarda buni ishlatish SHART EMAS.
--
-- XAVFSIZ: skript o'zini himoyalaydi — bir marta bajarilgach, qayta ishga
-- tushirilsa hech narsa qilmaydi (qiymatlar ikki marta bo'linib ketmaydi).
--
-- MUHIM: quyidagi `rate` qiymatini o'sha ma'lumotlar kiritilgan davrdagi
-- Markaziy bank kursiga o'zgartiring (masalan 11910).
-- ============================================================

-- Qo'llanilgan migratsiyalarni belgilaydigan jadval (idempotentlik uchun)
create table if not exists public._migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

do $$
declare
  rate numeric := 11910;  -- <-- shu yerga o'sha davrdagi CBU kursini qo'ying
begin
  -- Allaqachon bajarilgan bo'lsa — hech narsa qilmaymiz
  if exists (select 1 from public._migrations where name = '003_usd_conversion') then
    raise notice '003_usd_conversion allaqachon qo''llanilgan — o''tkazib yuborildi';
    return;
  end if;

  -- Sotuvchilar tushumi (so'm -> dollar)
  update public.employee_daily
    set tushum = round(tushum / rate, 2)
    where tushum <> 0;

  -- Marketing byudjeti (so'm -> dollar)
  update public.marketing_daily
    set byudjet = round(byudjet / rate, 2)
    where byudjet <> 0;

  -- Eslatma: plan_settings.plan_byudjet allaqachon "$" sifatida kiritilgan
  -- deb hisoblanadi (dialogda "Reja Byudjet ($)" deb belgilangan), shuning
  -- uchun u aylantirilmaydi. Agar u ham so'mda kiritilgan bo'lsa, quyidagi
  -- qatorni izohdan chiqaring:
  -- update public.plan_settings set plan_byudjet = round(plan_byudjet / rate, 2) where plan_byudjet <> 0;

  -- Migratsiya qo'llanilganini belgilaymiz
  insert into public._migrations (name) values ('003_usd_conversion');
end $$;
