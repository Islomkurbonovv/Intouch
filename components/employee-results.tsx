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
import { MoneyCurrencyToggle } from "@/components/money-currency-toggle"
import { upsertEmployeeDay } from "@/app/actions/data"
import { fmt, fmtUsd, fmtUsdPlain, somToUsd, toUsd, isManagerRole } from "@/lib/rnp"
import { aggregateEmployee, employeeDerived, emptyAgg, type EmployeeAgg } from "@/lib/calc"
import type {
  Profile,
  EmployeeDaily,
  Period,
  Granularity,
  InputCurrency,
} from "@/lib/rnp"

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

const COLS = 11

export function EmployeeResults({
  month,
  periods,
  granularity,
  periodHeader,
  employees,
  employeeDaily,
  profile,
  canEditData,
  usdRate,
}: {
  month: string
  periods: Period[]
  granularity: Granularity
  periodHeader: string
  employees: Profile[]
  employeeDaily: EmployeeDaily[]
  profile: Profile
  canEditData: boolean
  usdRate: number
}) {
  const isManager = isManagerRole(profile.role)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<DayDraft>(EMPTY_DRAFT)
  const [tushumCurrency, setTushumCurrency] = useState<InputCurrency>("USD")
  const [pending, startTransition] = useTransition()

  const dailyByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeDaily[]>()
    for (const d of employeeDaily) {
      const arr = m.get(d.employee_id) ?? []
      arr.push(d)
      m.set(d.employee_id, arr)
    }
    return m
  }, [employeeDaily])

  const aggByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeAgg>()
    for (const emp of employees) {
      m.set(emp.id, aggregateEmployee(dailyByEmployee.get(emp.id) ?? []))
    }
    return m
  }, [employees, dailyByEmployee])

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

  const visibleEmployees = isManager ? employees : employees.filter((e) => e.id === profile.id)

  function canEdit(empId: string) {
    return canEditData && granularity === "day" && (isManager || profile.id === empId)
  }

  // Aggregate one employee's rows for a given period key
  function periodAgg(empId: string, periodKey: string): EmployeeAgg {
    const rows = (dailyByEmployee.get(empId) ?? []).filter((r) =>
      granularity === "day" ? String(r.day) === periodKey : r.month === periodKey,
    )
    return aggregateEmployee(rows)
  }

  function toggleExpand(empId: string) {
    setEditKey(null)
    setExpandedId((cur) => (cur === empId ? null : empId))
  }

  function startEdit(empId: string, periodKey: string) {
    const agg = periodAgg(empId, periodKey)
    setEditKey(periodKey)
    setTushumCurrency("USD")
    setDraft({
      gaplashgan: agg.gaplashgan ? String(agg.gaplashgan) : "",
      sifatli: agg.sifatli ? String(agg.sifatli) : "",
      aniqlanmagan: agg.aniqlanmagan ? String(agg.aniqlanmagan) : "",
      sotilgan_mijoz: agg.sotilgan_mijoz ? String(agg.sotilgan_mijoz) : "",
      sotilgan_mahsulot: agg.sotilgan_mahsulot ? String(agg.sotilgan_mahsulot) : "",
      tushum: agg.tushum ? String(agg.tushum) : "",
    })
  }

  function saveDay(empId: string, periodKey: string) {
    // Revenue is stored in USD; a so'm amount is converted at the CBU rate.
    const tushumUsd = toUsd(Number(draft.tushum) || 0, tushumCurrency, usdRate)
    startTransition(async () => {
      const res = await upsertEmployeeDay({
        employee_id: empId,
        month,
        day: Number(periodKey),
        gaplashgan: Number(draft.gaplashgan) || 0,
        sifatli: Number(draft.sifatli) || 0,
        aniqlanmagan: Number(draft.aniqlanmagan) || 0,
        sotilgan_mijoz: Number(draft.sotilgan_mijoz) || 0,
        sotilgan_mahsulot: Number(draft.sotilgan_mahsulot) || 0,
        tushum: tushumUsd,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${periodKey}-kun saqlandi`)
      setEditKey(null)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Jami gaplashgan lid" value={fmt(totals.gaplashgan)} icon={Users} tone="default" />
        <KpiCard label="Jami sotilgan mijoz" value={fmt(totals.sotilgan_mijoz)} icon={ShoppingCart} tone="success" />
        <KpiCard label="Jami tushum" value={fmtUsd(totals.tushum)} icon={DollarSign} tone="primary" />
        <KpiCard label="O'rtacha konversiya %" value={`${fmt(totalsDerived.konversiyaPct)}%`} icon={Percent} tone="warning" />
      </div>

      {!isManager ? (
        <Card className="border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Siz {canEditData ? "o'z natijalaringizni kiritasiz" : "o'z natijalaringizni ko'rasiz"}. Umumiy jami barcha hodimlar bo&apos;yicha.
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

                return (
                  <Fragment key={emp.id}>
                    <TableRow className={isOpen ? "bg-accent/30" : ""}>
                      <TableCell className="w-8">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleExpand(emp.id)} aria-label={isOpen ? "Yopish" : "Ochish"}>
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                      <TableCell className="text-right tabular-nums">{fmtUsdPlain(agg.tushum)}</TableCell>
                      <TableCell className="text-right"><PctBadge value={der.sifatPct} /></TableCell>
                      <TableCell className="text-right"><PctBadge value={der.konversiyaPct} /></TableCell>
                      <TableCell className="text-right tabular-nums">{fmtUsdPlain(der.ortachaChek)}</TableCell>
                    </TableRow>

                    {isOpen ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLS} className="bg-muted/30 p-0">
                          <div className="p-3">
                            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                              {emp.name} — {periodHeader.toLowerCase()} bo&apos;yicha
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-border bg-card">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/40">
                                    <TableHead className="w-16">{periodHeader}</TableHead>
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
                                  {periods.map((period) => {
                                    const pAgg = periodAgg(emp.id, period.key)
                                    const isEditing = editable && editKey === period.key
                                    const has = pAgg.gaplashgan > 0 || pAgg.tushum > 0 || pAgg.sotilgan_mijoz > 0

                                    if (isEditing) {
                                      return (
                                        <TableRow key={period.key} className="bg-accent/40">
                                          <TableCell className="font-medium">{period.label}</TableCell>
                                          <TableCell><Input type="number" value={draft.gaplashgan} onChange={(e) => setDraft({ ...draft, gaplashgan: e.target.value })} className="h-8 w-20 text-right" aria-label="Gaplashgan" /></TableCell>
                                          <TableCell><Input type="number" value={draft.sifatli} onChange={(e) => setDraft({ ...draft, sifatli: e.target.value })} className="h-8 w-20 text-right" aria-label="Sifatli" /></TableCell>
                                          <TableCell><Input type="number" value={draft.aniqlanmagan} onChange={(e) => setDraft({ ...draft, aniqlanmagan: e.target.value })} className="h-8 w-20 text-right" aria-label="Aniqlanmagan" /></TableCell>
                                          <TableCell><Input type="number" value={draft.sotilgan_mijoz} onChange={(e) => setDraft({ ...draft, sotilgan_mijoz: e.target.value })} className="h-8 w-20 text-right" aria-label="Sotilgan mijoz" /></TableCell>
                                          <TableCell><Input type="number" value={draft.sotilgan_mahsulot} onChange={(e) => setDraft({ ...draft, sotilgan_mahsulot: e.target.value })} className="h-8 w-20 text-right" aria-label="Sotilgan mahsulot" /></TableCell>
                                          <TableCell>
                                            <div className="flex flex-col items-end gap-1">
                                              <div className="flex items-center gap-1">
                                                <Input type="number" inputMode="decimal" value={draft.tushum} onChange={(e) => setDraft({ ...draft, tushum: e.target.value })} className="h-8 w-24 text-right" aria-label={tushumCurrency === "UZS" ? "Tushum (so'm)" : "Tushum ($)"} />
                                                <MoneyCurrencyToggle value={tushumCurrency} onChange={setTushumCurrency} rate={usdRate} />
                                              </div>
                                              {tushumCurrency === "UZS" && usdRate ? (
                                                <span className="text-[10px] tabular-nums text-muted-foreground">≈ ${fmtUsdPlain(somToUsd(Number(draft.tushum) || 0, usdRate))}</span>
                                              ) : null}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                              <Button size="icon" className="h-8 w-8" onClick={() => saveDay(emp.id, period.key)} disabled={pending} aria-label="Saqlash"><Check className="h-4 w-4" /></Button>
                                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditKey(null)} disabled={pending} aria-label="Bekor qilish"><X className="h-4 w-4" /></Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    }

                                    return (
                                      <TableRow key={period.key} className={has ? "" : "text-muted-foreground"}>
                                        <TableCell className="font-medium">{period.label}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(pAgg.gaplashgan)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(pAgg.sifatli)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(pAgg.aniqlanmagan)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(pAgg.sotilgan_mijoz)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(pAgg.sotilgan_mahsulot)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtUsdPlain(pAgg.tushum)}</TableCell>
                                        {editable ? (
                                          <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(emp.id, period.key)} aria-label={`${period.label} tahrirlash`}>
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

              {/* Totals row */}
              {visibleEmployees.length > 0 ? (
                <TableRow className="border-t-2 bg-muted/40 font-semibold">
                  <TableCell className="w-8" />
                  <TableCell className="sticky left-0 z-10 bg-muted/40">Umumiy jami</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.gaplashgan)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sifatli)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.aniqlanmagan)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sotilgan_mijoz)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totals.sotilgan_mahsulot)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUsdPlain(totals.tushum)}</TableCell>
                  <TableCell className="text-right"><PctBadge value={totalsDerived.sifatPct} /></TableCell>
                  <TableCell className="text-right"><PctBadge value={totalsDerived.konversiyaPct} /></TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUsdPlain(totalsDerived.ortachaChek)}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
