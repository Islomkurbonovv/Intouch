import type { MarketingDaily, PlanSettings, EmployeeDaily } from "@/lib/rnp"

// ---- Table 1: marketing daily derived values ----

export function marketingRow(m: MarketingDaily, plan: PlanSettings | null, monthDays: number) {
  // Guard against inverted data entry (sifatli > jami_lead) so the derived
  // "unqualified" count can never render negative.
  const sifatsiz = Math.max(0, m.jami_lead - m.sifatli)
  const leadNarxi = m.jami_lead ? m.byudjet / m.jami_lead : 0
  const sotuvNarxi = m.sotuv ? m.byudjet / m.sotuv : 0
  const sifatPct = m.jami_lead ? (m.sifatli / m.jami_lead) * 100 : 0
  const konversiyaPct = m.sifatli ? (m.sotuv / m.sifatli) * 100 : 0

  // Planned leads per day = monthly plan lead spread evenly across days
  const rejaLid = plan && monthDays ? plan.plan_lead / monthDays : 0
  // Reja % for the day = actual leads / planned leads for the day
  const rejaPct = rejaLid ? (m.jami_lead / rejaLid) * 100 : 0

  return { sifatsiz, leadNarxi, sotuvNarxi, sifatPct, konversiyaPct, rejaLid, rejaPct }
}

export function marketingTotals(
  rows: MarketingDaily[],
  plan: PlanSettings | null,
  // Total revenue (tushum, USD) for the period — aggregated from employee data.
  jamiTushum = 0,
) {
  const jamiByudjet = rows.reduce((s, r) => s + Number(r.byudjet), 0)
  const jamiSifatli = rows.reduce((s, r) => s + r.sifatli, 0)
  const jamiLead = rows.reduce((s, r) => s + r.jami_lead, 0)
  const jamiSotuv = rows.reduce((s, r) => s + r.sotuv, 0)
  const ortLeadNarxi = jamiLead ? jamiByudjet / jamiLead : 0
  const ortSotuvNarxi = jamiSotuv ? jamiByudjet / jamiSotuv : 0

  // Plan completion = actual / planned target for the month (guarded against 0 target).
  const rejaBajarilishi = plan && plan.plan_lead ? (jamiLead / plan.plan_lead) * 100 : 0
  const rejaByudjetPct = plan && plan.plan_byudjet ? (jamiByudjet / plan.plan_byudjet) * 100 : 0
  // The sales plan (plan_sotuv) is a REVENUE target in USD, compared to Jami Tushum.
  const rejaTushumPct = plan && plan.plan_sotuv ? (jamiTushum / plan.plan_sotuv) * 100 : 0
  const rejaLid = plan ? plan.plan_lead : 0
  const rejaByudjet = plan ? plan.plan_byudjet : 0
  const rejaTushum = plan ? plan.plan_sotuv : 0

  return {
    jamiByudjet,
    jamiSifatli,
    jamiLead,
    jamiSotuv,
    jamiTushum,
    ortLeadNarxi,
    ortSotuvNarxi,
    rejaBajarilishi,
    rejaByudjetPct,
    rejaTushumPct,
    rejaLid,
    rejaByudjet,
    rejaTushum,
  }
}

// ---- Table 2: employee derived values ----

export type EmployeeAgg = {
  gaplashgan: number
  sifatli: number
  aniqlanmagan: number
  sotilgan_mijoz: number
  sotilgan_mahsulot: number
  tushum: number
}

export function emptyAgg(): EmployeeAgg {
  return {
    gaplashgan: 0,
    sifatli: 0,
    aniqlanmagan: 0,
    sotilgan_mijoz: 0,
    sotilgan_mahsulot: 0,
    tushum: 0,
  }
}

// Sum all daily rows for one employee
export function aggregateEmployee(days: EmployeeDaily[]): EmployeeAgg {
  return days.reduce<EmployeeAgg>((acc, d) => {
    acc.gaplashgan += d.gaplashgan
    acc.sifatli += d.sifatli
    acc.aniqlanmagan += d.aniqlanmagan
    acc.sotilgan_mijoz += d.sotilgan_mijoz
    acc.sotilgan_mahsulot += d.sotilgan_mahsulot
    acc.tushum += Number(d.tushum)
    return acc
  }, emptyAgg())
}

export function employeeDerived(a: EmployeeAgg) {
  const sifatPct = a.gaplashgan ? (a.sifatli / a.gaplashgan) * 100 : 0
  const konversiyaPct = a.sifatli ? (a.sotilgan_mijoz / a.sifatli) * 100 : 0
  const ortachaChek = a.sotilgan_mijoz ? a.tushum / a.sotilgan_mijoz : 0
  return { sifatPct, konversiyaPct, ortachaChek }
}

// Color class for a percentage cell (low red, mid yellow, high green)
export function pctTone(value: number): "low" | "mid" | "high" {
  if (value < 30) return "low"
  if (value < 60) return "mid"
  return "high"
}

// KpiCard tone from a "higher is better" percentage — same red/amber/green scale
// as the table badges, so a KPI card reacts to its value.
export function pctKpiTone(value: number): "danger" | "warning" | "success" {
  const t = pctTone(value)
  return t === "low" ? "danger" : t === "mid" ? "warning" : "success"
}
