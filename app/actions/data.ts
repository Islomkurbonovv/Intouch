"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { getCurrentProfile } from "@/lib/auth"
import { loginToEmail, isManagerRole, daysInMonth, type Role } from "@/lib/rnp"

// 'YYYY-MM' shape check used before trusting a client-supplied month.
function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month)
}

type Result = { error?: string; ok?: boolean }

function normRole(r: string): Role {
  if (r === "super_admin") return "super_admin"
  if (r === "admin") return "admin"
  return "salesperson"
}

// Manager = super_admin or admin (can view whole dashboard and manage data).
async function requireManager() {
  const profile = await getCurrentProfile()
  if (!profile || !isManagerRole(profile.role)) return null
  return profile
}

// ---------- Employees (managers only) ----------

export async function createEmployee(formData: FormData): Promise<Result> {
  const me = await requireManager()
  if (!me) return { error: "Ruxsat yo'q" }

  const name = String(formData.get("name") ?? "").trim()
  const login = String(formData.get("login") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = normRole(String(formData.get("role") ?? "salesperson"))

  // Only a super_admin can create other managers.
  if (role !== "salesperson" && me.role !== "super_admin") {
    return { error: "Faqat bosh admin admin qo'sha oladi" }
  }

  if (!name || !login || !password) return { error: "Barcha maydonlarni to'ldiring" }
  if (password.length < 6) return { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }

  const svc = createServiceClient()

  const { data: existing } = await svc.from("profiles").select("id").eq("login", login).maybeSingle()
  if (existing) return { error: "Bu login band" }

  const { data: created, error } = await svc.auth.admin.createUser({
    email: loginToEmail(login),
    password,
    email_confirm: true,
    user_metadata: { name, login },
  })

  if (error || !created.user) {
    return { error: error?.message ?? "Xodim yaratilmadi" }
  }

  const { error: pErr } = await svc.from("profiles").insert({
    id: created.user.id,
    name,
    login,
    role,
  })

  if (pErr) {
    await svc.auth.admin.deleteUser(created.user.id)
    return { error: pErr.message }
  }

  revalidatePath("/")
  return { ok: true }
}

export async function updateEmployee(formData: FormData): Promise<Result> {
  const me = await requireManager()
  if (!me) return { error: "Ruxsat yo'q" }

  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const login = String(formData.get("login") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = normRole(String(formData.get("role") ?? "salesperson"))

  if (!id || !name || !login) return { error: "Barcha maydonlarni to'ldiring" }

  const svc = createServiceClient()

  // Fetch the target's current role to enforce permissions.
  const { data: target } = await svc.from("profiles").select("role").eq("id", id).maybeSingle()
  const targetRole = target ? normRole(String(target.role)) : "salesperson"

  // A plain admin cannot touch managers, nor promote anyone to a manager role.
  if (me.role !== "super_admin") {
    if (targetRole !== "salesperson" || role !== "salesperson") {
      return { error: "Faqat bosh admin adminlarni boshqara oladi" }
    }
  }

  const { data: existing } = await svc
    .from("profiles")
    .select("id")
    .eq("login", login)
    .neq("id", id)
    .maybeSingle()
  if (existing) return { error: "Bu login band" }

  const { error: pErr } = await svc.from("profiles").update({ name, login, role }).eq("id", id)
  if (pErr) return { error: pErr.message }

  const authUpdate: { email: string; password?: string } = { email: loginToEmail(login) }
  if (password) {
    if (password.length < 6) return { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }
    authUpdate.password = password
  }
  const { error: aErr } = await svc.auth.admin.updateUserById(id, authUpdate)
  if (aErr) return { error: aErr.message }

  revalidatePath("/")
  return { ok: true }
}

export async function deleteEmployee(id: string): Promise<Result> {
  const me = await requireManager()
  if (!me) return { error: "Ruxsat yo'q" }
  if (id === me.id) return { error: "O'zingizni o'chira olmaysiz" }

  const svc = createServiceClient()

  const { data: target } = await svc.from("profiles").select("role").eq("id", id).maybeSingle()
  const targetRole = target ? normRole(String(target.role)) : "salesperson"

  // A plain admin can only delete salespeople.
  if (me.role !== "super_admin" && targetRole !== "salesperson") {
    return { error: "Faqat bosh admin adminlarni o'chira oladi" }
  }

  const { error } = await svc.auth.admin.deleteUser(id) // cascades to profiles + employee_daily
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}

// ---------- Marketing daily: only the budget is entered here now ----------
// (Sifatli / Jami Lead / Sotuv are aggregated from employees, not stored here.)

export async function upsertMarketingDay(input: {
  month: string
  day: number
  byudjet: number
}): Promise<Result> {
  const me = await requireManager()
  if (!me) return { error: "Ruxsat yo'q" }

  if (!isValidMonth(input.month)) return { error: "Noto'g'ri oy" }
  if (input.day < 1 || input.day > daysInMonth(input.month)) {
    return { error: "Noto'g'ri kun" }
  }
  if (!Number.isFinite(input.byudjet) || input.byudjet < 0) {
    return { error: "Byudjet manfiy bo'lishi mumkin emas" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("marketing_daily").upsert(
    {
      month: input.month,
      day: input.day,
      byudjet: input.byudjet,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month,day" },
  )
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}

// ---------- Plan settings (managers only) ----------

export async function upsertPlanSettings(input: {
  month: string
  plan_byudjet: number
  plan_lead: number
  plan_sotuv: number
}): Promise<Result> {
  const me = await requireManager()
  if (!me) return { error: "Ruxsat yo'q" }

  const supabase = await createClient()
  const { error } = await supabase.from("plan_settings").upsert(
    {
      month: input.month,
      plan_byudjet: input.plan_byudjet,
      plan_lead: input.plan_lead,
      plan_sotuv: input.plan_sotuv,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month" },
  )
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}

// ---------- Employee daily (own, or a manager) ----------

export async function upsertEmployeeDay(input: {
  employee_id: string
  month: string
  day: number
  gaplashgan: number
  sifatli: number
  aniqlanmagan: number
  sotilgan_mijoz: number
  sotilgan_mahsulot: number
  tushum: number
}): Promise<Result> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Ruxsat yo'q" }
  if (!isManagerRole(profile.role) && profile.id !== input.employee_id) {
    return { error: "Faqat o'z natijalaringizni kirita olasiz" }
  }

  if (!isValidMonth(input.month)) return { error: "Noto'g'ri oy" }
  if (input.day < 1 || input.day > daysInMonth(input.month)) {
    return { error: "Noto'g'ri kun" }
  }
  const nums = [
    input.gaplashgan,
    input.sifatli,
    input.aniqlanmagan,
    input.sotilgan_mijoz,
    input.sotilgan_mahsulot,
    input.tushum,
  ]
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
    return { error: "Qiymatlar manfiy bo'lishi mumkin emas" }
  }
  if (input.sifatli > input.gaplashgan) {
    return { error: "Sifatli lidlar gaplashgan lidlardan ko'p bo'lishi mumkin emas" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("employee_daily").upsert(
    {
      employee_id: input.employee_id,
      month: input.month,
      day: input.day,
      gaplashgan: input.gaplashgan,
      sifatli: input.sifatli,
      aniqlanmagan: input.aniqlanmagan,
      sotilgan_mijoz: input.sotilgan_mijoz,
      sotilgan_mahsulot: input.sotilgan_mahsulot,
      tushum: input.tushum,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,month,day" },
  )
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}
