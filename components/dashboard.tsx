"use client"

import { useMemo, useState } from "react"
import { BarChart3, Download, Settings, Target } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import {
  daysInMonth,
  yearMonths,
  monthShortLabel,
  monthLabel,
  isManagerRole,
  roleLabel,
  fmt,
  type Granularity,
  type Period,
  type Profile,
  type MarketingDaily,
  type PlanSettings,
  type EmployeeDaily,
  type EmployeePlan,
} from "@/lib/rnp"
import { exportWorkbook } from "@/lib/export"
import { MarketingTable } from "@/components/marketing-table"
import { EmployeeResults } from "@/components/employee-results"
import { EmployeesManager } from "@/components/employees-manager"
import { PlanSettingsDialog } from "@/components/plan-settings-dialog"
import { EmployeePlansDialog } from "@/components/employee-plans-dialog"
import { PeriodPicker } from "@/components/period-picker"

export function Dashboard({
  profile,
  view,
  month,
  year,
  employees,
  marketing,
  plan,
  employeeDaily,
  employeePlans,
  usdRate,
}: {
  profile: Profile
  view: "monthly" | "yearly"
  month: string
  year: number
  employees: Profile[]
  marketing: MarketingDaily[]
  plan: PlanSettings | null
  employeeDaily: EmployeeDaily[]
  employeePlans: EmployeePlan[]
  usdRate: number
}) {
  const isManager = isManagerRole(profile.role)
  const isYearly = view === "yearly"
  const [tab, setTab] = useState("marketing")

  const monthDays = daysInMonth(month)
  const granularity: Granularity = isYearly ? "month" : "day"

  const periods: Period[] = useMemo(() => {
    if (isYearly) {
      return yearMonths(year).map((m) => ({ key: m, label: monthShortLabel(m) }))
    }
    return Array.from({ length: monthDays }, (_, i) => ({
      key: String(i + 1),
      label: String(i + 1),
    }))
  }, [isYearly, year, monthDays])

  const salespeople = useMemo(
    () => employees.filter((e) => e.role === "salesperson"),
    [employees],
  )

  // Both tables must aggregate the SAME population. page.tsx fetches every
  // employee_daily row regardless of role, so restrict to salespeople here —
  // otherwise a manager with personal daily rows would inflate the marketing
  // KPIs while the employee table/export exclude them, and the tabs disagree.
  const salesEmployeeDaily = useMemo(() => {
    const ids = new Set(salespeople.map((e) => e.id))
    return employeeDaily.filter((d) => ids.has(d.employee_id))
  }, [salespeople, employeeDaily])

  const periodLabel = isYearly ? `${year}-yil` : monthLabel(month)

  function handleExport() {
    try {
      exportWorkbook({ label: periodLabel, marketing, employees: salespeople, employeeDaily: salesEmployeeDaily, employeePlans })
      toast.success("Excel fayli yuklab olindi")
    } catch {
      toast.error("Eksport qilishda xatolik")
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm ring-1 ring-inset ring-white/15">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">RNP Dashboard</h1>
              <p className="text-xs text-muted-foreground">{roleLabel(profile.role)} paneli</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <PeriodPicker view={view} month={month} year={year} />

            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Eksport</span>
            </Button>

            <ThemeToggle />

            <UserMenu profile={profile} />
          </div>
        </div>
        {usdRate ? (
          <div className="mx-auto max-w-7xl px-4 pb-2.5 sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Barcha summalar dollarda · MB kursi 1$ = {fmt(usdRate)} so&apos;m
            </span>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Tabs scroll horizontally on narrow screens instead of overflowing the page */}
            <div className="-mx-1 w-full overflow-x-auto px-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
              <TabsList>
                <TabsTrigger value="marketing">Kunlik Ma&apos;lumotlar</TabsTrigger>
                <TabsTrigger value="employees">Hodimlar natijalari</TabsTrigger>
                {isManager ? <TabsTrigger value="manage">Hodimlar</TabsTrigger> : null}
              </TabsList>
            </div>

            {isManager && tab === "marketing" && !isYearly ? (
              <PlanSettingsDialog month={month} plan={plan}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Reja sozlamalari
                </Button>
              </PlanSettingsDialog>
            ) : null}

            {isManager && tab === "employees" && !isYearly ? (
              <EmployeePlansDialog month={month} employees={salespeople} plans={employeePlans} plan={plan}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Target className="h-4 w-4" aria-hidden="true" />
                  Hodim rejalari
                </Button>
              </EmployeePlansDialog>
            ) : null}
          </div>

          <TabsContent value="marketing" className="mt-0">
            <MarketingTable
              month={month}
              periods={periods}
              granularity={granularity}
              periodHeader={isYearly ? "Oy" : "Kun"}
              marketing={marketing}
              employeeDaily={salesEmployeeDaily}
              plan={isYearly ? null : plan}
              canEdit={isManager && !isYearly}
              usdRate={usdRate}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-0">
            <EmployeeResults
              month={month}
              periods={periods}
              granularity={granularity}
              periodHeader={isYearly ? "Oy" : "Kun"}
              employees={salespeople}
              employeeDaily={salesEmployeeDaily}
              employeePlans={isYearly ? [] : employeePlans}
              profile={profile}
              canEditData={!isYearly}
              usdRate={usdRate}
            />
          </TabsContent>

          {isManager ? (
            <TabsContent value="manage" className="mt-0">
              <EmployeesManager employees={employees} me={profile} />
            </TabsContent>
          ) : null}
        </Tabs>
      </main>
    </div>
  )
}
