"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { loginToEmail } from "@/lib/rnp"

// Ensures a default admin exists so the app is usable on first run.
// Default credentials: login "admin", password "admin12345".
export async function ensureSeedAdmin() {
  const admin = createServiceClient()

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")

  if (count && count > 0) return

  const login = "admin"
  const password = "admin12345"
  const email = loginToEmail(login)

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Administrator", login },
  })

  if (error || !created.user) {
    console.log("[v0] seed admin error:", error?.message)
    return
  }

  await admin.from("profiles").insert({
    id: created.user.id,
    name: "Administrator",
    login,
    role: "admin",
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
