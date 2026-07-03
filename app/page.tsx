import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { currentMonth, currentYear, daysInMonth } from "@/lib/rnp"
import { getUsdRate } from "@/lib/cbu"
import { Dashboard } from "@/components/dashboard"
import type { Profile, MarketingDaily, PlanSettings, EmployeeDaily } from "@/lib/rnp"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const params = await searchParams
  const isYearly = params.view === "yearly"
  const year =
    params.year && /^\d{4}$/.test(params.year) ? Number(params.year) : currentYear()
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth()

  const supabase = await createClient()

  const usdRatePromise = getUsdRate()

  let employees: Profile[] = []
  let marketing: MarketingDaily[] = []
  let plan: PlanSettings | null = null
  let employeeDaily: EmployeeDaily[] = []

  if (isYearly) {
    const yearLike = `${year}-%`
    const [{ data: emps }, { data: mk }, { data: emp }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("marketing_daily").select("*").like("month", yearLike),
      supabase.from("employee_daily").select("*").like("month", yearLike),
    ])
    employees = (emps as Profile[]) ?? []
    marketing = (mk as MarketingDaily[]) ?? []
    employeeDaily = (emp as EmployeeDaily[]) ?? []
  } else {
    const [{ data: emps }, { data: mk }, { data: pl }, { data: emp }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("marketing_daily").select("*").eq("month", month).order("day"),
      supabase.from("plan_settings").select("*").eq("month", month).maybeSingle(),
      supabase.from("employee_daily").select("*").eq("month", month).order("day"),
    ])
    employees = (emps as Profile[]) ?? []
    marketing = (mk as MarketingDaily[]) ?? []
    plan = (pl as PlanSettings) ?? null
    employeeDaily = (emp as EmployeeDaily[]) ?? []
  }

  // Drop rows whose day exceeds their month's real day-count so the marketing
  // and employee tables aggregate over the exact same set (they'd otherwise
  // disagree — the marketing table only iterates real calendar days).
  const inMonth = <T extends { month: string; day: number }>(rows: T[]) =>
    rows.filter((r) => r.day >= 1 && r.day <= daysInMonth(r.month))
  marketing = inMonth(marketing)
  employeeDaily = inMonth(employeeDaily)

  const usdRate = await usdRatePromise

  return (
    <Dashboard
      profile={profile}
      view={isYearly ? "yearly" : "monthly"}
      month={month}
      year={year}
      employees={employees}
      marketing={marketing}
      plan={plan}
      employeeDaily={employeeDaily}
      usdRate={usdRate}
    />
  )
}
