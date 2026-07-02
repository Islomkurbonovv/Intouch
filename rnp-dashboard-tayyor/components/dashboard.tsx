"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Download, LogOut, Settings, Users } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/actions/auth"
import { recentMonths, monthLabel, daysInMonth } from "@/lib/rnp"
import type {
  Profile,
  MarketingDaily,
  PlanSettings,
  EmployeeDaily,
} from "@/lib/rnp"
import { exportWorkbook } from "@/lib/export"
import { MarketingTable } from "@/components/marketing-table"
import { EmployeeResults } from "@/components/employee-results"
import { EmployeesManager } from "@/components/employees-manager"
import { PlanSettingsDialog } from "@/components/plan-settings-dialog"

export function Dashboard({
  profile,
  month,
  employees,
  marketing,
  plan,
  employeeDaily,
}: {
  profile: Profile
  month: string
  employees: Profile[]
  marketing: MarketingDaily[]
  plan: PlanSettings | null
  employeeDaily: EmployeeDaily[]
}) {
  const router = useRouter()
  const isAdmin = profile.role === "admin"
  const [tab, setTab] = useState("marketing")
  const months = useMemo(() => recentMonths(12), [])
  const monthDays = daysInMonth(month)

  function changeMonth(m: string) {
    router.push(`/?month=${m}`)
  }

  function handleExport() {
    try {
      exportWorkbook({ month, marketing, plan, employees, employeeDaily, monthDays })
      toast.success("Excel fayli yuklab olindi")
    } catch (e) {
      toast.error("Eksport qilishda xatolik")
    }
  }

  const salespeople = employees.filter((e) => e.role === "salesperson")

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">RNP Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Administrator paneli" : "Hodim paneli"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={changeMonth}>
              <SelectTrigger className="w-[150px] bg-background" aria-label="Oyni tanlash">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Eksport</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  aria-label="Foydalanuvchi menyusi"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">{profile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      @{profile.login}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="marketing">Kunlik Ma&apos;lumotlar</TabsTrigger>
              <TabsTrigger value="employees">Hodimlar natijalari</TabsTrigger>
              {isAdmin ? <TabsTrigger value="manage">Hodimlar</TabsTrigger> : null}
            </TabsList>

            {isAdmin && tab === "marketing" ? (
              <PlanSettingsDialog month={month} plan={plan}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Reja sozlamalari
                </Button>
              </PlanSettingsDialog>
            ) : null}
          </div>

          <TabsContent value="marketing" className="mt-0">
            <MarketingTable
              month={month}
              monthDays={monthDays}
              marketing={marketing}
              plan={plan}
              canEdit={isAdmin}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-0">
            <EmployeeResults
              month={month}
              monthDays={monthDays}
              employees={salespeople}
              employeeDaily={employeeDaily}
              profile={profile}
            />
          </TabsContent>

          {isAdmin ? (
            <TabsContent value="manage" className="mt-0">
              <EmployeesManager employees={employees} currentId={profile.id} />
            </TabsContent>
          ) : null}
        </Tabs>
      </main>
    </div>
  )
}
