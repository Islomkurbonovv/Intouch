// Shared types and helpers for the RNP Dashboard

export type Role = "admin" | "salesperson"

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

// Number of days in a 'YYYY-MM' month
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}

// List of last N months (including current), newest first, as 'YYYY-MM'
export function recentMonths(count = 12) {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
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

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number)
  return `${MONTH_NAMES_UZ[m - 1]} ${y}`
}

// Format a number with thousands separators (uz-style spaces)
export function fmt(n: number) {
  if (n === null || n === undefined || Number.isNaN(n)) return "0"
  return new Intl.NumberFormat("ru-RU").format(Math.round(n))
}

// Format currency (so'm)
export function fmtSom(n: number) {
  return `${fmt(n)} so'm`
}

// Percentage helper
export function pct(part: number, whole: number) {
  if (!whole) return 0
  return (part / whole) * 100
}
