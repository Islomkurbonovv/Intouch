"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { getCurrentProfile } from "@/lib/auth"
import { loginToEmail } from "@/lib/rnp"

type Result = { error?: string; ok?: boolean }

async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    return null
  }
  return profile
}

// ---------- Employees (admin only) ----------

export async function createEmployee(formData: FormData): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Ruxsat yo'q" }

  const name = String(formData.get("name") ?? "").trim()
  const login = String(formData.get("login") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "salesperson")

  if (!name || !login || !password) return { error: "Barcha maydonlarni to'ldiring" }
  if (password.length < 6) return { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }

  const svc = createServiceClient()

  // Ensure login is unique
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
    role: role === "admin" ? "admin" : "salesperson",
  })

  if (pErr) {
    // Roll back the auth user if profile insert failed
    await svc.auth.admin.deleteUser(created.user.id)
    return { error: pErr.message }
  }

  revalidatePath("/")
  return { ok: true }
}

export async function updateEmployee(formData: FormData): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Ruxsat yo'q" }

  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const login = String(formData.get("login") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "salesperson")

  if (!id || !name || !login) return { error: "Barcha maydonlarni to'ldiring" }

  const svc = createServiceClient()

  // Uniqueness check (excluding self)
  const { data: existing } = await svc
    .from("profiles")
    .select("id")
    .eq("login", login)
    .neq("id", id)
    .maybeSingle()
  if (existing) return { error: "Bu login band" }

  const { error: pErr } = await svc
    .from("profiles")
    .update({ name, login, role: role === "admin" ? "admin" : "salesperson" })
    .eq("id", id)
  if (pErr) return { error: pErr.message }

  // Update auth email + optional password
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
  const admin = await requireAdmin()
  if (!admin) return { error: "Ruxsat yo'q" }
  if (id === admin.id) return { error: "O'zingizni o'chira olmaysiz" }

  const svc = createServiceClient()
  const { error } = await svc.auth.admin.deleteUser(id) // cascades to profiles + employee_daily
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}

// ---------- Marketing daily (admin only) ----------

export async function upsertMarketingDay(input: {
  month: string
  day: number
  byudjet: number
  sifatli: number
  jami_lead: number
  sotuv: number
}): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Ruxsat yo'q" }

  const supabase = await createClient()
  const { error } = await supabase.from("marketing_daily").upsert(
    {
      month: input.month,
      day: input.day,
      byudjet: input.byudjet,
      sifatli: input.sifatli,
      jami_lead: input.jami_lead,
      sotuv: input.sotuv,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month,day" },
  )
  if (error) return { error: error.message }

  revalidatePath("/")
  return { ok: true }
}

// ---------- Plan settings (admin only) ----------

export async function upsertPlanSettings(input: {
  month: string
  plan_byudjet: number
  plan_lead: number
  plan_sotuv: number
}): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Ruxsat yo'q" }

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

// ---------- Employee daily (own, or admin) ----------

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
  if (profile.role !== "admin" && profile.id !== input.employee_id) {
    return { error: "Faqat o'z natijalaringizni kirita olasiz" }
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
