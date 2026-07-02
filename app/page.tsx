import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { currentMonth } from "@/lib/rnp"
import { Dashboard } from "@/components/dashboard"
import type {
  Profile,
  MarketingDaily,
  PlanSettings,
  EmployeeDaily,
} from "@/lib/rnp"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const params = await searchParams
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth()

  const supabase = await createClient()

  const [{ data: employees }, { data: marketing }, { data: plan }, { data: empDaily }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("marketing_daily").select("*").eq("month", month).order("day"),
      supabase.from("plan_settings").select("*").eq("month", month).maybeSingle(),
      supabase.from("employee_daily").select("*").eq("month", month).order("day"),
    ])

  return (
    <Dashboard
      profile={profile}
      month={month}
      employees={(employees as Profile[]) ?? []}
      marketing={(marketing as MarketingDaily[]) ?? []}
      plan={(plan as PlanSettings) ?? null}
      employeeDaily={(empDaily as EmployeeDaily[]) ?? []}
    />
  )
}
