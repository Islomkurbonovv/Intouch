"use client"

import { useMemo, useState, useTransition } from "react"
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
import { upsertMarketingDay } from "@/app/actions/data"
import { fmt, fmtSom } from "@/lib/rnp"
import { marketingRow, marketingTotals } from "@/lib/calc"
import type { MarketingDaily, PlanSettings } from "@/lib/rnp"

type EditState = {
  byudjet: string
  sifatli: string
  jami_lead: string
  sotuv: string
}

export function MarketingTable({
  month,
  monthDays,
  marketing,
  plan,
  canEdit,
}: {
  month: string
  monthDays: number
  marketing: MarketingDaily[]
  plan: PlanSettings | null
  canEdit: boolean
}) {
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [draft, setDraft] = useState<EditState>({
    byudjet: "",
    sifatli: "",
    jami_lead: "",
    sotuv: "",
  })
  const [pending, startTransition] = useTransition()

  // Map day -> row for quick lookup
  const byDay = useMemo(() => {
    const m = new Map<number, MarketingDaily>()
    for (const r of marketing) m.set(r.day, r)
    return m
  }, [marketing])

  const totals = useMemo(() => marketingTotals(marketing, plan), [marketing, plan])

  const days = Array.from({ length: monthDays }, (_, i) => i + 1)

  function startEdit(day: number) {
    const r = byDay.get(day)
    setEditingDay(day)
    setDraft({
      byudjet: r ? String(r.byudjet) : "",
      sifatli: r ? String(r.sifatli) : "",
      jami_lead: r ? String(r.jami_lead) : "",
      sotuv: r ? String(r.sotuv) : "",
    })
  }

  function cancelEdit() {
    setEditingDay(null)
  }

  function save(day: number) {
    startTransition(async () => {
      const res = await upsertMarketingDay({
        month,
        day,
        byudjet: Number(draft.byudjet) || 0,
        sifatli: Number(draft.sifatli) || 0,
        jami_lead: Number(draft.jami_lead) || 0,
        sotuv: Number(draft.sotuv) || 0,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${day}-kun saqlandi`)
      setEditingDay(null)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Jami Byudjet" value={fmtSom(totals.jamiByudjet)} icon={DollarSign} tone="primary" />
        <KpiCard label="Sifatli Lead" value={fmt(totals.jamiSifatli)} icon={BadgeCheck} tone="success" />
        <KpiCard label="Jami Lead" value={fmt(totals.jamiLead)} icon={Users} tone="default" />
        <KpiCard label="Jami Sotuv" value={fmt(totals.jamiSotuv)} icon={ShoppingCart} tone="success" />
        <KpiCard label="O'rtacha Lead Narxi" value={fmtSom(totals.ortLeadNarxi)} icon={TrendingDown} tone="default" />
        <KpiCard label="O'rtacha Sotuv Narxi" value={fmtSom(totals.ortSotuvNarxi)} icon={Receipt} tone="default" />
        <KpiCard label="Reja Bajarilishi %" value={`${fmt(totals.rejaBajarilishi)}%`} icon={Target} tone="warning" />
        <KpiCard label="Reja Lid" value={fmt(totals.rejaLid)} icon={ListChecks} tone="primary" />
      </div>

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
                <TableHead className="sticky left-0 z-10 bg-muted/50">Kun</TableHead>
                <TableHead className="text-right">Byudjet ($)</TableHead>
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
              {days.map((day) => {
                const r = byDay.get(day)
                const base: MarketingDaily = r ?? {
                  id: `empty-${day}`,
                  month,
                  day,
                  byudjet: 0,
                  sifatli: 0,
                  jami_lead: 0,
                  sotuv: 0,
                }
                const d = marketingRow(base, plan, monthDays)
                const isEditing = editingDay === day

                if (isEditing) {
                  return (
                    <TableRow key={day} className="bg-accent/40">
                      <TableCell className="sticky left-0 z-10 bg-accent/40 font-medium">
                        {day}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={draft.byudjet}
                          onChange={(e) => setDraft({ ...draft, byudjet: e.target.value })}
                          className="h-8 w-24 text-right"
                          aria-label="Byudjet"
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
                      <TableCell className="text-right text-muted-foreground">
                        {fmt((Number(draft.jami_lead) || 0) - (Number(draft.sifatli) || 0))}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={draft.jami_lead}
                          onChange={(e) => setDraft({ ...draft, jami_lead: e.target.value })}
                          className="h-8 w-20 text-right"
                          aria-label="Jami Lead"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={draft.sotuv}
                          onChange={(e) => setDraft({ ...draft, sotuv: e.target.value })}
                          className="h-8 w-20 text-right"
                          aria-label="Sotuv"
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground" colSpan={4}>
                        Avto-hisob
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmt(d.rejaLid)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => save(day)}
                            disabled={pending}
                            aria-label="Saqlash"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={cancelEdit}
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
                  <TableRow key={day} className={r ? "" : "text-muted-foreground"}>
                    <TableCell className="sticky left-0 z-10 bg-card font-medium">{day}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(base.byudjet))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(base.sifatli)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.sifatsiz)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(base.jami_lead)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(base.sotuv)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.leadNarxi)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.sotuvNarxi)}</TableCell>
                    <TableCell className="text-right">
                      <PctBadge value={d.sifatPct} />
                    </TableCell>
                    <TableCell className="text-right">
                      <PctBadge value={d.konversiyaPct} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.rejaLid)}</TableCell>
                    <TableCell className="text-right">
                      <PctBadge value={d.rejaPct} />
                    </TableCell>
                    {canEdit ? (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(day)}
                          aria-label={`${day}-kunni tahrirlash`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}

              {/* Totals row */}
              <TableRow className="border-t-2 bg-muted/40 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-muted/40">Jami</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiByudjet)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiSifatli)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(totals.jamiLead - totals.jamiSifatli)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiLead)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.jamiSotuv)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.ortLeadNarxi)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.ortSotuvNarxi)}</TableCell>
                <TableCell className="text-right tabular-nums" colSpan={2}>
                  —
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.rejaLid)}</TableCell>
                <TableCell className="text-right">
                  <PctBadge value={totals.rejaBajarilishi} />
                </TableCell>
                {canEdit ? <TableCell /> : null}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
