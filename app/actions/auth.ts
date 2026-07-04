"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { loginToEmail } from "@/lib/rnp"

// Optionally seeds a first super-admin so a brand-new deployment is usable.
// SECURITY: credentials come ONLY from server-side env vars — never hardcoded.
// If SEED_ADMIN_LOGIN / SEED_ADMIN_PASSWORD are unset, this is a no-op, so a
// public route can never auto-create a well-known default account.
export async function ensureSeedAdmin() {
  const seedLogin = process.env.SEED_ADMIN_LOGIN?.trim().toLowerCase()
  const seedPassword = process.env.SEED_ADMIN_PASSWORD

  // No seed configured → do nothing.
  if (!seedLogin || !seedPassword || seedPassword.length < 8) return

  const admin = createServiceClient()

  // If any manager (super_admin or admin) already exists, do nothing.
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["super_admin", "admin"])

  if (count && count > 0) return

  const email = loginToEmail(seedLogin)

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: { name: "Administrator", login: seedLogin },
  })

  if (error || !created.user) {
    console.log("[seed] admin error:", error?.message)
    return
  }

  await admin.from("profiles").insert({
    id: created.user.id,
    name: "Administrator",
    login: seedLogin,
    role: "super_admin",
  })
}

export async function login(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const loginName = String(formData.get("login") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!loginName || !password) {
    return { error: "Login va parolni kiriting" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: loginToEmail(loginName),
    password,
  })

  if (error) {
    return { error: "Login yoki parol noto'g'ri" }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
}
