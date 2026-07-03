// Shared types and helpers for the RNP Dashboard

export type Role = "super_admin" | "admin" | "salesperson"

export function roleLabel(role: Role): string {
  if (role === "super_admin") return "Bosh admin"
  if (role === "admin") return "Admin"
  return "Sotuvchi"
}

// Managers can see the whole dashboard and manage data.
export function isManagerRole(role: Role): boolean {
  return role === "super_admin" || role === "admin"
}

export type Profile = {
  id: string
  name: string
  login: string
  role: Role
  created_at: string
}

export type MarketingDaily = {
  id: string
  month: string
  day: number
  byudjet: number
  sifatli: number
  jami_lead: number
  sotuv: number
}

export type PlanSettings = {
  month: string
  plan_byudjet: number
  plan_lead: number
  plan_sotuv: number
}

export type EmployeeDaily = {
  id: string
  employee_id: string
  month: string
  day: number
  gaplashgan: number
  sifatli: number
  aniqlanmagan: number
  sotilgan_mijoz: number
  sotilgan_mahsulot: number
  tushum: number
}

// A period is either a day (monthly view) or a month (yearly view).
export type Granularity = "day" | "month"
export type Period = { key: string; label: string }

// Logins are usernames; we map them to an internal email for Supabase Auth.
const EMAIL_DOMAIN = "rnp.local"

export function loginToEmail(login: string) {
  return `${login.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

// Current month as 'YYYY-MM'
export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function currentYear() {
  return new Date().getFullYear()
}

// Number of days in a 'YYYY-MM' month
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}

const MONTH_NAMES_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
]

export function monthNamesUz(): string[] {
  return MONTH_NAMES_UZ.slice()
}

// 'YYYY-MM' -> "Iyul 2026"
export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number)
  return `${MONTH_NAMES_UZ[m - 1]} ${y}`
}

// 'YYYY-MM' -> "Iyul"
export function monthShortLabel(month: string) {
  const m = Number(month.split("-")[1])
  return MONTH_NAMES_UZ[m - 1] ?? month
}

// All 12 months of a year as 'YYYY-MM'
export function yearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)
}

// Format a number with thousands separators
export function fmt(n: number) {
  if (n === null || n === undefined || Number.isNaN(n)) return "0"
  return new Intl.NumberFormat("ru-RU").format(Math.round(n))
}

// ---- Currency (base data is stored in so'm; USD is converted via CBU rate) ----

export type Currency = "UZS" | "USD"

export function toCurrency(som: number, currency: Currency, rate: number): number {
  if (currency === "USD") return rate ? som / rate : 0
  return som
}

// Number only, no suffix (for table cells). USD shows up to 2 decimals.
export function fmtCur(som: number, currency: Currency, rate: number): string {
  if (currency === "USD") {
    const v = rate ? som / rate : 0
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v)
  }
  return fmt(som)
}

// With symbol/suffix (for KPI cards and totals).
export function fmtMoney(som: number, currency: Currency, rate: number): string {
  if (currency === "USD") return `$${fmtCur(som, currency, rate)}`
  return `${fmt(som)} so'm`
}

// Legacy helper (kept for any remaining callers)
export function fmtSom(n: number) {
  return `${fmt(n)} so'm`
}

// Percentage helper
export function pct(part: number, whole: number) {
  if (!whole) return 0
  return (part / whole) * 100
}
