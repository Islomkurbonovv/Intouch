"use client"

import { useMemo, useOptimistic, useState, useTransition } from "react"
import {
  DollarSign,
  BadgeCheck,
  Users,
  ShoppingCart,
  TrendingDown,
  Receipt,
  Target,
  ListChecks,
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
import { upsertMarketingDay } from "@/app/actions/data"
import { fmt, fmtPct, fmtUsd, fmtUsdPlain, somToUsd, toUsd } from "@/lib/rnp"
import { marketingRow, marketingTotals, pctKpiTone } from "@/lib/calc"
import type {
  MarketingDaily,
  PlanSettings,
  EmployeeDaily,
  Period,
  Granularity,
  InputCurrency,
} from "@/lib/rnp"

export function MarketingTable({
  month,
  periods,
  granularity,
  periodHeader,
  marketing,
  employeeDaily,
  plan,
  canEdit,
  usdRate,
}: {
  month: string
  periods: Period[]
  granularity: Granularity
  periodHeader: string
  marketing: MarketingDaily[]
  employeeDaily: EmployeeDaily[]
  plan: PlanSettings | null
  canEdit: boolean
  usdRate: number
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draftByudjet, setDraftByudjet] = useState("")
  const [draftCurrency, setDraftCurrency] = useState<InputCurrency>("USD")
  const [pending, startTransition] = useTransition()

  // Optimistic copy of the marketing (budget) rows — a saved budget shows
  // instantly, then reconciles via revalidate. Keyed by (month, day).
  const [optimisticMarketing, applyOptimisticMarketing] = useOptimistic(
    marketing,
    (current: MarketingDaily[], edited: MarketingDaily) => {
      const i = current.findIndex((r) => r.month === edited.month && r.day === edited.day)
      if (i >= 0) {
        const next = current.slice()
        next[i] = edited
        return next
      }
      return [...current, edited]
    },
  )

  const monthDays = granularity === "day" ? periods.length : 1

  // Budget grouped by period key (day number or 'YYYY-MM')
  const byudjetByPeriod = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of optimisticMarketing) {
      const key = granularity === "day" ? String(r.day) : r.month
      m.set(key, (m.get(key) ?? 0) + Number(r.byudjet))
    }
    return m
  }, [optimisticMarketing, granularity])

  // Employee sums grouped by period key (this is the sync source)
  const empByPeriod = useMemo(() => {
    const m = new Map<string, { gaplashgan: number; sifatli: number; sotilgan_mijoz: number; tushum: number }>()
    for (const d of employeeDaily) {
      const key = granularity === "day" ? String(d.day) : d.month
      const cur = m.get(key) ?? { gaplashgan: 0, sifatli: 0, sotilgan_mijoz: 0, tushum: 0 }
      cur.gaplashgan += d.gaplashgan
      cur.sifatli += d.sifatli
      cur.sotilgan_mijoz += d.sotilgan_mijoz
      cur.tushum += Number(d.tushum)
      m.set(key, cur)
    }
    return m
  }, [employeeDaily, granularity])

  // Build a synced MarketingDaily-like row for each period
  const syncedRows = useMemo(() => {
    return periods.map((p) => {
      const emp = empByPeriod.get(p.key) ?? { gaplashgan: 0, sifatli: 0, sotilgan_mijoz: 0, tushum: 0 }
      const row: MarketingDaily = {
        id: `sync-${p.key}`,
        month: granularity === "day" ? month : p.key,
        day: granularity === "day" ? Number(p.key) : 0,
        byudjet: byudjetByPeriod.get(p.key) ?? 0,
        sifatli: emp.sifatli,
        jami_lead: emp.gaplashgan,
        sotuv: emp.sotilgan_mijoz,
      }
      return { period: p, row }
    })
  }, [periods, empByPeriod, byudjetByPeriod, granularity, month])

  // Total revenue (tushum) for the visible periods — drives the revenue plan %.
  const jamiTushum = useMemo(
    () => periods.reduce((s, p) => s + (empByPeriod.get(p.key)?.tushum ?? 0), 0),
    [periods, empByPeriod],
  )

  const totals = useMemo(
    () => marketingTotals(syncedRows.map((s) => s.row), plan, jamiTushum),
    [syncedRows, plan, jamiTushum],
  )

  function startEdit(key: string) {
    setEditingKey(key)
    setDraftCurrency("USD")
    // Round to 2 decimals so a converted USD value shows cleanly (e.g. 176.24, not 176.2362).
    const b = byudjetByPeriod.get(key) ?? 0
    setDraftByudjet(b ? String(Math.round(b * 100) / 100) : "")
  }

  function save(day: number, key: string) {
    // Budget is stored in USD; a so'm amount is converted at the CBU rate.
    const byudjetUsd = toUsd(Number(draftByudjet) || 0, draftCurrency, usdRate)
    // Only byudjet is displayed from marketing rows; the other columns are
    // synced from employee data, so preserve/zero them.
    const existing = optimisticMarketing.find((r) => r.month === month && r.day === day)
    const optimisticRow: MarketingDaily = existing
      ? { ...existing, byudjet: byudjetUsd }
      : { id: `optimistic-${month}-${day}`, month, day, byudjet: byudjetUsd, sifatli: 0, jami_lead: 0, sotuv: 0 }
    startTransition(async () => {
      applyOptimisticMarketing(optimisticRow)
      const res = await upsertMarketingDay({
        month,
        day,
        byudjet: byudjetUsd,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${key}-kun byudjeti saqlandi`)
      setEditingKey(null)
    })
  }

  const COLS = 12 + (canEdit ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Jami Byudjet" value={fmtUsd(totals.jamiByudjet)} icon={DollarSign} tone="primary" />
        <KpiCard label="Jami Lead" value={fmt(totals.jamiLead)} icon={Users} tone="default" />
        <KpiCard label="Sifatli Lead" value={fmt(totals.jamiSifatli)} icon={BadgeCheck} tone="success" />
        <KpiCard label="Jami Sotuv" value={fmt(totals.jamiSotuv)} icon={ShoppingCart} tone="success" />
        <KpiCard label="O'rtacha Lead Narxi" value={fmtUsd(totals.ortLeadNarxi)} icon={TrendingDown} tone="default" />
        <KpiCard label="O'rtacha Sotuv Narxi" value={fmtUsd(totals.ortSotuvNarxi)} icon={Receipt} tone="default" />
        {plan ? (
          <>
            <KpiCard
              label="Byudjet reja %"
              value={`${fmtPct(totals.rejaByudjetPct)}%`}
              icon={Target}
              tone={pctKpiTone(totals.rejaByudjetPct)}
              hint={`Reja: ${fmtUsd(totals.rejaByudjet)}`}
            />
            <KpiCard
              label="Lid reja %"
              value={`${fmtPct(totals.rejaBajarilishi)}%`}
              icon={ListChecks}
              tone={pctKpiTone(totals.rejaBajarilishi)}
              hint={`Reja: ${fmt(totals.rejaLid)} lid`}
            />
            <KpiCard
              label="Tushum reja %"
              value={`${fmtPct(totals.rejaTushumPct)}%`}
              icon={Target}
              tone={pctKpiTone(totals.rejaTushumPct)}
              hint={`${fmtUsd(totals.jamiTushum)} / ${fmtUsd(totals.rejaTushum)}`}
            />
          </>
        ) : null}
      </div>

      <Card className="border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Sifatli, Jami Lead va Sotuv ustunlari sotuvchilar kiritgan ma&apos;lumotlardan avtomatik yig&apos;iladi.
        {canEdit
          ? " Faqat byudjetni siz kiritasiz — $ yoki so'mda (so'm avtomatik dollarga aylanadi). Barcha summalar dollarda ko'rsatiladi."
          : " Barcha summalar dollarda ko'rsatiladi."}
      </Card>

      {!plan && canEdit ? (
        <Card className="border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          Reja hali sozlanmagan. &quot;Reja sozlamalari&quot; tugmasi orqali oylik rejani kiriting.
        </Card>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 z-10 bg-muted/50">{periodHeader}</TableHead>
                <TableHead className="text-right">Byudjet</TableHead>
                <TableHead className="text-right">Sifatli</TableHead>
                <TableHead className="text-right">Sifatsiz</TableHead>
                <TableHead className="text-right">Jami Lead</TableHead>
                <TableHead className="text-right">Sotuv</TableHead>
                <TableHead className="text-right">Lead Narxi</TableHead>
                <TableHead className="text-right">Sotuv Narxi</TableHead>
                <TableHead className="text-right">Sifat %</TableHead>
                <TableHead className="text-right">Konversiya %</TableHead>
                <TableHead className="text-right">Reja Lid</TableHead>
                <TableHead className="text-right">Reja %</TableHead>
                {canEdit ? <TableHead className="text-right">Amal</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncedRows.map(({ period, row }) => {
                const d = marketingRow(row, plan, monthDays)
                const isEditing = editingKey === period.key
                const hasData = row.byudjet > 0 || row.jami_lead > 0

                if (isEditing) {
                  return (
                    <TableRow key={period.key} className="bg-accent hover:bg-accent">
                      <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                        {period.label}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={draftByudjet}
                              onChange={(e) => setDraftByudjet(e.target.value)}
                              className="h-8 w-24 text-right"
                              aria-label={draftCurrency === "UZS" ? "Byudjet (so'm)" : "Byudjet ($)"}
                              autoFocus
                            />
                            <MoneyCurrencyToggle value={draftCurrency} onChange={setDraftCurrency} rate={usdRate} />
                          </div>
                          {draftCurrency === "UZS" && usdRate ? (
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              ≈ ${fmtUsdPlain(somToUsd(Number(draftByudjet) || 0, usdRate))}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(row.sifatli)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(d.sifatsiz)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(row.jami_lead)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(row.sotuv)}</TableCell>
                      <TableCell className="text-right text-muted-foreground" colSpan={6}>
                        Avto-hisob
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" className="h-8 w-8" onClick={() => save(row.day, period.key)} disabled={pending} aria-label="Saqlash">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditingKey(null)} disabled={pending} aria-label="Bekor qilish">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={period.key} className={`bg-card hover:bg-muted ${hasData ? "" : "text-muted-foreground"}`}>
                    <TableCell className="sticky left-0 z-10 bg-inherit font-medium">{period.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUsdPlain(row.byudjet)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(row.sifatli)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.sifatsiz)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(row.jami_lead)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(row.sotuv)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUsdPlain(d.leadNarxi)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUsdPlain(d.sotuvNarxi)}</TableCell>
                    <TableCell className="text-right"><PctBadge value={d.sifatPct} /></TableCell>
                    <TableCell className="text-right"><PctBadge value={d.konversiyaPct} /></TableCell>
                    <TableCell className="text-right tabular-nums">{plan ? fmt(d.rejaLid) : "—"}</TableCell>
                    <TableCell className="text-right">{plan ? <PctBadge value={d.rejaPct} /> : "—"}</TableCell>
                    {canEdit ? (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(period.key)} aria-label={`${period.label} byudjetini tahrirlash`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}

              {/* Totals row */}
              <TableRow className="border-t-2 bg-muted font-semibold hover:bg-muted">
                <TableCell className="sticky left-0 z-10 bg-inherit">Jami</TableCell>
                <TableCell className="text-right tabular-nums">{fmtUsdPlain(totals.jamiByudjet)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiSifatli)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(Math.max(0, totals.jamiLead - totals.jamiSifatli))}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiLead)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiSotuv)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtUsdPlain(totals.ortLeadNarxi)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtUsdPlain(totals.ortSotuvNarxi)}</TableCell>
                <TableCell className="text-right tabular-nums" colSpan={2}>—</TableCell>
                <TableCell className="text-right tabular-nums">{plan ? fmt(totals.rejaLid) : "—"}</TableCell>
                <TableCell className="text-right">{plan ? <PctBadge value={totals.rejaBajarilishi} /> : "—"}</TableCell>
                {canEdit ? <TableCell /> : null}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="sr-only">{COLS} ustun</p>
    </div>
  )
}
