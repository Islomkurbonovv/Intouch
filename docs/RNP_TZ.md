# RNP Dashboard — Texnik Topshiriq (ТЗ)

> **Loyiha:** RNP Dashboard — marketing va sotuv natijalari boshqaruv paneli
> **Hujjat turi:** Texnik topshiriq (Texnicheskoye zadaniye / ТЗ)
> **Versiya:** 1.0 · **Sana:** 2026-07-05
> **Repozitoriy:** github.com/Islomkurbonovv/Intouch · **Muhit:** Vercel (`intouch-phi.vercel.app`) + Supabase
> **Til:** interfeys to'liq o'zbek (lotin) · **Valyuta:** USD (baza)

---

## Mundarija

1. [Umumiy ma'lumot va arxitektura](#1-umumiy-malumot-va-arxitektura)
2. [Maqsad va vazifalar](#2-maqsad-va-vazifalar)
3. [Foydalanuvchilar, rollar va autentifikatsiya](#3-foydalanuvchilar-rollar-va-autentifikatsiya)
4. [Funksional talablar](#4-funksional-talablar) — 4.1 Kunlik Ma'lumotlar · 4.2 Hodimlar natijalari · 4.3 Hodim rejalari · 4.4 Qo'shimcha funksiyalar
5. [Ma'lumotlar modeli (ma'lumotlar bazasi)](#5-malumotlar-modeli-malumotlar-bazasi)
6. [Biznes-mantiq — formulalar jamlanmasi](#6-biznes-mantiq--formulalar-jamlanmasi)
7. [Nofunksional talablar](#7-nofunksional-talablar)
8. [Lug'at](#8-lugat)

---



## 1. Umumiy ma'lumot va arxitektura

### 1.1. Loyiha maqsadi va qisqacha tavsifi

**RNP Dashboard** — marketing va sotuv natijalarini kunlik hamda oylik kesimda kuzatib borish, rejalar bilan solishtirish va Excel'ga eksport qilish uchun mo'ljallangan ichki boshqaruv paneli (dashboard). Panel `app/layout.tsx` metadata'sida `title: "RNP Dashboard"`, `description: "Marketing va sotuv natijalari boshqaruv paneli"` deb belgilangan.

Tizim uchta asosiy ish yo'nalishini birlashtiradi:

- **Kunlik marketing ma'lumotlari** (`Kunlik Ma'lumotlar` tabi) — byudjet, sifatli/sifatsiz va jami leadlar, sotuvlar.
- **Hodimlar natijalari** (`Hodimlar natijalari` tabi) — har bir sotuvchining gaplashgan mijozlar, sifatli/sifatsiz/aniqlanmagan qo'ng'iroqlar, sotilgan mijoz/mahsulot va tushumi.
- **Hodimlarni boshqarish** (`Hodimlar` tabi) — faqat menejerlar uchun; foydalanuvchilarni yaratish/o'chirish.

Interfeys to'liq o'zbek (lotin) tilida. Ilova `<html lang="uz">` bilan render qilinadi. Butun UI matni (tab nomlari, tugmalar, xatolik xabarlari) o'zbek tilida — masalan, `"Kirish"`, `"Eksport"`, `"Reja sozlamalari"`, `"Hodim rejalari"`, `"Login yoki parol noto'g'ri"`.

Barcha pul summalari **USD (dollar)** bazasida saqlanadi; so'mda kiritilgan qiymatlar faqat kiritish paytida Markaziy Bank (MB) kursi bo'yicha USD'ga o'giriladi (batafsil 1.6-bo'limda).

### 1.2. Texnologiyalar to'plami

Versiyalar `package.json` fayldan olingan.

| Toifa | Texnologiya | Versiya |
|---|---|---|
| Freymvork | `next` (App Router) | `16.2.6` |
| UI kutubxonasi | `react`, `react-dom` | `^19` |
| Til | `typescript` | `5.7.3` |
| Autentifikatsiya / ma'lumotlar bazasi | `@supabase/ssr` | `^0.12.0` |
| Supabase JS SDK | `@supabase/supabase-js` | `^2.110.0` |
| Stillar | `tailwindcss` + `@tailwindcss/postcss` | `^4.2.0` |
| UI komponentlar bazasi | `@base-ui/react`, `shadcn` | `^1.5.0`, `^4.8.0` |
| Ikonkalar | `lucide-react` | `^1.16.0` |
| Mavzu (dark/light) | `next-themes` | `^0.4.6` |
| Toast bildirishnomalari | `sonner` | `^2.0.7` |
| Excel eksport | `xlsx` | `^0.18.5` |
| Class utilitalar | `class-variance-authority`, `clsx`, `tailwind-merge` | `^0.7.1`, `^2.1.1`, `^3.3.1` |
| Analitika | `@vercel/analytics` | `1.6.1` |

Paket menejeri sifatida **pnpm** ishlatiladi (`pnpm-lock.yaml`, `package.json`'dagi `pnpm.overrides`). Shriftlar `next/font/google` orqali yuklanadi: **Geist** (`--font-geist-sans`) va **Geist Mono** (`--font-geist-mono`).

**Muhim sozlamalar** (`next.config.mjs`):
- `typescript.ignoreBuildErrors: true` — TypeScript xatolari build'ni to'xtatmaydi.
- `images.unoptimized: true` — Next.js rasm optimizatsiyasi o'chirilgan.

`tsconfig.json`'da `strict: true`, `moduleResolution: "bundler"`, va `@/*` alias loyiha ildiziga (`./*`) yo'naltirilgan.

### 1.3. Umumiy arxitektura

Ilova Next.js **App Router** asosida qurilgan va quyidagi arxitektura tamoyillariga tayanadi:

- **Server Components** — asosiy sahifa (`app/page.tsx`) `async` server komponent bo'lib, ma'lumotlarni to'g'ridan-to'g'ri serverda Supabase'dan o'qiydi va faqat tayyor ma'lumotni klient komponentga (`Dashboard`) uzatadi.
- **Server Actions** (`"use server"`) — mutatsiyalar va autentifikatsiya operatsiyalari server actionlar orqali bajariladi: `app/actions/auth.ts` (login, logout, seed-admin) va `app/actions/data.ts`.
- **Supabase Auth** — sessiyalar cookie asosida saqlanadi (`@supabase/ssr`). Loginlar foydalanuvchi nomi (username) sifatida qabul qilinadi va ichki elektron pochtaga o'giriladi: `loginToEmail(login)` → `${login}@rnp.local` (konstanta `EMAIL_DOMAIN = "rnp.local"`, `lib/rnp.ts`).
- **RLS (Row Level Security)** — ma'lumotlarga kirish Supabase tomonida RLS siyosatlari bilan boshqariladi. Server client anon key bilan ishlaydi (foydalanuvchi sessiyasi kontekstida), imtiyozli operatsiyalar esa alohida service-role client orqali (1.7-bo'lim).

**Supabase clientlarining uch turi:**

| Fayl | Funksiya | Vazifasi | Kalit |
|---|---|---|---|
| `lib/supabase/server.ts` | `createClient()` | Server Component / Server Action'da foydalanuvchi sessiyasi bilan o'qish-yozish; cookie'larni `next/headers` orqali boshqaradi | `ANON_KEY` |
| `lib/supabase/client.ts` | `createClient()` | Brauzer (klient komponent) uchun `createBrowserClient` | `ANON_KEY` |
| `lib/supabase/admin.ts` | `createServiceClient()` | Imtiyozli amallar (auth foydalanuvchi yaratish/o'chirish); `autoRefreshToken: false`, `persistSession: false`. Izohda ta'kidlangan: **hech qachon klient komponentga import qilinmasin** | `SERVICE_ROLE_KEY` |

**Sessiya yangilash (middleware):** `middleware.ts` har bir so'rovda `lib/supabase/proxy.ts`'dagi `updateSession(request)` funksiyasini chaqiradi. Bu funksiya:
1. Supabase sessiya cookie'larini yangilaydi (`supabase.auth.getUser()`).
2. Marshrutlarni himoya qiladi:
   - Foydalanuvchi tizimga kirmagan va `/login`'da bo'lmasa → `/login`'ga yo'naltiradi.
   - Foydalanuvchi tizimga kirgan va `/login`'da bo'lsa → `/` (dashboard)'ga yo'naltiradi.

Middleware `matcher` orqali statik fayllar (`_next/static`, `_next/image`, `favicon.ico`) va rasm kengaytmalari (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`) bundan chiqarib tashlangan.

**Rollar (Role)** — `lib/rnp.ts`'da uch rol aniqlangan:

| Rol (`Role`) | O'zbekcha nomi (`roleLabel`) | Vakolat |
|---|---|---|
| `super_admin` | Bosh admin | Menejer — barcha ma'lumotni ko'radi va boshqaradi |
| `admin` | Admin | Menejer — barcha ma'lumotni ko'radi va boshqaradi |
| `salesperson` | Sotuvchi | Faqat o'z natijalarini ko'radi/kiritadi |

`isManagerRole(role)` funksiyasi `super_admin` yoki `admin` bo'lsa `true` qaytaradi — bu qiymat `Hodimlar` tabini, `Reja sozlamalari` va `Hodim rejalari` tugmalarini hamda tahrirlash huquqini boshqaradi.

### 1.4. Asosiy sahifalar / marshrutlar

| Marshrut | Fayl | Turi | Tavsif |
|---|---|---|---|
| `/login` | `app/login/page.tsx` | Server Component | Kirish sahifasi. Render'dan oldin `ensureSeedAdmin()` chaqiriladi (dastlabki admin yaratish). `LoginForm` (`components/login-form.tsx`) formasi orqali `login` server action ishga tushadi |
| `/` | `app/page.tsx` | Server Component | Asosiy dashboard. Autentifikatsiyani tekshiradi, ma'lumotni o'qiydi va `Dashboard` komponentini render qiladi |

`/` sahifasi URL query parametrlarini qabul qiladi (`searchParams`):
- `view` — `"yearly"` bo'lsa yillik ko'rinish (aks holda oylik).
- `year` — 4 xonali yil (`/^\d{4}$/`); noto'g'ri bo'lsa joriy yil (`currentYear()`).
- `month` — `YYYY-MM` format (`/^\d{4}-\d{2}$/`); noto'g'ri bo'lsa joriy oy (`currentMonth()`).

**Yuklanish holati:** `app/loading.tsx` — dashboard marshruti qayta yuklanayotganda (masalan, oy/davr almashtirilganda) ko'rsatiladigan skeleton (header, ~8 ta KPI joyi va jadval joyi). Bu faqat markup — ma'lumot o'qimaydi.

**Login sahifasi UI'si:** RNP Dashboard logotipi (`BarChart3` ikonkasi), sarlavha, `"Boshqaruv paneliga kirish"` matni va `LoginForm` (Login/Parol maydonlari, `"Kirish"` tugmasi). Xatolikda `"Login yoki parol noto'g'ri"` yoki `"Login va parolni kiriting"` xabari chiqadi.

### 1.5. Ma'lumot oqimi (data flow)

Ma'lumot serverda o'qilib, tayyor holda klient komponentga uzatiladi. `app/page.tsx` oqimi:

1. **Autentifikatsiya:** `getCurrentProfile()` (`lib/auth.ts`) joriy foydalanuvchi `profiles` yozuvini o'qiydi; `null` bo'lsa `redirect("/login")`.
2. **Kurs so'rovi (parallel):** `getUsdRate()` promise'i ishga tushiriladi (natijasi keyin `await` qilinadi).
3. **Supabase'dan o'qish** (`createClient()`, `Promise.all` bilan parallel):
   - **Oylik ko'rinishda** quyidagi jadvallar o'qiladi:

     | Jadval | Filtr / tartib |
     |---|---|
     | `profiles` | `order("created_at")` — barcha hodimlar |
     | `marketing_daily` | `eq("month", month).order("day")` |
     | `plan_settings` | `eq("month", month).maybeSingle()` |
     | `employee_daily` | `eq("month", month).order("day")` |
     | `employee_plans` | `eq("month", month)` |

   - **Yillik ko'rinishda** faqat `profiles`, `marketing_daily` va `employee_daily` o'qiladi, `like("month", "${year}-%")` filtri bilan; `plan_settings` va `employee_plans` o'qilmaydi.
4. **Kunlarni filtrlash:** `inMonth()` yordamchi funksiyasi `marketing` va `employee_daily` qatorlaridan `day` qiymati o'sha oyning haqiqiy kun sonidan (`daysInMonth(month)`) oshib ketganlarini olib tashlaydi — ikkala jadval bir xil kun to'plami ustidan agregatlashishi uchun.
5. **Render:** barcha ma'lumot va `usdRate` `<Dashboard>` klient komponentiga prop sifatida uzatiladi.

**Klient tomonda (`components/dashboard.tsx`):**
- `isManagerRole(profile.role)` orqali menejer huquqlari aniqlanadi.
- Faqat `salesperson` rolli hodimlar (`salespeople`) va ularga tegishli `employee_daily` qatorlari (`salesEmployeeDaily`) filtrlanadi — menejerlarning shaxsiy kunlik yozuvlari marketing KPI'larini "shishirmasligi" uchun ikkala tab bir xil to'plamdan agregatlashadi.
- Uch tab: `Kunlik Ma'lumotlar` (`MarketingTable`), `Hodimlar natijalari` (`EmployeeResults`), va faqat menejerlar uchun `Hodimlar` (`EmployeesManager`).
- **Eksport:** `Eksport` tugmasi `exportWorkbook()` (`lib/export.ts`) orqali Excel fayl yaratadi; muvaffaqiyatda `"Excel fayli yuklab olindi"`, xatolikda `"Eksport qilishda xatolik"` toast'i chiqadi.

Ma'lumotlar bazasi asosiy jadvallari (`lib/rnp.ts` tiplaridan):

- **`profiles`**: `id`, `name`, `login`, `role`, `created_at`.
- **`marketing_daily`**: `id`, `month`, `day`, `byudjet`, `sifatli`, `sifatsiz`, `jami_lead`, `sotuv`.
- **`plan_settings`**: `month`, `plan_byudjet`, `plan_lead`, `plan_sotuv`.
- **`employee_daily`**: `id`, `employee_id`, `month`, `day`, `gaplashgan`, `sifatli`, `sifatsiz`, `aniqlanmagan`, `sotilgan_mijoz`, `sotilgan_mahsulot`, `tushum`.
- **`employee_plans`**: `employee_id`, `month`, `plan_tushum`.

### 1.6. Valyuta modeli

Butun pul modeli `lib/rnp.ts` va `lib/cbu.ts`'da joylashgan.

**Asosiy tamoyil:** barcha summalar bazada **USD** (baza valyutasi)da saqlanadi va ko'rsatiladi. MB (Markaziy Bank) kursi faqat so'mda kiritilgan summani kiritish paytida USD'ga o'girish uchun ishlatiladi.

**Konvertatsiya funksiyalari:**

| Funksiya | Formula / xatti-harakat |
|---|---|
| `somToUsd(som, rate)` | **USD = So'm ÷ Kurs** (kurs 0 bo'lsa 0 qaytaradi) |
| `toUsd(amount, from, rate)` | `from === "UZS"` bo'lsa `somToUsd(amount, rate)`, aks holda summa o'zgarishsiz (`USD`) |
| `fmtUsd(usd)` | `$` bilan formatlash: `"$1,234.56"` (KPI kartalari va jamilar uchun) |
| `fmtUsdPlain(usd)` | Belgisi'z: `"1,234.56"` (jadval katakchalari uchun) |

Kiritish valyutasi tipi: `InputCurrency = "USD" | "UZS"` (`components/money-currency-toggle.tsx` orqali almashtiriladi).

**MB kursini olish (`lib/cbu.ts`, `getUsdRate()`):**
- Manba: `https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/` (ochiq, autentifikatsiyasiz).
- **Timeout:** `AbortController` orqali **3 soniya** (`setTimeout(() => controller.abort(), 3000)`) — sekin yoki ishlamaydigan cbu.uz sahifa render'ini bloklamasligi uchun.
- **Kesh:** `next: { revalidate: 86400 }` — **24 soat (86400 soniya)**, chunki kurs kuniga ko'pi bilan bir marta o'zgaradi.
- **Xatolikda xulq:** javob muvaffaqiyatsiz, kurs yaroqsiz yoki so'rov uzilsa **0** qaytaradi (chaqiruvchilar 0'ni "kurs noma'lum" deb qabul qiladi).

Dashboard header'ida kurs mavjud bo'lsa (`usdRate` ≠ 0) quyidagi yozuv ko'rsatiladi: `"Barcha summalar dollarda · MB kursi 1$ = {kurs} so'm"` (`fmt(usdRate)` bilan ming ajratgichli formatda).

### 1.7. Deploy va muhit o'zgaruvchilari (env-var)

**Deploy:** loyiha **Vercel** platformasida joylashtirilgan. GitHub repozitoriysi — **Islomkurbonovv/Intouch**, ishlab chiqarish (production) manzili — **intouch-phi.vercel.app**. Ishlab chiqarish rejimida (`process.env.NODE_ENV === "production"`) `@vercel/analytics` `<Analytics />` komponenti faollashadi (`app/layout.tsx`).

**Muhit o'zgaruvchilari:**

| O'zgaruvchi | Turi | Ishlatilishi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Barcha Supabase clientlar (server, client, admin) uchun loyiha URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Server va brauzer clientlar (foydalanuvchi sessiyasi, RLS ostida) |
| `SUPABASE_SERVICE_ROLE_KEY` | Maxfiy (server) | Service-role client (`createServiceClient`) — imtiyozli amallar |
| `SEED_ADMIN_LOGIN` | Maxfiy (server) | Dastlabki bosh admin logini |
| `SEED_ADMIN_PASSWORD` | Maxfiy (server) | Dastlabki bosh admin paroli |

**Seed-admin xavfsizligi (`app/actions/auth.ts`, `ensureSeedAdmin()`):**
- Kredensiallar **faqat** server env-var'laridan olinadi, hech qachon kodda qattiq yozilmaydi.
- `SEED_ADMIN_LOGIN` yoki `SEED_ADMIN_PASSWORD` o'rnatilmagan bo'lsa (yoki parol 8 belgidan qisqa bo'lsa) funksiya **hech narsa qilmaydi** (no-op) — shu tariqa ochiq marshrut hech qachon standart hisobni avtomatik yaratmaydi.
- Agar allaqachon biror menejer (`super_admin` yoki `admin`) mavjud bo'lsa, funksiya to'xtaydi.
- Aks holda service-role client orqali `email_confirm: true` bilan auth foydalanuvchi va `role: "super_admin"` rolli `profiles` yozuvi yaratiladi.

**Muhim fayllar:**
- `/Users/m2air/Desktop/RNP/Intouch/app/page.tsx` — asosiy server data-fetch
- `/Users/m2air/Desktop/RNP/Intouch/components/dashboard.tsx` — asosiy klient UI
- `/Users/m2air/Desktop/RNP/Intouch/lib/rnp.ts` — tiplar, rollar, valyuta va sana yordamchilari
- `/Users/m2air/Desktop/RNP/Intouch/lib/cbu.ts` — MB kursi (3s timeout, 24s kesh)
- `/Users/m2air/Desktop/RNP/Intouch/lib/supabase/{server,client,admin,proxy}.ts` — Supabase clientlar va sessiya
- `/Users/m2air/Desktop/RNP/Intouch/middleware.ts` — marshrut himoyasi
- `/Users/m2air/Desktop/RNP/Intouch/app/actions/auth.ts` — login/logout/seed-admin



---

## 2. Maqsad va vazifalar

### 2.1. Maqsad

Marketing byudjeti, lead oqimi va sotuvchilar natijalarini **bir joyda, kunlik va oylik kesimda** kuzatib borish; ularni oldindan qo'yilgan **rejalar** bilan avtomatik solishtirish; hamda rahbariyat uchun tez, aniq va bir xil o'lchov birligidagi (USD) ko'rsatkichlarni taqdim etish.

### 2.2. Asosiy vazifalar

- **Marketing samaradorligini o'lchash** — sarflangan byudjetdan qancha lead va sotuv olinganini, lead va sotuv narxini hisoblash.
- **Lead sifatini nazorat qilish** — sifatli va sifatsiz leadlar nisbati (Sifat %) va sotuvga aylanish darajasi (Konversiya %).
- **Sotuvchilar samaradorligini baholash** — har bir sotuvchining natijalari, o'rtacha cheki, konversiyasi.
- **Rejalashtirish va nazorat** — oylik byudjet, kunlik sifatli lead va oylik tushum rejalarini belgilash; har bir sotuvchiga oylik tushum rejasini taqsimlash va uning bajarilishini kuzatish.
- **Hisobot** — barcha ma'lumotlarni Excel formatida eksport qilish.

### 2.3. Ko'lam (scope)

Tizim quyidagilarni qamrab oladi: foydalanuvchi/rol boshqaruvi, kunlik marketing byudjeti kiritish, sotuvchilar tomonidan kunlik natijalarni kiritish, avtomatik agregatsiya va hosila ko'rsatkichlar (formulalar), rejalarni belgilash va bajarilishni ko'rsatish, valyuta konversiyasi (so'm → USD), oylik/yillik ko'rinishlar va Excel eksport. Tizim **ichki** boshqaruv paneli bo'lib, ochiq ro'yxatdan o'tish (self-signup) mavjud emas — foydalanuvchilarni faqat menejer yaratadi.



## 3. Foydalanuvchilar, rollar va autentifikatsiya

### 3.1. Umumiy tavsif

Tizim autentifikatsiyasi **Supabase Auth** (`@supabase/ssr`) asosida qurilgan. Foydalanuvchilar tizimga **login** va **parol** orqali kiradilar; login ichki tarzda maxsus e-mail manzilga o'giriladi. Har bir foydalanuvchining roli va profil ma'lumotlari `profiles` jadvalida saqlanadi (`id`, `name`, `login`, `role`, `created_at`). Foydalanuvchi identifikatori (`profiles.id`) Supabase Auth foydalanuvchisining `id` qiymati bilan bir xil bo'ladi.

### 3.2. Rollar

Tizimda uch xil rol mavjud (`lib/rnp.ts` — `Role` tipi):

| Rol (kod qiymati) | Ekrandagi nomi (`roleLabel`) | Menejermi? (`isManagerRole`) |
|---|---|---|
| `super_admin` | Bosh admin | Ha |
| `admin` | Admin | Ha |
| `salesperson` | Sotuvchi | Yo'q |

- **Menejer** (`isManagerRole`) — bu `super_admin` yoki `admin` roli. Menejer butun dashboardni ko'radi va ma'lumotlarni boshqaradi.
- **Sotuvchi** (`salesperson`) — faqat o'z natijalarini kirita oladi.

Roldan qat'i nazar, foydalanuvchining rol yorlig'i (badge) rang varianti bilan ko'rsatiladi (`employees-manager.tsx` — `badgeVariant`): `super_admin` → `default`, `admin` → `outline`, `salesperson` → `secondary`.

### 3.3. Ruxsatlar matritsasi

| Amal | Bosh admin (`super_admin`) | Admin (`admin`) | Sotuvchi (`salesperson`) |
|---|---|---|---|
| Butun dashboardni ko'rish | Ha | Ha | Yo'q (faqat o'z natijasi) |
| Byudjet kiritish (`upsertMarketingDay`) | Ha | Ha | Yo'q |
| Oylik reja kiritish (`upsertPlanSettings`) | Ha | Ha | Yo'q |
| Hodim rejalarini kiritish (`upsertEmployeePlans`) | Ha | Ha | Yo'q |
| Sotuvchi qo'shish/tahrirlash/o'chirish | Ha | Ha | Yo'q |
| Admin/Bosh admin qo'shish | Ha | Yo'q | Yo'q |
| Admin/Bosh admin tahrirlash yoki o'chirish | Ha | Yo'q | Yo'q |
| O'z kunlik natijasini kiritish (`upsertEmployeeDay`) | Ha | Ha | Ha (faqat o'ziniki) |
| Boshqa hodim natijasini kiritish | Ha | Ha | Yo'q |

Ruxsat tekshiruvi barcha server action'larida amalga oshiriladi (`app/actions/data.ts`):
- `requireManager()` — joriy profilni oladi (`getCurrentProfile`) va `isManagerRole` tekshiradi; menejer bo'lmasa `{ error: "Ruxsat yo'q" }` qaytaradi.
- `upsertEmployeeDay` esa menejer bo'lmasa ham, faqat `profile.id === input.employee_id` bo'lganda ruxsat beradi; aks holda `{ error: "Faqat o'z natijalaringizni kirita olasiz" }`.

### 3.4. Login mexanizmi

Login jarayoni quyidagi bosqichlardan iborat:

1. **Login formasi** (`components/login-form.tsx`) — `login` va `password` maydonlari (ikkalasi ham `required`). Forma `useActionState` orqali `login` server action'ini chaqiradi. Yuborilayotganda tugma "Kirilmoqda..." holatiga o'tadi, aks holda "**Kirish**".
2. **Server action `login`** (`app/actions/auth.ts`):
   - `login` va `password` bo'sh bo'lsa → `{ error: "Login va parolni kiriting" }`.
   - Login `loginToEmail(login)` orqali e-mailga aylantiriladi.
   - `supabase.auth.signInWithPassword({ email, password })` chaqiriladi.
   - Xato bo'lsa → `{ error: "Login yoki parol noto'g'ri" }`.
   - Muvaffaqiyatda → `revalidatePath("/", "layout")` va `redirect("/")`.
3. **`loginToEmail`** (`lib/rnp.ts`): loginni kichik harflarga o'giradi, bo'shliqlarni olib tashlaydi va `@rnp.local` domenini qo'shadi:
   - Formula: `loginToEmail(login) = login.trim().toLowerCase() + "@rnp.local"`
   - Domen konstantasi: `EMAIL_DOMAIN = "rnp.local"`.
   - Masalan: login `Alisher` → e-mail `alisher@rnp.local`.

Loginlar foydalanuvchi nomi (username) sifatida ishlatiladi; Supabase Auth ichida esa ular yuqoridagi ichki e-mailga bog'lanadi.

### 3.5. Chiqish (logout)

Chiqish menejer/foydalanuvchi menyusi orqali amalga oshiriladi (`components/user-menu.tsx`). Menyu tepasida foydalanuvchi ismi, `@login` va roli (`roleLabel`) ko'rsatiladi. "**Chiqish**" tugmasi `logout` server action'ini chaqiradi. `logout` (`app/actions/auth.ts`): `supabase.auth.signOut()` va `revalidatePath("/", "layout")`.

### 3.6. Seed-admin (birinchi bosh adminni yaratish)

`ensureSeedAdmin` server action'i (`app/actions/auth.ts`) yangi o'rnatishda tizim ishga tushishi uchun birinchi bosh adminni yaratadi. Xavfsizlik qoidalari:

- Kirish ma'lumotlari **faqat** server tomonidagi muhit o'zgaruvchilaridan olinadi: `SEED_ADMIN_LOGIN` va `SEED_ADMIN_PASSWORD`. Kodda hech qachon hardcode qilinmaydi.
- Agar `SEED_ADMIN_LOGIN` yoki `SEED_ADMIN_PASSWORD` o'rnatilmagan bo'lsa yoki parol **8 belgidan qisqa** bo'lsa — action hech narsa qilmaydi (no-op). Shu tufayli ochiq route hech qachon avtomatik ravishda ma'lum standart hisob yaratmaydi.
- Agar `profiles` jadvalida allaqachon **kamida bitta menejer** (`super_admin` yoki `admin`) mavjud bo'lsa — hech narsa qilinmaydi.
- Yaratilganda: service-role client orqali Supabase Auth foydalanuvchisi tuziladi (`email_confirm: true`, `user_metadata: { name: "Administrator", login }`), so'ng `profiles` jadvaliga `role: "super_admin"`, `name: "Administrator"` bilan qator qo'shiladi.

### 3.7. Middleware himoyasi

Barcha marshrutlar `middleware.ts` orqali himoyalangan; u `updateSession` (`lib/supabase/proxy.ts`) funksiyasini chaqiradi. Middleware `matcher`i statik fayllar (`_next/static`, `_next/image`, `favicon.ico`) va rasm fayllari (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`) dan tashqari barcha yo'llarga qo'llanadi.

Har bir so'rovda `supabase.auth.getUser()` orqali sessiya tekshiriladi va cookie'lar yangilanadi:

- **Autentifikatsiyasiz** foydalanuvchi `/login` dan boshqa sahifaga kirsa → `/login` ga yo'naltiriladi.
- **Autentifikatsiyalangan** foydalanuvchi `/login` ga kirsa → dashboard (`/`) ga yo'naltiriladi.

### 3.8. Hodim CRUD server action'lari va rol tekshiruvlari

Hodimlarni boshqarish interfeysi `components/employees-manager.tsx` (jadval + "**Hodim qo'shish**" tugmasi + tahrirlash/o'chirish dialog'lari) orqali amalga oshiriladi. Barcha yozish amallari **service-role client** (`createServiceClient`) orqali bajariladi, chunki Auth foydalanuvchilarini yaratish/o'chirish imtiyozli amaldir.

#### 3.8.1. `createEmployee(formData)`
- `requireManager()` — menejer bo'lmasa `{ error: "Ruxsat yo'q" }`.
- Maydonlar: `name`, `login` (kichik harfga), `password`, `role` (`normRole` orqali normallashadi).
- **Faqat `super_admin`** boshqa menejer yaratishi mumkin: agar `role !== "salesperson"` va `me.role !== "super_admin"` → `{ error: "Faqat bosh admin admin qo'sha oladi" }`.
- Bo'sh maydonlar → `{ error: "Barcha maydonlarni to'ldiring" }`.
- Parol **6 belgidan qisqa** bo'lsa → `{ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }`.
- Login band bo'lsa (`profiles` da mavjud) → `{ error: "Bu login band" }`.
- Auth foydalanuvchi yaratiladi (`email: loginToEmail(login)`, `email_confirm: true`), so'ng `profiles` ga qator qo'shiladi. Agar `profiles.insert` xato bersa — yaratilgan Auth foydalanuvchisi qaytadan o'chiriladi (`deleteUser`, ya'ni rollback).

#### 3.8.2. `updateEmployee(formData)`
- `requireManager()` — menejer bo'lmasa `{ error: "Ruxsat yo'q" }`.
- Nishon (target) profilning joriy qiymatlari (`name`, `login`, `role`) oldindan o'qiladi — ham ruxsatni tekshirish, ham rollback uchun.
- **Oddiy admin** (`me.role !== "super_admin"`) menejerlarga tegina olmaydi va hech kimni menejerlik roliga ko'tara olmaydi: agar `targetRole !== "salesperson"` yoki yangi `role !== "salesperson"` → `{ error: "Faqat bosh admin adminlarni boshqara oladi" }`.
- Parol berilgan bo'lsa va **6 belgidan qisqa** bo'lsa → `{ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }`. Tekshiruv hech narsa o'zgartirilmasdan **oldin** bajariladi.
- Login boshqa hodimda band bo'lsa → `{ error: "Bu login band" }`.
- **Atomik rollback mexanizmi**: avval `profiles` yangilanadi (`name`, `login`, `role`), so'ng Auth yozuvi yangilanadi (`email`, ixtiyoriy `password`). Agar Auth yangilash xato bersa — `profiles` qatori eski qiymatlarga **qaytariladi**, aks holda `profiles.login` va Auth e-maili bir-biridan ayrilib qolib, foydalanuvchi tizimga kira olmay qolishi mumkin. Agar rollback ham xato bersa (ikkilangan xato) — log yoziladi va `{ error: "Yangilashda xatolik — hodim ma'lumotlarini qayta tekshiring" }` qaytariladi.

#### 3.8.3. `deleteEmployee(id)`
- `requireManager()` — menejer bo'lmasa `{ error: "Ruxsat yo'q" }`.
- O'zini o'chira olmaydi: `id === me.id` → `{ error: "O'zingizni o'chira olmaysiz" }`.
- **Oddiy admin faqat sotuvchilarni o'chira oladi**: agar `me.role !== "super_admin"` va `targetRole !== "salesperson"` → `{ error: "Faqat bosh admin adminlarni o'chira oladi" }`.
- `auth.admin.deleteUser(id)` chaqiriladi — bu kaskad orqali `profiles` va `employee_daily` yozuvlarini ham o'chiradi.

#### 3.8.4. Klient tomonidagi cheklovlar (`employees-manager.tsx`)
- `canManage(emp)` — oddiy admin faqat sotuvchilarga (`emp.role === "salesperson"`) yoki o'ziga tegishli qatorlarga amal qila oladi; bosh admin (`isSuper`) barchasiga.
- Rol tanlash ro'yxati (`roleOptions`) faqat bosh adminda uch variant (`Sotuvchi`, `Admin`, `Bosh admin`) ko'rsatadi; oddiy adminda faqat `Sotuvchi`. Oddiy admin uchun "Faqat bosh admin admin qo'sha oladi." izohi chiqadi.
- Tahrirlash/o'chirish tugmalari `disabled` holatiga o'tadi, agar hodim boshqarib bo'lmasa yoki o'chirilayotgan hodim foydalanuvchining o'zi bo'lsa.
- O'chirish tasdiqlash oynasi hodimning barcha natijalari ham o'chishini ogohlantiradi (bu amalni ortga qaytarib bo'lmaydi).

### 3.9. Supabase client'lari va RLS

Tizimda ikki xil Supabase client ishlatiladi:

| Client | Fayl | Kalit | Vazifa |
|---|---|---|---|
| SSR/anon client | `lib/supabase/server.ts`, `lib/supabase/proxy.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Foydalanuvchi sessiyasi bilan (cookie orqali) ishlaydi; RLS qoidalari qo'llanadi. Login, sessiya, oddiy ma'lumot o'qish/yozish uchun. |
| Service-role client | `lib/supabase/admin.ts` (`createServiceClient`) | `SUPABASE_SERVICE_ROLE_KEY` | RLS'ni **chetlab o'tadi**; Auth foydalanuvchilarini yaratish/o'chirish/yangilash kabi imtiyozli amallar uchun. `autoRefreshToken: false`, `persistSession: false`. Hech qachon klient komponentlariga import qilinmaydi. |

**Muhim**: service-role client RLS himoyasini butunlay chetlab o'tgani uchun, hodim CRUD amallaridagi rol tekshiruvlari (`requireManager`, `super_admin` shartlari) faqat server action kodida amalga oshiriladi — bu tekshiruvlar ma'lumotlar bazasi darajasida emas, balki ilova mantig'i darajasida joriy qilinadi.

---

O'qilgan fayllar: `/Users/m2air/Desktop/RNP/Intouch/app/actions/auth.ts`, `/Users/m2air/Desktop/RNP/Intouch/lib/auth.ts`, `/Users/m2air/Desktop/RNP/Intouch/lib/supabase/proxy.ts`, `/Users/m2air/Desktop/RNP/Intouch/lib/supabase/server.ts`, `/Users/m2air/Desktop/RNP/Intouch/lib/supabase/admin.ts`, `/Users/m2air/Desktop/RNP/Intouch/app/actions/data.ts`, `/Users/m2air/Desktop/RNP/Intouch/components/employees-manager.tsx`, `/Users/m2air/Desktop/RNP/Intouch/components/login-form.tsx`, `/Users/m2air/Desktop/RNP/Intouch/components/user-menu.tsx`, `/Users/m2air/Desktop/RNP/Intouch/lib/rnp.ts`, `/Users/m2air/Desktop/RNP/Intouch/middleware.ts`.



---

## 4. Funksional talablar

Ilova uchta asosiy bo'limdan (tab) iborat: **Kunlik Ma'lumotlar** (marketing), **Hodimlar natijalari** va **Hodimlar** (foydalanuvchilarni boshqarish — 3-bo'limga qarang). Yuqorida davr tanlash (oy/yil), Eksport, tema almashtirish va foydalanuvchi menyusi joylashgan. Barcha pul summalari dollarda (`$`), foizlar rang bilan kodlanadi (past — qizil, o'rta — sariq, yuqori — yashil), raqamlar sarlavha ostida markazga tekislanadi.



## 4.1. Kunlik Ma'lumotlar jadvali (marketing)

### 4.1.1. Umumiy tavsif va maqsad

Kunlik Ma'lumotlar jadvali marketing bo'limining asosiy monitoring vositasi bo'lib, tanlangan oy (yoki davr) davomida marketing byudjetining lidlar va sotuvlarga qanday aylanayotganini kunma-kun (yoki davr kesimida) ko'rsatadi. Jadval `components/marketing-table.tsx` faylidagi `MarketingTable` komponenti orqali chiziladi, hisob-kitob formulalari esa `lib/calc.ts` faylidagi `marketingRow` (qator darajasi) va `marketingTotals` (agregat "Jami" qatori va KPI'lar) funksiyalarida joylashgan.

Jadvalning asosiy g'oyasi — **ikki manbani birlashtirish**:

- **Byudjet** — marketing bo'limi tomonidan qo'lda kiritiladi (`MarketingDaily` yozuvlari, `byudjet` ustuni).
- **Lidlar va sotuvlar** — sotuvchilar kiritgan kunlik ma'lumotlardan (`EmployeeDaily`) avtomatik yig'iladi.

Ushbu ikki manba davr kaliti (kun raqami yoki `YYYY-MM`) bo'yicha birlashtirilib, har bir davr uchun sintez qilingan (synced) qator hosil qilinadi, so'ngra hosila ko'rsatkichlar (lid narxi, konversiya va h.k.) hisoblanadi.

Jadval ustidagi izoh kartasi bu qoidani foydalanuvchiga aniq bildiradi:

> "Sifatli, Jami Lead va Sotuv ustunlari sotuvchilar kiritgan ma'lumotlardan avtomatik yig'iladi. Faqat byudjetni siz kiritasiz — $ yoki so'mda (so'm avtomatik dollarga aylanadi). Barcha summalar dollarda ko'rsatiladi."

### 4.1.2. Ustunlar tartibi va tavsifi

Jadval sarlavhasi quyidagi tartibda 12 ta ma'lumot ustunidan iborat; tahrirlash huquqi bor foydalanuvchida qo'shimcha **Amal** ustuni bilan jami 13 ta ustun bo'ladi (`COLS = 12 + (canEdit ? 1 : 0)`). Birinchi ustun sarlavhasi `periodHeader` propidan olinadi (kunlik ko'rinishda "Kun", davr ko'rinishida davr nomi).

| № | Ustun nomi | Manba | Tavsif |
|---|-----------|-------|--------|
| 1 | **Kun** (`periodHeader`) | Davr | Kun raqami yoki davr yorlig'i (`period.label`). Chapga yopishtirilgan (`sticky left-0`). |
| 2 | **Byudjet** | Qo'lda | Kunlik marketing byudjeti, USD'da ko'rsatiladi (`fmtUsd`). Yagona qo'lda kiritiladigan ustun. |
| 3 | **Jami Lead** | Avto | Jami lidlar = Sifatli + Sifatsiz (`jami_lead`). |
| 4 | **Sifatli** | Avto | Sifatli (klassifikatsiyalangan) lidlar soni (`sifatli`). |
| 5 | **Sifatsiz** | Avto | Sifatsiz lidlar soni (`sifatsiz`, `Math.max(0, m.sifatsiz)` orqali manfiydan himoyalangan). |
| 6 | **Sotuv** | Avto | Sotilgan mijozlar soni (`sotuv` ← `sotilgan_mijoz`). |
| 7 | **Lead Narxi** | Hisob | Bitta lidning tannarxi, USD (`leadNarxi`). |
| 8 | **Sotuv Narxi** | Hisob | Bitta sotuvning tannarxi, USD (`sotuvNarxi`). |
| 9 | **Sifat %** | Hisob | Lid sifati foizi (`sifatPct`), rangli belgi (badge). |
| 10 | **Konversiya %** | Hisob | Sifatli lidlardan sotuvga aylanish foizi (`konversiyaPct`), rangli belgi. |
| 11 | **Reja Lid** | Reja | Kunlik sifatli-lid rejasi (`rejaLid` ← `plan_lead`). Reja bo'lmasa "—". |
| 12 | **Reja %** | Hisob | Kunlik reja bajarilishi (`rejaPct`), rangli belgi. Reja bo'lmasa "—". |
| 13 | **Amal** | Amal | Faqat `canEdit=true` bo'lganda. Byudjetni tahrirlash tugmasi (qalam belgisi). |

### 4.1.3. Avtomatik yig'iladigan ustunlar

Quyidagi ustunlar sotuvchilar kiritgan `EmployeeDaily` yozuvlaridan davr kaliti bo'yicha yig'iladi (`empByPeriod` → `syncedRows`) va **qo'lda tahrirlab bo'lmaydi**:

- **Sifatli** = sotuvchilarning `sifatli` yig'indisi.
- **Sifatsiz** = sotuvchilarning `sifatsiz` yig'indisi.
- **Jami Lead** = Sifatli + Sifatsiz (`jami_lead: emp.sifatli + emp.sifatsiz`). Diqqat: "gaplashgan" (jami muloqotlar) ataylab qo'shilmaydi — kod izohida `"gaplashgan removed"`.
- **Sotuv** = sotuvchilarning `sotilgan_mijoz` yig'indisi.

### 4.1.4. Qo'lda kiritiladigan ustun (Byudjet)

Faqat **Byudjet** ustuni qo'lda kiritiladi va faqat `canEdit=true` bo'lgan foydalanuvchiga tahrir tugmasi (**Amal** ustunidagi qalam belgisi) ko'rsatiladi. Tahrirlash oqimi:

1. Qalam tugmasi bosilganda (`startEdit`) o'sha davr uchun byudjet inputga yuklanadi (2 kasrgacha yumaloqlanadi: `Math.round(b * 100) / 100`).
2. Byudjet **$ yoki so'mda** kiritilishi mumkin — valyuta almashtirgichi `MoneyCurrencyToggle` orqali tanlanadi (`draftCurrency`: `"USD"` | `"UZS"`).
3. So'm tanlansa, MB (CBU) kursi (`usdRate`) bo'yicha real vaqtda `≈ $...` ko'rinishida oldindan ko'rsatiladi (`somToUsd`).
4. Saqlashda (`save`) qiymat `toUsd(amount, currency, rate)` orqali **doim USD'ga o'giriladi** va shu USD qiymati `upsertMarketingDay` server amali orqali saqlanadi. So'mdan USD: `somToUsd = som / rate` (kurs 0 bo'lsa 0).
5. Saqlash `useOptimistic` (`applyOptimisticMarketing`) orqali darhol aks ettiriladi, so'ngra revalidate bilan solishtiriladi. Muvaffaqiyatda `"{kun}-kun byudjeti saqlandi"` toast chiqadi.

Marketing yozuvidan faqat **byudjet** o'qiladi; qolgan ustunlar sotuvchilardan sinxronlangani uchun saqlashda ular saqlanadi yoki nolga tenglashtiriladi.

### 4.1.5. Hisob-kitob formulalari (qator darajasi)

Har bir qator uchun hosila qiymatlar `marketingRow(m, plan)` funksiyasida hisoblanadi:

| Ko'rsatkich | Formula | Izoh |
|-------------|---------|------|
| **Lead Narxi** | `Byudjet ÷ Jami Lead` | Jami Lead = 0 bo'lsa natija 0. |
| **Sotuv Narxi** | `Byudjet ÷ Sotuv` | Sotuv = 0 bo'lsa natija 0. |
| **Sifat %** | `Sifatli ÷ (Sifatli + Sifatsiz) × 100` | Maxraj = 0 bo'lsa 0. |
| **Konversiya %** | `Sotuv ÷ Sifatli × 100` | Sifatli = 0 bo'lsa 0. |
| **Reja Lid** | `plan_lead` (kunlik sifatli-lid rejasi) | `Number(plan?.plan_lead) || 0`. |
| **Reja %** | `Sifatli ÷ Reja Lid × 100` | Reja Lid = 0 bo'lsa 0. |

**Muhim texnik nuance:** Supabase `numeric` ustunlarni satr (string) sifatida qaytaradi va `"0"` satri "truthy" hisoblanadi. Shu sababli `plan_lead` qiymati `Number(...)` orqali oldindan songa aylantiriladi — aks holda 0 reja bo'yicha bo'lish `Infinity` ("∞%") beradi.

### 4.1.6. "Jami" qatori va agregat formulalari

Jadval oxirida `marketingTotals(rows, plan, jamiTushum, monthDays)` orqali hisoblanadigan **Jami** qatori (`border-t-2`, `font-semibold`) turadi. Agregat formulalari:

| Ustun | "Jami" qatori formulasi |
|-------|--------------------------|
| Byudjet | `Σ byudjet` (barcha qatorlar) = `jamiByudjet` |
| Jami Lead | `Σ jami_lead` = `jamiLead` |
| Sifatli | `Σ sifatli` = `jamiSifatli` |
| Sifatsiz | `Σ sifatsiz` = `jamiSifatsiz` |
| Sotuv | `Σ sotuv` = `jamiSotuv` |
| Lead Narxi | `jamiByudjet ÷ jamiLead` (o'rtacha) = `ortLeadNarxi` |
| Sotuv Narxi | `jamiByudjet ÷ jamiSotuv` (o'rtacha) = `ortSotuvNarxi` |
| Sifat % | `jamiSifatli ÷ (jamiSifatli + jamiSifatsiz) × 100` |
| Konversiya % | `jamiSotuv ÷ jamiSifatli × 100` |
| Reja Lid | `plan_lead` (kunlik) — `rejaLid` |
| Reja % | `jamiSifatli ÷ (plan_lead × oy kunlari soni) × 100` = `rejaBajarilishi` |

Bu yerda **Reja %** (Jami qatori) kunlik rejadan farqli — kunlik `plan_lead` oy kunlari soniga (`monthDays`, kunlik ko'rinishda `periods.length`) ko'paytirilib **oylik sifatli reja** (`oylikSifatliReja = planLead * monthDays`) hosil qilinadi.

### 4.1.7. KPI kartalar

Jadval ustida `KpiCard` kartalar to'plami joylashadi (grid: mobil 2 ustun, `lg` da 4 ustun). Doimiy 6 ta karta:

| Karta | Qiymat | Manba / formula |
|-------|--------|-----------------|
| **Jami Byudjet** | `fmtUsd(jamiByudjet)` | tone: `primary` |
| **Jami Lead** | `fmt(jamiLead)` | tone: `default` |
| **Sifatli Lead** | `fmt(jamiSifatli)` | tone: `success` |
| **Jami Sotuv** | `fmt(jamiSotuv)` | tone: `success` |
| **O'rtacha Lead Narxi** | `fmtUsd(ortLeadNarxi)` | `jamiByudjet ÷ jamiLead` |
| **O'rtacha Sotuv Narxi** | `fmtUsd(ortSotuvNarxi)` | `jamiByudjet ÷ jamiSotuv` |

Reja sozlangan bo'lsa (`plan` mavjud), yana 3 ta karta qo'shiladi; ularning rangi `pctKpiTone` orqali qiymatga qarab o'zgaradi:

| Karta | Qiymat | Formula | Hint (izoh) |
|-------|--------|---------|-------------|
| **Byudjet reja %** | `rejaByudjetPct` | `jamiByudjet ÷ plan_byudjet × 100` | `Reja: {fmtUsd(rejaByudjet)}` |
| **Sifatli reja %** | `rejaBajarilishi` | `jamiSifatli ÷ (plan_lead × oy kunlari) × 100` | `Kunlik reja: {rejaLid} sifatli` |
| **Tushum reja %** | `rejaTushumPct` | `jamiTushum ÷ plan_sotuv × 100` | `{fmtUsd(jamiTushum)} / {fmtUsd(rejaTushum)}` |

Bu yerda:
- **`jamiTushum`** — ko'rinadigan davrlar bo'yicha sotuvchilarning `tushum` (USD) yig'indisi.
- **`plan_sotuv`** — sotuv rejasi emas, balki **USD'dagi tushum (daromad) rejasi**, shuning uchun u `jamiTushum` bilan solishtiriladi.

Reja hali sozlanmagan va foydalanuvchi tahrir huquqiga ega bo'lsa, ogohlantiruvchi karta ko'rsatiladi: *"Reja hali sozlanmagan. «Reja sozlamalari» tugmasi orqali oylik rejani kiriting."*

### 4.1.8. Rang kodlash (past/o'rta/yuqori)

Foizli ustunlar (Sifat %, Konversiya %, Reja %) va reja KPI kartalari uchun yagona uch bosqichli rang shkalasi ishlatiladi. Chegara qiymatlari `pctTone(value)` da belgilangan:

| Diapazon | Toifa | Rang | Ma'no |
|----------|-------|------|-------|
| `value < 30` | `low` | Qizil (destructive) | Past ko'rsatkich |
| `30 ≤ value < 60` | `mid` | Sariq (warning) | O'rta ko'rsatkich |
| `value ≥ 60` | `high` | Yashil (success) | Yuqori ko'rsatkich |

Jadval katakchalarida foizlar `PctBadge` komponenti orqali dumaloq rangli belgi (badge) ko'rinishida chiqadi. KPI kartalarida esa `pctKpiTone` `low→danger`, `mid→warning`, `high→success` tonlariga o'giradi (bir xil qizil/sariq/yashil shkala).

### 4.1.9. Tekislash va valyuta ko'rsatish qoidalari

- Barcha ma'lumot ustunlari **markazga tekislanadi** (`text-center`); birinchi ustun (Kun/davr) chapga yopishtirilgan (`sticky left-0`).
- Raqamli qiymatlar `tabular-nums` bilan tekis ustunda ko'rsatiladi; minglar ajratkichi `fmt` (`ru-RU` formatida) orqali.
- **Pul ustunlari** (Byudjet, Lead Narxi, Sotuv Narxi va barcha KPI pul kartalari) `$` belgisi bilan ko'rsatiladi (`fmtUsd` → `"$1,234.56"`, `en-US`, maksimal 2 kasr).
- Barcha pul qiymatlari **doim USD'da** saqlanadi va ko'rsatiladi; so'm faqat kiritish paytida MB kursi bo'yicha USD'ga o'giriladi (`toUsd`/`somToUsd`).
- Foizlar `fmtPct` orqali formatlanadi: 0 dan farqli lekin 1% dan kichik qiymatlar 2 kasrgacha ko'rsatiladi (masalan `0.03%`), aks holda butun songa yumaloqlanadi.
- Ma'lumotsiz qatorlar (`byudjet = 0` va `jami_lead = 0`) xiralashtirilgan matn rangida (`text-muted-foreground`) ko'rsatiladi; reja yo'q bo'lsa Reja Lid va Reja % o'rniga "—" chiqadi.

Tegishli fayllar:
- `/Users/m2air/Desktop/RNP/Intouch/components/marketing-table.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/lib/calc.ts`
- `/Users/m2air/Desktop/RNP/Intouch/components/pct-badge.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/lib/rnp.ts`


## 4.2. Hodimlar natijalari jadvali

### 4.2.1. Umumiy tavsif

Hodimlar natijalari jadvali sotuvchilar (hodimlar)ning oylik faoliyat ko'rsatkichlarini yig'ma ko'rinishda aks ettiradi va boshqaruvchi (menejer) yoki hodimning o'zi tomonidan kunlik natijalarni kiritish imkonini beradi. Komponent: `components/employee-results.tsx` (`EmployeeResults`).

Ma'lumotlar manbalari:
- `employee_daily` jadvali — hodimning har bir kundagi xom ko'rsatkichlari.
- `employee_plans` jadvali — har bir hodimning oylik tushum rejasi (`plan_tushum`, USD).
- `plan_settings` jadvali — oylik umumiy tushum rejasi (`plan_sotuv`, "Reja Tushum").

Barcha pul qiymatlari USD'da saqlanadi va ko'rsatiladi. So'm faqat kiritish paytida MB (Markaziy bank) kursi bo'yicha USD'ga o'giriladi.

### 4.2.2. Rol asosida ko'rinish va ruxsat

| Rol | Ko'rish | Tahrirlash |
| --- | --- | --- |
| `super_admin` / `admin` (menejer) | Barcha hodimlar | Barcha hodimlarning kunlik natijalari |
| `salesperson` (sotuvchi) | Faqat o'zi | Faqat o'z natijalari |

- Menejerlik `isManagerRole(profile.role)` orqali aniqlanadi.
- Ko'rinadigan hodimlar ro'yxati: menejer uchun barcha `employees`, sotuvchi uchun faqat `profile.id` ga teng bo'lgan satr (`visibleEmployees`).
- Tahrirlash sharti (`canEdit`): `canEditData && granularity === "day" && (menejer || profile.id === empId)`. Ya'ni tahrirlash faqat **kunlik** detalizatsiya (`granularity === "day"`) rejimida mumkin.
- Menejer bo'lmagan foydalanuvchiga jadval tepasida izoh kartasi ko'rsatiladi: "Siz o'z natijalaringizni kiritasiz/ko'rasiz. Umumiy jami barcha hodimlar bo'yicha."

### 4.2.3. Jadval ustunlari

Jadval jami **13 ustundan** iborat (`COLS = 13`, birinchi ustun — kengaytirish tugmasi):

| # | Ustun sarlavhasi | Manba/formula | Format |
| --- | --- | --- | --- |
| 1 | (kengaytirish) | Ochish/yopish tugmasi (ChevronRight/ChevronDown) | — |
| 2 | **Hodim** | `emp.name` (avatar: ism birinchi harfi) | Matn, `sticky left-0` |
| 3 | **Sifatli** | `agg.sifatli` | Butun son (`fmt`) |
| 4 | **Sifatsiz** | `agg.sifatsiz` | Butun son (`fmt`) |
| 5 | **Aniqlanmagan** | `agg.aniqlanmagan` | Butun son (`fmt`) |
| 6 | **Sotilgan mijoz** | `agg.sotilgan_mijoz` | Butun son (`fmt`) |
| 7 | **Sotilgan mahsulot** | `agg.sotilgan_mahsulot` | Butun son (`fmt`) |
| 8 | **Tushum** | `agg.tushum` (USD) | `$1,234.56` (`fmtUsd`) |
| 9 | **Reja** | `planByEmployee.get(emp.id)` (`plan_tushum`, USD) | `fmtUsd`; reja yo'q bo'lsa "—" |
| 10 | **Bajarilishi** | Tushum ÷ Reja × 100 | Rangli `PlanBadge` |
| 11 | **Sifat %** | Sifatli ÷ (Sifatli + Sifatsiz) × 100 | Rangli `PctBadge` |
| 12 | **Konversiya %** | Sotilgan mijoz ÷ Sifatli × 100 | Rangli `PctBadge` |
| 13 | **O'rtacha chek** | Tushum ÷ Sotilgan mijoz (USD) | `fmtUsd` |

Har bir hodim satrining raqamli ustunlari uning barcha kunlik `employee_daily` satrlari yig'indisidir (`aggregateEmployee` funksiyasi). Yig'indi maydonlar: `gaplashgan`, `sifatli`, `sifatsiz`, `aniqlanmagan`, `sotilgan_mijoz`, `sotilgan_mahsulot`, `tushum` (`tushum` `Number()` orqali songa o'giriladi, chunki Supabase numeric ustunlarni satr sifatida qaytaradi).

### 4.2.4. Hisoblanadigan ko'rsatkichlar (formulalar)

`lib/calc.ts` → `employeeDerived(a)` funksiyasi:

- **Sifat %** = Sifatli ÷ (Sifatli + Sifatsiz) × 100
  - Agar (Sifatli + Sifatsiz) = 0 bo'lsa → 0.
- **Konversiya %** = Sotilgan mijoz ÷ Sifatli × 100
  - Agar Sifatli = 0 bo'lsa → 0.
- **O'rtacha chek** = Tushum ÷ Sotilgan mijoz
  - Agar Sotilgan mijoz = 0 bo'lsa → 0.
- **Bajarilishi** = Tushum ÷ Reja × 100 (`PlanBadge` ichida: `(done / plan) * 100`).
  - Reja (0 yoki mavjud emas) bo'lsa → "—" ko'rsatiladi.

### 4.2.5. "Bajarilishi" ustunining rang mexanizmi

`planTone(pct)` funksiyasi bajarilish foizini uch holatga ajratadi:

| Shart | Ohang (tone) | Rang |
| --- | --- | --- |
| pct ≥ 100 | `success` | Yashil |
| 50 ≤ pct < 100 | `warning` | Sariq |
| pct < 50 | `danger` | Qizil |

`PlanBadge` yumaloq pill ko'rinishida `fmtPct(pct)%` matnini chiqaradi; reja belgilanmagan bo'lsa (`plan` = 0) kulrang "—".

### 4.2.6. "Sifat %" va "Konversiya %" ranglari

Bu ikki ustun `PctBadge` orqali chiqadi; rang `pctTone(value)` bilan aniqlanadi:

| Shart | Ohang | Rang |
| --- | --- | --- |
| value < 30 | `low` | Qizil |
| 30 ≤ value < 60 | `mid` | Sariq |
| value ≥ 60 | `high` | Yashil |

### 4.2.7. Kunlik detalizatsiya (drill-down)

- Har bir hodim satrining oldidagi tugma (`ChevronRight`/`ChevronDown`) bosilganda `toggleExpand(empId)` orqali o'sha hodim satri kengaytiriladi (`expandedId`). Bir vaqtning o'zida faqat bitta hodim ochiq bo'ladi.
- Ochilgan panelda sarlavha: "`{hodim ismi}` — `{periodHeader}` bo'yicha".
- Ichki jadval ustunlari: `{periodHeader}` (masalan "Kun"), **Sifatli**, **Sifatsiz**, **Aniqlanmagan**, **Sotilgan mijoz**, **Sotilgan mahsulot**, **Tushum**, va (agar tahrirlash mumkin bo'lsa) **Amal**.
- Har bir davr (`period`) satri o'sha hodimning shu kun/davrdagi yig'indisidir (`periodAgg` → `aggregateEmployee`). `granularity === "day"` bo'lsa `String(r.day) === periodKey`, aks holda `r.month === periodKey` bo'yicha filtrlanadi.
- Ma'lumot bo'sh bo'lgan satrlar (`sifatli`, `sifatsiz`, `tushum`, `sotilgan_mijoz` — hammasi 0) kulrang rangda ko'rsatiladi.
- "Amal" ustunidagi qalam (`Pencil`) tugmasi kiritish modalini ochadi (`openEdit`). Tugmaning `aria-label`: "`{davr}`-kun natijasini tahrirlash".

### 4.2.8. Natija kiritish modal oynasi

Qalam tugmasi bosilganda `Dialog` (modal) ochiladi. Sarlavha: **"Natijani kiritish"**, tavsif: "`{hodim ismi}` — `{davr}`-`{periodHeader kichik harfda}`".

Modal maydonlari (barchasi manfiy bo'lmagan butun son, `NumField`, `min=0`):

- **Sifatli**
- **Sifatsiz**
- **Aniqlanmagan**
- **Sotilgan mijoz**
- **Sotilgan mahsulot** (ikki ustunni egallaydi)
- **Tushum** — son maydoni + valyuta almashtirgichi (`MoneyCurrencyToggle`: USD / UZS).

Modal ochilganda mavjud qiymatlar `periodAgg` orqali oldindan to'ldiriladi; Tushum `round2` (2 kasr xona) bilan ko'rsatiladi.

**Tushum valyutasi:**
- Standart holat — USD (`tushumCurrency = "USD"`). Izoh: "Dollarda kiritilyapti. So'mni tanlasangiz avtomatik dollarga aylanadi."
- UZS tanlansa va kurs mavjud bo'lsa, jonli konversiya ko'rsatiladi: "Dollarda: $`{somToUsd(qiymat, usdRate)}`".
- Saqlashda tushum `toUsd(qiymat, tushumCurrency, usdRate)` orqali USD'ga o'giriladi:
  - **USD** → o'zgarishsiz saqlanadi.
  - **UZS** → USD = So'm ÷ MB kursi (`somToUsd`, kurs 0 bo'lsa 0).

**Tugmalar:** "Bekor qilish" (modalni yopadi) va "Saqlash" (saqlanayotganda "Saqlanmoqda...", `disabled`).

### 4.2.9. Optimistik UI va saqlash oqimi

- Kunlik satrlar `useOptimistic` orqali boshqariladi (`optimisticDaily`). Saqlash bosilganda:
  1. `applyOptimisticDaily(optimisticRow)` — yangi qiymat darhol jadvalga qo'llanadi (optimistik satr `id: optimistic-{empId}-{month}-{day}`).
  2. `upsertEmployeeDay(...)` server harakati chaqiriladi (`app/actions/data.ts`).
  3. Xato bo'lsa — `toast.error(res.error)`, optimistik qiymat avtomatik qaytariladi.
  4. Muvaffaqiyat bo'lsa — `toast.success("{kun}-kun saqlandi")`, modal yopiladi.
- Server tomonidagi `upsertEmployeeDay` tekshiruvlari:
  - Ruxsat: menejer bo'lmasa faqat o'z `employee_id`si uchun ("Faqat o'z natijalaringizni kirita olasiz").
  - Oy formati `YYYY-MM` (`isValidMonth`).
  - Kun 1 dan `daysInMonth(month)` gacha bo'lishi kerak.
  - Barcha son maydonlari `Number.isFinite` va manfiy emas ("Qiymatlar manfiy bo'lishi mumkin emas").
  - `employee_daily` jadvaliga `onConflict: "employee_id,month,day"` bilan upsert; so'ng `revalidatePath("/")`.

### 4.2.10. "Umumiy jami" qatori

Jadval oxirida barcha ko'rinadigan hodimlar bo'yicha yig'indi qatori (`Umumiy jami`) chiqadi:
- Raqamli ustunlar: barcha hodimlarning yig'indilari qo'shiladi (`gaplashgan`, `sifatli`, `sifatsiz`, `aniqlanmagan`, `sotilgan_mijoz`, `sotilgan_mahsulot`, `tushum`).
- **Reja** ustuni: barcha hodimlar rejalari yig'indisi (`totalsPlan`); reja yo'q bo'lsa "—".
- **Bajarilishi**, **Sifat %**, **Konversiya %**, **O'rtacha chek** yig'ma qiymatlar asosida qayta hisoblanadi (`totalsDerived = employeeDerived(totals)`).

### 4.2.11. KPI kartalar

Jadval tepasida 4 ta KPI karta (`KpiCard`):

| Karta | Qiymat | Formula |
| --- | --- | --- |
| **Jami lead** | `fmt(totals.sifatli + totals.sifatsiz)` | Sifatli + Sifatsiz |
| **Jami sotilgan mijoz** | `fmt(totals.sotilgan_mijoz)` | Sotilgan mijozlar yig'indisi |
| **Jami tushum** | `fmtUsd(totals.tushum)` | Umumiy tushum (USD) |
| **O'rtacha konversiya %** | `{fmt(totalsDerived.konversiyaPct)}%` | Umumiy Sotilgan mijoz ÷ Umumiy Sifatli × 100 |

"O'rtacha konversiya %" kartasining ohangi qiymatiga qarab o'zgaradi (`pctKpiTone`): < 30 qizil, < 60 sariq, ≥ 60 yashil.

---

## 4.3. Hodim rejalari

### 4.3.1. Umumiy tavsif

"Hodim rejalari" — **faqat menejer** uchun mo'ljallangan dialog (`components/employee-plans-dialog.tsx`, `EmployeePlansDialog`). Bu yerda menejer oylik umumiy tushum rejasini ("Reja Tushum" = `plan_settings.plan_sotuv`) har bir hodimga taqsimlaydi. Har bir hodimning oylik tushum rejasi `employee_plans.plan_tushum` (USD) ustunida saqlanadi.

### 4.3.2. Dialog interfeysi

- Sarlavha: **"Hodim rejalari"**.
- Tavsif: "`{oy nomi}` — oylik "Reja Tushum"ni hodimlarga taqsimlang ($)".
- Har bir hodim uchun bir qator: avatar (ism birinchi harfi), hodim ismi, va `$` prefiksli son maydoni (`min=0`, `plan_tushum` qiymati). `aria-label`: "`{hodim ismi}` oylik tushum rejasi".
- Dialog har ochilganda tanlangan oyning saqlangan rejalari bilan qayta sinxronlanadi (`useEffect`), shunda oy almashganda oldingi oyning raqamlari o'tib qolmaydi.
- Hodim yo'q bo'lsa: "Hodim yo'q. "Hodimlar" bo'limidan sotuvchi qo'shing." xabari.

### 4.3.3. Taqsimlash yig'indisi (allocation summary)

Dialog pastida oylik reja bilan sinxron blok ko'rsatiladi.

**Oylik reja belgilangan bo'lsa** (`target = Number(plan_sotuv) > 0`):

| Qator | Qiymat/formula |
| --- | --- |
| **Oylik reja (Reja Tushum)** | `target` = `plan_settings.plan_sotuv` |
| **Taqsimlangan** | `allocated` = barcha hodimlar kiritilgan qiymatlari yig'indisi |
| **Qoldiq** | `remaining` = Oylik reja − Taqsimlangan |

- Qoldiq manfiy bo'lsa qizil, aks holda yashil rangda.
- Taqsimlangan yig'indi oylik rejadan oshsa (`over = target > 0 && allocated > target`), "Taqsimlangan" qizil rangda va ogohlantirish chiqadi: "Yig'indi oylik rejadan oshib ketdi — kamaytiring, aks holda saqlab bo'lmaydi."

**Oylik reja belgilanmagan bo'lsa** (`target = 0`):
- Faqat "Jami taqsimlangan" ko'rsatiladi va izoh: "Oylik "Reja Tushum" hali sozlanmagan — "Reja sozlamalari"dan kiriting. Shunda yig'indi shu rejadan oshmasligi tekshiriladi."

### 4.3.4. Sinxronlik va bloklash mexanizmi (ikki qatlamli)

Hodimlar rejalarining yig'indisi oylik "Reja Tushum"dan **oshib ketishi taqiqlanadi**. Bu ikki qatlamda ta'minlanadi:

**1-qatlam — Client (dialog):**
- "Saqlash" tugmasi `disabled = pending || employees.length === 0 || over` — ya'ni yig'indi oylik rejadan oshsa (`over`) tugma o'chadi.
- `submit()` ichida ham `over` bo'lsa saqlash to'xtatiladi va `toast.error("Hodimlar rejalari yig'indisi oylik rejadan oshib ketdi")`.

**2-qatlam — Server (`upsertEmployeePlans`, `app/actions/data.ts`):**
- Ruxsat: `requireManager()` — menejer bo'lmasa "Ruxsat yo'q".
- Oy formati `YYYY-MM`; reja ro'yxati bo'sh emas; har bir `employee_id` mavjud va `plan_tushum` `Number.isFinite` hamda manfiy emas.
- Oylik reja `plan_settings` dan qayta o'qiladi (`plan_sotuv`).
- **Fail-closed:** agar oylik rejani o'qishda xato bo'lsa (`planErr`), saqlash bloklanadi — "Oylik rejani tekshirib bo'lmadi, qayta urinib ko'ring". Bu o'qish nosozligida oshib ketish tekshiruvini jimgina o'tkazib yubormaslikni kafolatlaydi.
- Oylik reja > 0 bo'lsa va yig'indi (`allocated`) undan katta bo'lsa saqlash rad etiladi: "Hodimlar rejalari yig'indisi (`{allocated}`) oylik "Reja Tushum" (`{monthlyTarget}`) dan oshib ketdi".

### 4.3.5. Saqlash oqimi

1. Menejer qiymatlarni kiritadi va "Saqlash"ni bosadi.
2. `over` bo'lmasa `upsertEmployeePlans({ month, plans: [{ employee_id, plan_tushum }] })` chaqiriladi (har bir hodim uchun bir satr).
3. Server tekshiruvlaridan o'tsa, `employee_plans` jadvaliga `onConflict: "employee_id,month"` bilan bulk upsert amalga oshiriladi, so'ng `revalidatePath("/")`.
4. Xato bo'lsa — `toast.error(res.error)`; muvaffaqiyat bo'lsa — `toast.success("Hodim rejalari saqlandi")` va dialog yopiladi.

### 4.3.6. Bog'liqlik: 4.2 jadvali bilan aloqasi

Saqlangan `employee_plans.plan_tushum` qiymatlari 4.2 jadvalidagi **Reja** ustuniga (`planByEmployee`) va shu asosda **Bajarilishi** (Tushum ÷ Reja × 100) hisobiga hamda "Umumiy jami" qatoridagi umumiy rejaga (`totalsPlan`) uzatiladi.

---

Tegishli fayllar:
- `/Users/m2air/Desktop/RNP/Intouch/components/employee-results.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/components/employee-plans-dialog.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/lib/calc.ts`
- `/Users/m2air/Desktop/RNP/Intouch/app/actions/data.ts`
- `/Users/m2air/Desktop/RNP/Intouch/lib/rnp.ts` (formatlash/valyuta yordamchilari)
- `/Users/m2air/Desktop/RNP/Intouch/components/pct-badge.tsx` (foiz rang ohanglari)


## 4.4. Qo'shimcha funksiyalar

Ushbu bo'lim RNP Dashboard tizimining asosiy hisobot va kirish funksiyalaridan tashqari ko'makchi (yordamchi) funksiyalarni tavsiflaydi: oylik reja sozlamalari, Excel eksport, valyuta konversiyasi, davr tanlash, mavzu (tema) almashtirish, yuklanish skeleti hamda optimistik UI orqali tezkorlik.

### 4.4.1. Reja sozlamalari dialogi

**Fayl:** `components/plan-settings-dialog.tsx`
**Server harakati (server action):** `app/actions/data.ts` → `upsertPlanSettings`
**Ma'lumotlar bazasi jadvali:** `plan_settings` (kalit: `month`, konflikt bo'yicha: `onConflict: "month"`)

Menejer (super_admin / admin) tanlangan oy uchun oylik rejani belgilaydigan modal oyna. Dialog sarlavhasi — **"Reja sozlamalari"**, tavsifi — `monthLabel(month)` yordamida shakllantiriladi, masalan: **"Iyul 2026 uchun oylik reja"**.

**Kiritish maydonlari (barchasi `type="number"`):**

| Yorliq (Label) | Maydon nomi (id / DB ustuni) | Izoh (koddagi tavsif) | Placeholder |
|---|---|---|---|
| **Reja Byudjet ($)** | `plan_byudjet` | Oylik byudjet rejasi (dollarda) | `0` |
| **Kunlik sifatli lead rejasi** | `plan_lead` | Bir kunda nechta sifatli lead kerakligi. "Reja Lid" va "Sifat %" shu songa nisbatan hisoblanadi | `masalan: 15` |
| **Reja Tushum ($)** | `plan_sotuv` | Oylik daromad (tushum) rejasi dollarda. "Tushum reja %" jami tushumni shu songa nisbatan hisoblaydi | `masalan: 100000` |

**Xatti-harakat:**

- Dialog **har ochilganda** forma tanlangan oyning joriy rejasiga qayta sinxronlanadi (`useEffect`, `[open, plan]` bog'liqliklari bilan). Bu "yumshoq" oy almashtirishda oldingi oy qiymatlarining yangi oyga yozib qo'yilishining oldini oladi.
- Saqlash tugmasi bosilganda qiymatlar `Number(...) || 0` orqali songa aylantiriladi va `upsertPlanSettings` chaqiriladi.
- Muvaffaqiyatda **"Reja sozlamalari saqlandi"** (toast, sonner) chiqadi va dialog yopiladi; xatoda server qaytargan xatolik matni toast orqali ko'rsatiladi.
- Yuborish davomida tugmalar `disabled` bo'ladi; saqlash tugmasi matni **"Saqlanmoqda..."** ga o'zgaradi, aks holda **"Saqlash"**. Ikkinchi tugma — **"Bekor qilish"**.

**Serverdagi validatsiya (`upsertPlanSettings`):**

- Faqat menejer (`requireManager()`); aks holda **"Ruxsat yo'q"**.
- Oy formati `^\d{4}-\d{2}$` bo'lishi shart, aks holda **"Noto'g'ri oy"**.
- Har uch qiymat chekli (`Number.isFinite`) va manfiy emas bo'lishi shart, aks holda **"Qiymatlar manfiy bo'lishi mumkin emas"**.
- Muvaffaqiyatli upsertdan so'ng `revalidatePath("/")` chaqiriladi.

### 4.4.2. Excel eksport

**Fayl:** `lib/export.ts` → `exportWorkbook(...)`
**Kutubxona:** `xlsx` (v0.18.5)
**Ishga tushirish:** `components/dashboard.tsx` — header'dagi **"Eksport"** tugmasi (Download ikonkasi bilan; mobilda faqat ikonka, `sm:` dan boshlab matn ko'rinadi) → `handleExport()`.

Eksport tanlangan davr (oylik yoki yillik) ma'lumotlaridan `.xlsx` fayl yaratadi va brauzerda `XLSX.writeFile` orqali yuklab beradi. Fayl nomi: `RNP_Dashboard_${safeLabel}.xlsx`, bunda `safeLabel` — davr yorlig'idagi bo'shliqlar `_` ga almashtirilgan variant (masalan `RNP_Dashboard_Iyul_2026.xlsx` yoki `RNP_Dashboard_2026-yil.xlsx`).

**Muhim:** Eksport faqat sotuvchilar (`salespeople`) ma'lumotlari bo'yicha shakllanadi — menejerlarning shaxsiy kunlik qatorlari chiqarib tashlanadi, shunda KPI'lar bilan eksport bir xil populyatsiya ustidan hisoblanadi. Barcha pul qiymatlari USD (bazaviy valyuta) da eksport qilinadi.

**1-varaq — "Byudjet"** (marketing byudjeti, kun bo'yicha; oy+kun bo'yicha saralangan):

| Ustun | Manba |
|---|---|
| Oy | `monthShortLabel(m.month)` (masalan "Iyul") |
| Kun | `m.day` |
| Byudjet ($) | `round(Number(m.byudjet))` |

**2-varaq — "Hodimlar jami"** (har bir sotuvchi bo'yicha oylik yig'indi; `aggregateEmployee` + `employeeDerived` orqali hisoblanadi):

| Ustun | Formula / manba |
|---|---|
| Hodim | `emp.name` |
| Sifatli | `agg.sifatli` |
| Sifatsiz | `agg.sifatsiz` |
| Aniqlanmagan | `agg.aniqlanmagan` |
| Sotilgan mijoz | `agg.sotilgan_mijoz` |
| Sotilgan mahsulot | `agg.sotilgan_mahsulot` |
| Tushum ($) | `round(agg.tushum)` |
| Reja ($) | hodimning `plan_tushum` (`employee_plans` dan) |
| Bajarilishi % | `Bajarilishi % = (Tushum ÷ Reja) × 100` (reja 0 bo'lsa 0) |
| Sifat % | `der.sifatPct` |
| Konversiya % | `der.konversiyaPct` |
| O'rtacha chek ($) | `der.ortachaChek` |

**3-varaq — "Hodimlar kunlik"** (har bir sotuvchining kunlik tafsiloti; oy+kun bo'yicha saralangan):

| Ustun | Manba |
|---|---|
| Hodim | `emp.name` |
| Oy | `monthShortLabel(d.month)` |
| Kun | `d.day` |
| Sifatli | `d.sifatli` |
| Sifatsiz | `d.sifatsiz` |
| Aniqlanmagan | `d.aniqlanmagan` |
| Sotilgan mijoz | `d.sotilgan_mijoz` |
| Sotilgan mahsulot | `d.sotilgan_mahsulot` |
| Tushum ($) | `round(Number(d.tushum))` |

Barcha pul va foiz qiymatlari `round(n, 2)` funksiyasi bilan 2 xonagacha yaxlitlanadi. Muvaffaqiyatda **"Excel fayli yuklab olindi"**, xatoda **"Eksport qilishda xatolik"** (toast) ko'rsatiladi.

### 4.4.3. Valyuta konversiyasi (MB/CBU kursi, so'm → USD)

**Fayllar:** `lib/cbu.ts` (kurs olish), `lib/rnp.ts` (formatlash va konversiya)

Tizimda barcha pul qiymatlari **USD** da (bazaviy valyuta) saqlanadi va ko'rsatiladi. O'zbekiston Markaziy banki (CBU) kursi **faqat** so'm ko'rinishida kiritilgan summani kiritish paytida USD'ga o'girish uchun ishlatiladi.

**Kurs olish — `getUsdRate()` (`lib/cbu.ts`):**

- Manba: `https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/` (ochiq, autentifikatsiyasiz endpoint).
- Sahifa yuklanishini bloklamaslik uchun so'rov `AbortController` bilan **~3 soniyadan** keyin bekor qilinadi.
- Kesh: `next: { revalidate: 86400 }` — kurs sutkasiga bir marta yangilanadi (kun davomida keshdan olinadi).
- Qaytaradi: 1 USD uchun so'm miqdorini. Kurs mavjud bo'lmasa yoki so'rov muvaffaqiyatsiz bo'lsa **`0`** qaytadi (chaqiruvchilar `0`ni "kurs noma'lum" deb qabul qiladi).

**Konversiya va formatlash yordamchilari (`lib/rnp.ts`):**

| Funksiya | Vazifasi | Natija namunasi |
|---|---|---|
| `fmtUsdPlain(usd)` | USD summasini belgisiz, maks. 2 kasr bilan (`en-US`) | `1,234.56` |
| `fmtUsd(usd)` | USD summasini `$` belgisi bilan (KPI kartalari, jamilar) | `$1,234.56` |
| `somToUsd(som, rate)` | So'mni USD'ga: `USD = so'm ÷ kurs`; kurs 0 bo'lsa 0 | — |
| `toUsd(amount, from, rate)` | Kiritilgan summani USD'ga normallashtiradi: `UZS` bo'lsa `somToUsd`, `USD` bo'lsa o'zi | — |
| `fmtPct(n)` | Foizni formatlash; `0 < |n| < 1` bo'lsa 2 kasrgacha (kichik-lekin-real qiymat "0" bo'lib ko'rinmasligi uchun) | `0.03` / `12` |

Kirish valyutasi `InputCurrency = "USD" | "UZS"` tipi bilan belgilanadi. So'm summasi kiritilganda `toUsd(amount, "UZS", rate)` orqali darhol USD'ga o'giriladi va bazaga USD'da saqlanadi.

### 4.4.4. Davr tanlash (oylik / yillik ko'rinish)

**Fayl:** `components/period-picker.tsx`
**Yordamchilar (`lib/rnp.ts`):** `monthNamesUz()`, `monthLabel()`, `currentMonth()`, `currentYear()`, `yearMonths()`, `daysInMonth()`

Header'dagi ochiladigan (dropdown) tanlagich (Calendar + ChevronDown ikonkalari, `aria-label="Davrni tanlash"`). Tanlagich yorlig'i:

- Yillik ko'rinishda: `${year} — yillik`.
- Oylik ko'rinishda: `monthLabel(month)` (masalan "Iyul 2026").

**Ikki rejim (toggle):**

- **"Oylik"** — 3 ustunli setkada 12 oy (`monthNamesUz()`). Oy tanlanganda: `router.push('/?month=${browseYear}-${mm}')`. Faol oy `bg-primary text-primary-foreground` bilan ajratiladi.
- **"Yillik"** — tanlangan yil bo'yicha barcha oylar yig'indisi. **"${browseYear}-yilni ko'rish"** tugmasi: `router.push('/?view=yearly&year=${browseYear}')`.

**Yil navigatsiyasi:** chap/o'ng chevron tugmalari (`aria-label="Oldingi yil"` / `"Keyingi yil"`) `browseYear`ni ±1 o'zgartiradi.

**Serverda o'qish (`app/page.tsx`):** URL parametrlari validatsiyalanadi (`year` — `^\d{4}$`, `month` — `^\d{4}-\d{2}$`); noto'g'ri bo'lsa `currentYear()` / `currentMonth()` ishlatiladi. Yillik rejimda `marketing_daily` va `employee_daily` `like("month", "${year}-%")` bo'yicha, oylik rejimda `eq("month", month)` bo'yicha olinadi. Oyning haqiqiy kunlar sonidan (`daysInMonth`) oshib ketgan qatorlar ikkala jadval bir xil kunlar to'plami ustidan yig'ilishi uchun chiqarib tashlanadi. Dropdown tashqarisiga bosilganda (`mousedown` tinglagichi) yopiladi.

### 4.4.5. Mavzu (tema): yorug' / qorong'i

**Fayllar:** `components/theme-provider.tsx`, `components/theme-toggle.tsx`, `app/layout.tsx`, `app/globals.css`
**Kutubxona:** `next-themes` (v0.4.6)

**Provider (`app/layout.tsx`):** `ThemeProvider` `attribute="class"`, `defaultTheme="light"`, `enableSystem`, `disableTransitionOnChange` parametrlari bilan ilovani o'raydi. `<html>` da `suppressHydrationWarning` va `lang="uz"` o'rnatilgan.

**Almashtirgich (`components/theme-toggle.tsx`):** header'dagi tugma. Gidratsiya nomuvofiqligining oldini olish uchun `mounted` bo'lguncha barqaror ikonka ko'rsatiladi (server mavzuni bilmaydi). `resolvedTheme === "dark"` holatiga qarab Sun/Moon ikonkalari animatsiya bilan (scale/rotate/opacity) almashadi. `aria-label` va `title` holatga mos: **"Yorug' mavzuga o'tish"** / **"Qorong'i mavzuga o'tish"**.

**Ranglar — "Refined analytics" mavzusi (`app/globals.css`):** barcha ranglar **OKLCH** formatida (yorug'/qorong'i o'rtasida perseptual tekis o'tish uchun). Brend rangi — chuqur indigo (`--primary`), sirt ranglari — issiq-slate. `:root` (yorug', `color-scheme: light`) va `.dark` (qorong'i, `color-scheme: dark`) uchun to'liq CSS o'zgaruvchilari to'plami aniqlangan: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar-*` va boshqalar. `@theme inline` bloki bu o'zgaruvchilarni Tailwind rang tokenlariga (`--color-*`) va radius shkalasiga (`--radius-sm..4xl`, `--radius: 0.7rem`) bog'laydi. `body`ga yuqori-markazda indigo yorug'lik beruvchi `radial-gradient` fon, brendlangan matn selektsiyasi (`::selection`) va nozik skrollbarlar qo'shilgan.

### 4.4.6. Yuklanish skeleti (loading skeleton)

**Fayl:** `app/loading.tsx`

Dashboard marshruti (qayta) yuklanayotganda — masalan oy/davr almashtirishda — darhol ko'rsatiladigan skelet. Ma'lumot olmaydigan sof markap (`animate-pulse` bilan). Tarkibi haqiqiy dashboard tuzilishini takrorlaydi:

- **Header skeleti:** logo, sarlavha, davr tanlagich, eksport, mavzu tugmasi va foydalanuvchi menyusi o'rniga plagsholderlar (`sticky top-0`, `backdrop-blur-xl`).
- **Tablar skeleti:** `h-10 w-72` blok.
- **~8 ta KPI plagsholder:** `grid-cols-2 lg:grid-cols-4` setkada karta shakllari.
- **Jadval plagsholderi:** sarlavha qatori va 8 ta qator (`divide-y`).

Bu skelet oy/davr almashtirishda oq ekran o'rniga darhol vizual javob beradi.

### 4.4.7. Optimistik UI va tezkorlik

**Fayllar:** `components/marketing-table.tsx`, `components/employee-results.tsx`, `app/page.tsx`

- **Optimistik yangilanish:** kunlik ma'lumot kiritishda `useOptimistic` + `useTransition` ishlatiladi (`optimisticMarketing` / `optimisticDaily`). Foydalanuvchi qiymat kiritganda o'zgarish serverdan javob kelishini kutmasdan darhol interfeysga aks etadi; `startTransition` ichida server harakati chaqiriladi.
- **Non-bloking CBU olish (`app/page.tsx`):** `getUsdRate()` promise ma'lumotlar bazasi so'rovlaridan **oldin** boshlanadi (`usdRatePromise`) va faqat oxirida `await` qilinadi, shunday qilib kurs olish DB so'rovlariga parallel ketadi va sahifa render'ini kechiktirmaydi.
- **Parallel ma'lumot olish:** barcha jadvallar (`profiles`, `marketing_daily`, `plan_settings`, `employee_daily`, `employee_plans`) `Promise.all` orqali bir vaqtda so'raladi.
- **Keshni yangilash:** har bir muvaffaqiyatli mutatsiyadan so'ng server harakatida `revalidatePath("/")` chaqiriladi (login/logout uchun `revalidatePath("/", "layout")`), shunda faqat kerakli marshrut qayta hisoblanadi.

---



## 5. Ma'lumotlar modeli (ma'lumotlar bazasi)

RNP Dashboard ma'lumotlari Supabase (PostgreSQL) da `public` sxemasida saqlanadi. Barcha jadvallar `scripts/` katalogidagi raqamlangan SQL migratsiya fayllari orqali yaratiladi va o'zgartiriladi. Barcha pul summalari **USD** (dollar) da saqlanadi; oy identifikatorlari `'YYYY-MM'` matn ko'rinishida (masalan `'2026-07'`).

### 5.1. Jadvallar

#### 5.1.1. `profiles` — foydalanuvchi profillari

Supabase Auth (`auth.users`) foydalanuvchilariga bog'langan. Har bir tizim foydalanuvchisi uchun bitta qator. Manba: `scripts/001_init.sql`.

| Ustun | Tip | Default | Cheklov | Izoh |
|-------|-----|---------|---------|------|
| `id` | `uuid` | — | **PRIMARY KEY**, FK → `auth.users(id)` **ON DELETE CASCADE** | Auth foydalanuvchisi bilan bir xil ID |
| `name` | `text` | — | `NOT NULL` | Foydalanuvchi ismi |
| `login` | `text` | — | `NOT NULL`, **UNIQUE** | Kirish logini (username) |
| `role` | `text` | `'salesperson'` | `NOT NULL`, `CHECK (role in ('super_admin', 'admin', 'salesperson'))` | Rol |
| `created_at` | `timestamptz` | `now()` | `NOT NULL` | Yaratilgan vaqt |

Rollar (`lib/rnp.ts`, `roleLabel()`): `super_admin` → "Bosh admin", `admin` → "Admin", `salesperson` → "Sotuvchi". `super_admin` va `admin` — menejer rollari (`isManagerRole()`).

Login internal email'ga o'giriladi: `loginToEmail()` → `<login>@rnp.local` (`EMAIL_DOMAIN = "rnp.local"`).

#### 5.1.2. `marketing_daily` — marketing kunlik (1-jadval)

Har oyning har kuni uchun bitta qator. Manba: `scripts/001_init.sql`.

| Ustun | Tip | Default | Cheklov | Izoh |
|-------|-----|---------|---------|------|
| `id` | `uuid` | `gen_random_uuid()` | **PRIMARY KEY** | |
| `month` | `text` | — | `NOT NULL` | `'YYYY-MM'` |
| `day` | `int` | — | `NOT NULL`, `CHECK (day between 1 and 31)` | Oy kuni |
| `byudjet` | `numeric` | `0` | `NOT NULL` | Kunlik byudjet (USD) |
| `sifatli` | `int` | `0` | `NOT NULL` | Sifatli lidlar soni |
| `jami_lead` | `int` | `0` | `NOT NULL` | Jami lidlar soni |
| `sotuv` | `int` | `0` | `NOT NULL` | Sotuvlar soni |
| `updated_at` | `timestamptz` | `now()` | `NOT NULL` | |
| — | — | — | **UNIQUE (`month`, `day`)** | Kun bo'yicha yagonalik |

#### 5.1.3. `plan_settings` — reja sozlamalari

Har oy uchun bitta qator; oylik rejalar (KPI maqsadlari). Manba: `scripts/001_init.sql`.

| Ustun | Tip | Default | Cheklov | Izoh |
|-------|-----|---------|---------|------|
| `month` | `text` | — | **PRIMARY KEY** | `'YYYY-MM'` |
| `plan_byudjet` | `numeric` | `0` | `NOT NULL` | Reja byudjet (USD) |
| `plan_lead` | `numeric` | `0` | `NOT NULL` | Reja lidlar soni |
| `plan_sotuv` | `numeric` | `0` | `NOT NULL` | Reja sotuvlar soni |
| `updated_at` | `timestamptz` | `now()` | `NOT NULL` | |

#### 5.1.4. `employee_daily` — hodim kunlik natijalari (2-jadval, drill-down)

Har bir hodim va kun uchun bitta qator. Manba: `scripts/001_init.sql`, `sifatsiz` ustuni `scripts/005_add_sifatsiz.sql` da qo'shilgan.

| Ustun | Tip | Default | Cheklov | Izoh |
|-------|-----|---------|---------|------|
| `id` | `uuid` | `gen_random_uuid()` | **PRIMARY KEY** | |
| `employee_id` | `uuid` | — | `NOT NULL`, FK → `profiles(id)` **ON DELETE CASCADE** | Hodim |
| `month` | `text` | — | `NOT NULL` | `'YYYY-MM'` |
| `day` | `int` | — | `NOT NULL`, `CHECK (day between 1 and 31)` | Oy kuni |
| `gaplashgan` | `int` | `0` | `NOT NULL` | Gaplashgan mijozlar |
| `sifatli` | `int` | `0` | `NOT NULL` | Sifatli lidlar |
| `sifatsiz` | `int` | `0` | `NOT NULL` | Sifatsiz lidlar (005 da qo'shilgan) |
| `aniqlanmagan` | `int` | `0` | `NOT NULL` | Aniqlanmagan lidlar |
| `sotilgan_mijoz` | `int` | `0` | `NOT NULL` | Sotilgan mijozlar soni |
| `sotilgan_mahsulot` | `int` | `0` | `NOT NULL` | Sotilgan mahsulotlar soni |
| `tushum` | `numeric` | `0` | `NOT NULL` | Tushum (USD) |
| `updated_at` | `timestamptz` | `now()` | `NOT NULL` | |
| — | — | — | **UNIQUE (`employee_id`, `month`, `day`)** | Hodim/kun bo'yicha yagonalik |

`sifatsiz` ustuni haqida (005): sotuvchilar endi sifatsiz lidlar sonini bevosita kiritadi; marketing jadvalidagi "Sifatsiz" ustuni shu qiymatdan yig'iladi (ilgari `jami_lead − sifatli` sifatida hisoblanardi).

#### 5.1.5. `employee_plans` — hodimning oylik tushum rejasi

Har bir hodimga har oy uchun daromad (tushum) rejasi. Manba: `scripts/006_employee_plans.sql`.

| Ustun | Tip | Default | Cheklov | Izoh |
|-------|-----|---------|---------|------|
| `employee_id` | `uuid` | — | `NOT NULL`, FK → `profiles(id)` **ON DELETE CASCADE** | Hodim |
| `month` | `text` | — | `NOT NULL` | `'YYYY-MM'` |
| `plan_tushum` | `numeric` | `0` | `NOT NULL` | Oylik daromad rejasi (USD) |
| `updated_at` | `timestamptz` | `now()` | `NOT NULL` | |
| — | — | — | **PRIMARY KEY (`employee_id`, `month`)** | Hodim/oy bo'yicha kompozit kalit |

Bajarilish foizi "Hodimlar natijalari" jadvalida shu hodimning oylik jami `tushum`iga nisbatan ko'rsatiladi.

#### 5.1.6. `_migrations` — migratsiya jurnali (xizmat jadvali)

Idempotentlik uchun qo'llanilgan bir martalik migratsiyalarni belgilaydi. Manba: `scripts/003_usd_conversion.sql`.

| Ustun | Tip | Default | Cheklov |
|-------|-----|---------|---------|
| `name` | `text` | — | **PRIMARY KEY** |
| `applied_at` | `timestamptz` | `now()` | `NOT NULL` |

### 5.2. Row Level Security (RLS) siyosatlari

Quyidagi jadvallarda RLS yoqilgan: `profiles`, `marketing_daily`, `plan_settings`, `employee_daily`, `employee_plans` (007 dan keyin `rnp_storage` ham). Umumiy tamoyil:

- **O'qish (SELECT):** barcha autentifikatsiya qilingan foydalanuvchilar (`to authenticated using (true)`).
- **Yozish (INSERT/UPDATE/DELETE):** faqat menejerlar (`is_manager()`), yagona istisno — `employee_daily` da qatorning egasi ham o'z ma'lumotini yoza oladi.

| Siyosat nomi | Jadval | Amal | `USING` / `WITH CHECK` |
|--------------|--------|------|------------------------|
| `read profiles` | `profiles` | SELECT | `true` |
| `read marketing` | `marketing_daily` | SELECT | `true` |
| `read plan` | `plan_settings` | SELECT | `true` |
| `read employee_daily` | `employee_daily` | SELECT | `true` |
| `read employee_plans` | `employee_plans` | SELECT | `true` |
| `write marketing` | `marketing_daily` | ALL | `public.is_manager()` |
| `write plan` | `plan_settings` | ALL | `public.is_manager()` |
| `write employee_daily` | `employee_daily` | ALL | `public.is_manager() OR employee_id = auth.uid()` |
| `write employee_plans` | `employee_plans` | ALL | `public.is_manager()` |

`employee_daily` yozish siyosati muhim ma'no tashiydi: menejer istalgan hodim qatorini yozadi, sotuvchi esa faqat **o'z** qatorini (`employee_id = auth.uid()`) yozadi.

**Xavfsizlik konteksti (004):** boshlang'ich `001_init.sql` da yozish siyosatlari `using(true) with check(true)` edi — bu har qanday tizimga kirgan foydalanuvchiga (jumladan sotuvchiga) brauzerdagi ochiq anon key orqali byudjet/reja/boshqa hodim ma'lumotlarini o'zgartirishga imkon berardi. `004_rls_hardening.sql` rol tekshiruvini bazaning o'zida (RLS) `is_manager()` orqali bajaradigan qilib qattiqlashtirdi. `read ...` siyosatlari o'zgarmadi.

**`profiles` jadvalida yozish siyosati yo'q:** hodim qo'shish/o'chirish server tomonda **service-role** kaliti bilan bajariladi va RLS'ni butunlay chetlab o'tadi.

#### `is_manager()` funksiyasi

Joriy foydalanuvchi menejer (`super_admin` yoki `admin`) ekanini aniqlaydi. `001_init.sql` da yaratilgan, `004` va `006` da qayta ta'minlanadi (idempotentlik uchun).

```sql
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
```

Muhim xususiyatlar:
- **`SECURITY DEFINER`** — funksiya `profiles` ni egasi huquqi bilan o'qiydi, shu sababli `profiles` ustidagi RLS siyosatlariga **rekursiya qilmaydi**.
- **`STABLE`** va **`set search_path = public`** — barqaror va xavfsiz (search_path manipulyatsiyasidan himoyalangan).
- `authenticated` roliga `execute` grant berilgan.

### 5.3. Migratsiyalar ro'yxati

Migratsiyalar Supabase → SQL Editor da tartib bo'yicha bir marta ishga tushiriladi. Fayllar `scripts/` katalogida.

| Fayl | Vazifasi |
|------|----------|
| `001_init.sql` | Asosiy sxema: `profiles`, `marketing_daily`, `plan_settings`, `employee_daily` jadvallari, RLS yoqilishi, o'qish/yozish siyosatlari, `is_manager()`. Yangi o'rnatish uchun yetarli. |
| `002_roles_migration.sql` | Mavjud bazaga uch rolli tizim (`super_admin`/`admin`/`salesperson`) qo'shadi: eski `profiles_role_check` cheklovini almashtiradi va `login = 'admin'` hisobni `super_admin` ga ko'taradi. Yangi o'rnatishda shart emas. |
| `003_usd_conversion.sql` | Pul birligini so'mdan USD ga o'tkazadi. `_migrations` jadvalini yaratadi (idempotentlik). `employee_daily.tushum` va `marketing_daily.byudjet` qiymatlarini `round(qiymat / rate, 2)` bo'yicha aylantiradi (`rate` — o'sha davrdagi CBU kursi, default `11910`). Faqat eski so'mli bazada; qayta ishga tushirilsa hech narsa qilmaydi. `plan_settings.plan_byudjet` aylantirilmaydi (allaqachon $ deb hisoblanadi). |
| `004_rls_hardening.sql` | RLS xavfsizligini qattiqlashtiradi: `is_manager()` ni qayta ta'minlaydi va `write marketing`, `write plan`, `write employee_daily` siyosatlarini rol tekshiruviga o'tkazadi. Idempotent. |
| `005_add_sifatsiz.sql` | `employee_daily` ga `sifatsiz int not null default 0` ustunini qo'shadi (`add column if not exists`). Idempotent. |
| `006_employee_plans.sql` | `employee_plans` jadvalini (kompozit PK), uning RLS'ini (`read`/`write`) yaratadi; `is_manager()` ni ham qayta ta'minlaydi (jonli baza 004 dan oldingi bo'lishi ehtimoliga qarshi). Idempotent. |
| `007_lock_rnp_storage.sql` | Eski `rnp_storage` KV-store jadvalini qulflaydi (5.4-bo'lim). Idempotent. |

### 5.4. `rnp_storage` jadvali qulflangani (007)

`rnp_storage` — ilovaning eski (relational jadvallardan oldingi) key-value store'i. **Joriy kodda umuman ishlatilmaydi**, lekin unda "public" (hatto anonim foydalanuvchi uchun ham) `INSERT`/`UPDATE`/`SELECT`/`DELETE` siyosatlari mavjud edi — bu spam/suiiste'mol yo'li hisoblangan.

`007_lock_rnp_storage.sql` jadval mavjud bo'lsa (`pg_tables` orqali tekshiradi):
1. `rnp_storage` da RLS ni yoqadi (`enable row level security`);
2. Barcha ochiq siyosatlarni o'chiradi: `"Allow public read"`, `"Allow public insert"`, `"Allow public update"`, `"Allow public delete"`, `"Allow public select"`.

Ma'lumotga tegilmaydi; RLS yoqilib, ochiq siyosatlar olib tashlangach jadvalga faqat **service-role** kira oladi. Idempotent.

### 5.5. MUHIM: `numeric` ustunlar JSON'da STRING sifatida qaytadi

Supabase (PostgREST) `numeric` tipidagi ustunlarni JSON javobida **matn (string)** ko'rinishida qaytaradi (`0` → `"0"`), aniqlik yo'qolmasligi uchun. JavaScript'da `"0"` **truthy** hisoblanadi, shuning uchun bu qiymatlarni hisob-kitobda ishlatishdan oldin `Number()` bilan koersiya qilish **shart**.

Bu quyidagi `numeric` maydonlarga tegishli: `marketing_daily.byudjet`, `plan_settings.plan_byudjet` / `plan_lead` / `plan_sotuv`, `employee_daily.tushum`, `employee_plans.plan_tushum`.

Kodda (`lib/calc.ts`) bu aniq hisobga olingan:

```js
// Supabase returns numeric columns as strings ("0" is truthy!), so coerce first
const rejaLid    = Number(plan?.plan_lead)    || 0
const planByudjet = Number(plan?.plan_byudjet) || 0
const planSotuv   = Number(plan?.plan_sotuv)   || 0
const jamiByudjet = rows.reduce((s, r) => s + Number(r.byudjet), 0)
acc.tushum       += Number(d.tushum)
```

Xuddi shu naqsh server action'larda ham qo'llaniladi (`app/actions/data.ts`): `Number(pl?.plan_sotuv) || 0`, `Number(p.plan_tushum) || 0`. `lib/rnp.ts` dagi TypeScript tiplarda (`MarketingDaily.byudjet`, `EmployeeDaily.tushum`, `PlanSettings.plan_byudjet` va h.k.) bu maydonlar `number` deb e'lon qilingan bo'lsa-da, ishlash vaqtida (runtime) ular string bo'lib kelishi mumkinligi sababli `Number()` koersiyasi majburiy.



---

## 6. Biznes-mantiq — formulalar jamlanmasi

Barcha hosila ko'rsatkichlar `lib/calc.ts`'da hisoblanadi. Quyida yagona jadvalda jamlangan (bo'luvchi 0 bo'lsa natija 0 — barcha bo'lishlar himoyalangan; Supabase `numeric` qiymatlar `Number()` bilan koersiya qilinadi).

### 6.1. Kunlik Ma'lumotlar (marketing)

| Ko'rsatkich | Formula |
|---|---|
| Jami Lead | Sifatli + Sifatsiz |
| Lead Narxi | Byudjet ÷ Jami Lead |
| Sotuv Narxi | Byudjet ÷ Sotuv |
| **Sifat %** | Sifatli ÷ (Sifatli + Sifatsiz) × 100 |
| **Konversiya %** | Sotuv ÷ Sifatli × 100 |
| Reja Lid | `plan_lead` (kunlik sifatli lead rejasi) |
| **Reja %** | Sifatli ÷ Reja Lid × 100 |
| Byudjet reja % (KPI) | Jami Byudjet ÷ `plan_byudjet` × 100 |
| Sifatli reja % (KPI) | Jami Sifatli ÷ (`plan_lead` × oy kunlari) × 100 |
| Tushum reja % (KPI) | Jami Tushum ÷ `plan_sotuv` × 100 |

### 6.2. Hodimlar natijalari

| Ko'rsatkich | Formula |
|---|---|
| **Sifat %** | Sifatli ÷ (Sifatli + Sifatsiz) × 100 |
| **Konversiya %** | Sotilgan mijoz ÷ Sifatli × 100 |
| O'rtacha chek | Tushum ÷ Sotilgan mijoz |
| **Bajarilishi %** | Tushum ÷ Reja × 100 |

### 6.3. Rang chegaralari (foizlar)

| Diapazon | Rang | Ma'no |
|---|---|---|
| < 30% | 🔴 qizil | past |
| 30–60% | 🟡 sariq | o'rta |
| ≥ 60% | 🟢 yashil | yuqori |

Bajarilishi ustuni uchun maxsus chegara: **≥ 100% — yashil**, **≥ 50% — sariq**, past — qizil.



## 7. Nofunksional talablar

### 7.1. Xavfsizlik

**Ikki qatlamli avtorizatsiya (server action + RLS):** har bir yozish operatsiyasi ham server harakatida rol bo'yicha, ham ma'lumotlar bazasi darajasida (Row Level Security) tekshiriladi.

**Rollar (`lib/rnp.ts` — `Role`):**

| Rol | Yorlig'i (`roleLabel`) | Ruxsatlar |
|---|---|---|
| `super_admin` | Bosh admin | To'liq boshqaruv; adminlarni ham qo'sha/o'zgartira/o'chira oladi |
| `admin` | Admin | Dashboard va ma'lumotlarni boshqaradi; faqat sotuvchilarni boshqaradi |
| `salesperson` | Sotuvchi | Faqat o'z kunlik natijalarini kirita oladi |

`isManagerRole(role)` — `super_admin` yoki `admin` bo'lsa `true` qaytaradi (menejer = to'liq ko'rish + ma'lumot boshqarish).

**Server harakatlaridagi tekshiruvlar (`app/actions/data.ts`):**

- `requireManager()` — menejer bo'lmasa **"Ruxsat yo'q"** qaytaradi.
- Xodim yaratish/o'zgartirish/o'chirishda plain `admin` faqat sotuvchilar bilan ishlay oladi; menejer rollarini faqat `super_admin` boshqaradi. Foydalanuvchi o'zini o'chira olmaydi (**"O'zingizni o'chira olmaysiz"**).
- `upsertEmployeeDay` — menejer bo'lmasa faqat `profile.id === input.employee_id` bo'lsa yozadi (aks holda **"Faqat o'z natijalaringizni kirita olasiz"**).

**RLS mustahkamlash (`scripts/004_rls_hardening.sql`):** brauzerdagi ochiq anon key orqali to'g'ridan-to'g'ri yozishning oldini oladi. `public.is_manager()` funksiyasi (`SECURITY DEFINER`, `stable`, `set search_path = public`) joriy foydalanuvchi menejer ekanini bazaning o'zida aniqlaydi. Yozish siyosatlari:

- `marketing_daily` ("write marketing") — faqat `is_manager()`.
- `plan_settings` ("write plan") — faqat `is_manager()`.
- `employee_daily` ("write employee_daily") — `is_manager()` **yoki** `employee_id = auth.uid()` (qatorning egasi).
- O'qish (SELECT, `using(true)`) siyosatlari o'zgarmaydi — tizimga kirgan barcha foydalanuvchilar o'qiy oladi.

**Eski jadvalni qulflash (`scripts/007_lock_rnp_storage.sql`):** ilovaning eski KV-store'i `rnp_storage`da RLS yoqilib, barcha ochiq (anonim) `INSERT/UPDATE/SELECT/DELETE` siyosatlari olib tashlanadi — endi faqat service-role kira oladi. Skript idempotent.

**Service-role faqat serverda:** `createServiceClient()` (`lib/supabase/admin.ts`) `SUPABASE_SERVICE_ROLE_KEY` bilan faqat server harakatlarida ishlatiladi (auth foydalanuvchilarini yaratish/o'chirish uchun). Faylda aniq ogohlantirish: **"NEVER import this into client components."** Klient (`client.ts`), server (`server.ts`) va proxy (`proxy.ts`) klientlari faqat `NEXT_PUBLIC_SUPABASE_ANON_KEY` ishlatadi.

**Seed-adminning env-gated bo'lishi (`app/actions/auth.ts` — `ensureSeedAdmin`):** birinchi super-adminni yaratish faqat `SEED_ADMIN_LOGIN` va `SEED_ADMIN_PASSWORD` (kamida 8 belgi) server-side env o'zgaruvchilari o'rnatilganda ishlaydi. Kredensiallar hech qachon kodda qattiq yozilmaydi. Agar biror menejer allaqachon mavjud bo'lsa, hech narsa qilmaydi — ochiq marshrut hech qachon ma'lum standart hisob yarata olmaydi.

**Kirish validatsiyasi:** server harakatlarida oy `^\d{4}-\d{2}$` (`isValidMonth`), kun `1..daysInMonth(month)` oralig'ida, barcha son qiymatlari `Number.isFinite` va `>= 0` (manfiy emas) tekshiriladi. Parol kamida 6 belgi. Hodim rejalari yig'indisi oylik "Reja Tushum"dan oshmasligi tekshiriladi (fail-closed: oylik rejani o'qib bo'lmasa operatsiya rad etiladi).

**Sessiya himoyasi (`middleware.ts` + `lib/supabase/proxy.ts`):** har bir so'rovda `updateSession` sessiyani yangilaydi; tizimga kirmagan foydalanuvchi `/login`ga, kirgan foydalanuvchi login sahifasidan `/`ga yo'naltiriladi.

### 7.2. Responsivlik (mobil moslashuv)

- **Gorizontal skroll bilan jadvallar:** keng jadvallar `overflow-x-auto` konteyner ichida joylashadi (`marketing-table.tsx`, `employee-results.tsx`, `components/ui/table.tsx`), shunda mobil ekranda sahifaning o'zi gorizontal skroll bo'lmaydi.
- **"Sticky" (yopishqoq) birinchi ustun:** davr/hodim ustuni `sticky left-0 z-10 bg-inherit` bilan chapda qotib turadi — foydalanuvchi jadvalni gorizontal aylantirganda ham qator identifikatori ko'rinib turadi. Jami/Umumiy jami qatorlari ham yopishqoq.
- **Moslashuvchan setkalar:** KPI kartalari `grid-cols-2 lg:grid-cols-4`; kartalarda uzun pul qiymati mobilda kichikroq shrift bilan o'raladi (`sm:truncate sm:text-2xl`), to'liq matn `title` orqali doim ochiladi.
- **Header:** `flex-wrap` bilan tor ekranda o'raladi; eksport tugmasi matni mobilda yashiriladi (`hidden sm:inline`), tablar konteyneri mobilda yashirin skrollbar bilan gorizontal aylanadi.

### 7.3. Xalqarolashtirish (i18n)

- Butun interfeys **o'zbek tilida (lotin)**. `<html lang="uz">` (`app/layout.tsx`).
- Oy nomlari `MONTH_NAMES_UZ` massivi (Yanvar…Dekabr) orqali (`lib/rnp.ts`); `monthLabel`, `monthShortLabel`, `monthNamesUz` yordamchilari.
- Rol yorliqlari o'zbekcha (`roleLabel`): Bosh admin / Admin / Sotuvchi.
- Barcha tugma, dialog, toast va xatolik matnlari o'zbekcha (masalan "Saqlash", "Bekor qilish", "Eksport", "Ruxsat yo'q").
- Sonlar `Intl.NumberFormat` bilan formatlanadi: umumiy sonlar `ru-RU` (mingliklar ajratkichi bilan, `fmt`), USD qiymatlari `en-US` (`fmtUsd`, `fmtUsdPlain`).

### 7.4. Brauzer talablari

- Zamonaviy brauzerlar: **OKLCH** rang formatini va CSS `color-mix(in oklch, ...)` funksiyasini qo'llab-quvvatlaydigan (Chrome/Edge, Safari, Firefox joriy versiyalari).
- CSS `sticky` pozitsiyalash, `backdrop-blur`, moslashuvchan `grid`/`flex` va `prefers-color-scheme` media-so'rovi talab qilinadi (favicon yorug'/qorong'i variantlari, mavzu rangi shunga bog'liq).
- JavaScript yoqilgan bo'lishi shart (interaktiv React 19 klient komponentlari, dialoglar, tanlagichlar).

### 7.5. Ishlash (performance)

- **`revalidatePath`:** har bir muvaffaqiyatli mutatsiyadan keyin faqat kerakli marshrut (`/`) qayta hisoblanadi — butun ilova emas.
- **Non-bloking CBU fetch:** `getUsdRate()` DB so'rovlaridan oldin boshlanib parallel bajariladi, ~3 soniya timeout va sutkalik kesh (`revalidate: 86400`) bilan — sekin/erishib bo'lmaydigan cbu.uz sahifa render'ini bloklamaydi.
- **Parallel DB so'rovlari:** barcha jadval so'rovlari `Promise.all` orqali bir vaqtda.
- **Optimistik UI:** `useOptimistic` + `useTransition` bilan kiritilgan ma'lumot serverdan javob kutmasdan darhol ko'rsatiladi.
- **Instant yuklanish skeleti:** `app/loading.tsx` davr almashtirishda oq ekran o'rniga darhol vizual javob beradi.
- **Statik ranglar va shriftlar:** Geist/Geist Mono shriftlari `next/font/google` orqali (subset: latin), mavzu almashuvida o'tish animatsiyalari o'chirilgan (`disableTransitionOnChange`).

---

Tegishli fayllar (mutlaq yo'llar):
- `/Users/m2air/Desktop/RNP/Intouch/components/plan-settings-dialog.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/lib/export.ts`
- `/Users/m2air/Desktop/RNP/Intouch/lib/cbu.ts`
- `/Users/m2air/Desktop/RNP/Intouch/lib/rnp.ts`
- `/Users/m2air/Desktop/RNP/Intouch/components/period-picker.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/components/theme-toggle.tsx`, `theme-provider.tsx`, `kpi-card.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/app/loading.tsx`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- `/Users/m2air/Desktop/RNP/Intouch/app/actions/data.ts`, `app/actions/auth.ts`
- `/Users/m2air/Desktop/RNP/Intouch/lib/supabase/{admin,server,client,proxy}.ts`, `lib/auth.ts`
- `/Users/m2air/Desktop/RNP/Intouch/scripts/004_rls_hardening.sql`, `scripts/007_lock_rnp_storage.sql`



---

## 8. Lug'at

| Atama | Ma'nosi |
|---|---|
| **Lead** | Potensial mijoz (murojaat) |
| **Sifatli lead** | Talabga javob beradigan, ishlashga arziydigan lead |
| **Sifatsiz lead** | Talabga javob bermaydigan lead |
| **Aniqlanmagan** | Holati hali belgilanmagan murojaat |
| **Jami Lead** | Sifatli + Sifatsiz |
| **Sotuv / Sotilgan mijoz** | Sotib olgan mijoz soni |
| **Sotilgan mahsulot** | Sotilgan mahsulot/xizmat birligi soni |
| **Tushum** | Daromad (USD) |
| **Byudjet** | Marketingga sarflangan mablag' (USD) |
| **Lead Narxi (CPL)** | Bitta lead narxi = Byudjet ÷ Jami Lead |
| **Sotuv Narxi (CPA)** | Bitta sotuv narxi = Byudjet ÷ Sotuv |
| **Sifat %** | Lead sifati: sifatli ÷ jami klassifikatsiyalangan |
| **Konversiya %** | Sotuvga aylanish darajasi |
| **O'rtacha chek** | Bitta mijozdan o'rtacha tushum |
| **Reja Lid** | Kunlik sifatli lead maqsadi (`plan_lead`) |
| **Reja Tushum** | Oylik daromad maqsadi (`plan_sotuv`) |
| **Bajarilishi %** | Rejaning bajarilgan ulushi |
| **MB kursi (CBU)** | Markaziy Bank valyuta kursi (so'm → USD) |
| **RLS** | Row Level Security — ma'lumotlar bazasi darajasidagi kirish nazorati |
| **Menejer** | `super_admin` (Bosh admin) yoki `admin` (Admin) |

---

*Ushbu hujjat loyihaning haqiqiy kod bazasidan (github.com/Islomkurbonovv/Intouch) avtomatik ravishda tuzilgan va joriy holatni aks ettiradi.*


