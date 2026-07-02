"use client"

import { Fragment, useMemo, useState, useTransition } from "react"
import {
  ChevronRight,
  ChevronDown,
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KpiCard } from "@/components/kpi-card"
import { PctBadge } from "@/components/pct-badge"
import { upsertEmployeeDay } from "@/app/actions/data"
import { fmt, fmtSom } from "@/lib/rnp"
import {
  aggregateEmployee,
  employeeDerived,
  emptyAgg,
  type EmployeeAgg,
} from "@/lib/calc"
import type { Profile, EmployeeDaily } from "@/lib/rnp"

type DayDraft = {
  gaplashgan: string
  sifatli: string
  aniqlanmagan: string
  sotilgan_mijoz: string
  sotilgan_mahsulot: string
  tushum: string
}

const EMPTY_DRAFT: DayDraft = {
  gaplashgan: "",
  sifatli: "",
  aniqlanmagan: "",
  sotilgan_mijoz: "",
  sotilgan_mahsulot: "",
  tushum: "",
}

// Total number of columns in the main table (for colSpan on expanded rows)
const COLS = 11

export function EmployeeResults({
  month,
  monthDays,
  employees,
  employeeDaily,
  profile,
}: {
  month: string
  monthDays: number
  employees: Profile[]
  employeeDaily: EmployeeDaily[]
  profile: Profile
}) {
  const isAdmin = profile.role === "admin"
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDay, setEditDay] = useState<number | null>(null)
  const [draft, setDraft] = useState<DayDraft>(EMPTY_DRAFT)
  const [pending, startTransition] = useTransition()

  // Group daily rows by employee id
  const dailyByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeDaily[]>()
    for (const d of employeeDaily) {
      const arr = m.get(d.employee_id) ?? []
      arr.push(d)
      m.set(d.employee_id, arr)
    }
    return m
  }, [employeeDaily])

  // Aggregates per employee
  const aggByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeAgg>()
    for (const emp of employees) {
      m.set(emp.id, aggregateEmployee(dailyByEmployee.get(emp.id) ?? []))
    }
    return m
  }, [employees, dailyByEmployee])

  // Overall totals (across ALL salespeople — this is the "umumiy jami")
  const totals = useMemo(() => {
    const acc = emptyAgg()
    for (const emp of employees) {
      const a = aggByEmployee.get(emp.id) ?? emptyAgg()
      acc.gaplashgan += a.gaplashgan
      acc.sifatli += a.sifatli
      acc.aniqlanmagan += a.aniqlanmagan
      acc.sotilgan_mijoz += a.sotilgan_mijoz
      acc.sotilgan_mahsulot += a.sotilgan_mahsulot
      acc.tushum += a.tushum
    }
    return acc
  }, [employees, aggByEmployee])

  const totalsDerived = employeeDerived(totals)

  // A salesperson sees only their own row + the overall total.
  const visibleEmployees = isAdmin
    ? employees
    : employees.filter((e) => e.id === profile.id)

  function canEdit(empId: string) {
    return isAdmin || profile.id === empId
  }

  function toggleExpand(empId: string) {
    setEditDay(null)
    setExpandedId((cur) => (cur === empId ? null : empId))
  }

  function startEdit(empId: string, day: number) {
    const row = (dailyByEmployee.get(empId) ?? []).find((d) => d.day === day)
    setEditDay(day)
    setDraft({
      gaplashgan: row ? String(row.gaplashgan) : "",
      sifatli: row ? String(row.sifatli) : "",
      aniqlanmagan: row ? String(row.aniqlanmagan) : "",
      sotilgan_mijoz: row ? String(row.sotilgan_mijoz) : "",
      sotilgan_mahsulot: row ? String(row.sotilgan_mahsulot) : "",
      tushum: row ? String(row.tushum) : "",
    })
  }

  function saveDay(empId: string, day: number) {
    startTransition(async () => {
      const res = await upsertEmployeeDay({
        employee_id: empId,
        month,
        day,
        gaplashgan: Number(draft.gaplashgan) || 0,
        sifatli: Number(draft.sifatli) || 0,
        aniqlanmagan: Number(draft.aniqlanmagan) || 0,
        sotilgan_mijoz: Number(draft.sotilgan_mijoz) || 0,
        sotilgan_mahsulot: Number(draft.sotilgan_mahsulot) || 0,
        tushum: Number(draft.tushum) || 0,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${day}-kun saqlandi`)
      setEditDay(null)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Jami gaplashgan lid" value={fmt(totals.gaplashgan)} icon={Users} tone="default" />
        <KpiCard label="Jami sotilgan mijoz" value={fmt(totals.sotilgan_mijoz)} icon={ShoppingCart} tone="success" />
        <KpiCard label="Jami tushum" value={fmtSom(totals.tushum)} icon={DollarSign} tone="primary" />
        <KpiCard label="O'rtacha konversiya %" value={`${fmt(totalsDerived.konversiyaPct)}%`} icon={Percent} tone="warning" />
      </div>

      {!isAdmin ? (
        <Card className="border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Siz faqat o&apos;z natijalaringizni kirita olasiz. Umumiy jami barcha hodimlar bo&apos;yicha ko&apos;rsatilgan.
        </Card>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead className="sticky left-0 z-10 bg-muted/50">Hodim</TableHead>
                <TableHead className="text-right">Gaplashgan</TableHead>
                <TableHead className="text-right">Sifatli</TableHead>
                <TableHead className="text-right">Aniqlanmagan</TableHead>
                <TableHead className="text-right">Sotilgan mijoz</TableHead>
                <TableHead className="text-right">Sotilgan mahsulot</TableHead>
                <TableHead className="text-right">Tushum</TableHead>
                <TableHead className="text-right">Sifat %</TableHead>
                <TableHead className="text-right">Konversiya %</TableHead>
                <TableHead className="text-right">O&apos;rtacha chek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS} className="py-8 text-center text-muted-foreground">
                    Hodim yo&apos;q. &quot;Hodimlar&quot; bo&apos;limidan sotuvchi qo&apos;shing.
                  </TableCell>
                </TableRow>
              ) : null}

              {visibleEmployees.map((emp) => {
                const agg = aggByEmployee.get(emp.id) ?? emptyAgg()
                const der = employeeDerived(agg)
                const isOpen = expandedId === emp.id
                const editable = canEdit(emp.id)
                const empDays = dailyByEmployee.get(emp.id) ?? []
                const dayMap = new Map(empDays.map((d) => [d.day, d]))

                return (
                  <Fragment key={emp.id}>
                    <TableRow className={isOpen ? "bg-accent/30" : ""}>
                      <TableCell className="w-8">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => toggleExpand(emp.id)}
                          aria-label={isOpen ? "Yopish" : "Kunlarni ochish"}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                        <span className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                            {emp.name.charAt(0).toUpperCase()}
                          </span>
                          {emp.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.gaplashgan)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.sifatli)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.aniqlanmagan)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.sotilgan_mijoz)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.sotilgan_mahsulot)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(agg.tushum)}</TableCell>
                      <TableCell className="text-right">
                        <PctBadge value={der.sifatPct} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PctBadge value={der.konversiyaPct} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(der.ortachaChek)}</TableCell>
                    </TableRow>

                    {isOpen ? (
                      <TableRow key={`${emp.id}-days`} className="hover:bg-transparent">
                        <TableCell colSpan={COLS} className="bg-muted/30 p-0">
                          <div className="p-3">
                            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                              {emp.name} — kunlik taqsimot
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-border bg-card">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/40">
                                    <TableHead className="w-14">Kun</TableHead>
                                    <TableHead className="text-right">Gaplashgan</TableHead>
                                    <TableHead className="text-right">Sifatli</TableHead>
                                    <TableHead className="text-right">Aniqlanmagan</TableHead>
                                    <TableHead className="text-right">Sotilgan mijoz</TableHead>
                                    <TableHead className="text-right">Sotilgan mahsulot</TableHead>
                                    <TableHead className="text-right">Tushum</TableHead>
                                    {editable ? <TableHead className="text-right">Amal</TableHead> : null}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Array.from({ length: monthDays }, (_, i) => i + 1).map((day) => {
                                    const row = dayMap.get(day)
                                    const isEditing = editable && editDay === day

                                    if (isEditing) {
                                      return (
                                        <TableRow key={day} className="bg-accent/40">
                                          <TableCell className="font-medium">{day}</TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={draft.gaplashgan}
                                              onChange={(e) => setDraft({ ...draft, gaplashgan: e.target.value })}
                                              className="h-8 w-20 text-right"
                                              aria-label="Gaplashgan"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={draft.sifatli}
                                              onChange={(e) => setDraft({ ...draft, sifatli: e.target.value })}
                                              className="h-8 w-20 text-right"
                                              aria-label="Sifatli"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={draft.aniqlanmagan}
                                              onChange={(e) => setDraft({ ...draft, aniqlanmagan: e.target.value })}
                                              className="h-8 w-20 text-right"
                                              aria-label="Aniqlanmagan"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={draft.sotilgan_mijoz}
                                              onChange={(e) => setDraft({ ...draft, sotilgan_mijoz: e.target.value })}
                                              className="h-8 w-20 text-right"
                                              aria-label="Sotilgan mijoz"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={draft.sotilgan_mahsulot}
                                              onChange={(e) => setDraft({ ...draft, sotilgan_mahsulot: e.target.value })}
                                              className="h-8 w-20 text-right"
                                              aria-label="Sotilgan mahsulot"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              inputMode="decimal"
                                              value={draft.tushum}
                                              onChange={(e) => setDraft({ ...draft, tushum: e.target.value })}
                                              className="h-8 w-24 text-right"
                                              aria-label="Tushum"
                                            />
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                              <Button
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => saveDay(emp.id, day)}
                                                disabled={pending}
                                                aria-label="Saqlash"
                                              >
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={() => setEditDay(null)}
                                                disabled={pending}
                                                aria-label="Bekor qilish"
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    }

                                    return (
                                      <TableRow key={day} className={row ? "" : "text-muted-foreground"}>
                                        <TableCell className="font-medium">{day}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(row?.gaplashgan ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(row?.sifatli ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(row?.aniqlanmagan ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(row?.sotilgan_mijoz ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(row?.sotilgan_mahsulot ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(Number(row?.tushum ?? 0))}</TableCell>
                                        {editable ? (
                                          <TableCell className="text-right">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-8 w-8"
                                              onClick={() => startEdit(emp.id, day)}
                                              aria-label={`${day}-kunni tahrirlash`}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        ) : null}
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })}

              {/* Totals row (overall — all salespeople) */}
              {visibleEmployees.length > 0 ? (
                <TableRow className="border-t-2 bg-muted/40 font-semibold">
                  <TableCell className="w-8" />
                  <TableCell className="sticky left-0 z-10 bg-muted/40">Umumiy jami</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.gaplashgan)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sifatli)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.aniqlanmagan)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sotilgan_mijoz)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sotilgan_mahsulot)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.tushum)}</TableCell>
                  <TableCell className="text-right">
                    <PctBadge value={totalsDerived.sifatPct} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PctBadge value={totalsDerived.konversiyaPct} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totalsDerived.ortachaChek)}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
