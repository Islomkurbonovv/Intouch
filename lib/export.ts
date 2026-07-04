import * as XLSX from "xlsx"
import type { Profile, MarketingDaily, EmployeeDaily, EmployeePlan } from "@/lib/rnp"
import { monthShortLabel } from "@/lib/rnp"
import { aggregateEmployee, employeeDerived } from "@/lib/calc"

function round(n: number, d = 2) {
  const f = Math.pow(10, d)
  return Math.round(n * f) / f
}

// All money is stored and exported in USD (base currency).
export function exportWorkbook(opts: {
  label: string
  marketing: MarketingDaily[]
  employees: Profile[]
  employeeDaily: EmployeeDaily[]
  employeePlans?: EmployeePlan[]
}) {
  const { label, marketing, employees, employeeDaily, employeePlans = [] } = opts
  const planById = new Map(employeePlans.map((p) => [p.employee_id, Number(p.plan_tushum) || 0]))
  const wb = XLSX.utils.book_new()

  // Sheet 1: marketing budget per day
  const sheet1: (string | number)[][] = [["Oy", "Kun", "Byudjet ($)"]]
  const sortedMk = [...marketing].sort((a, b) =>
    a.month === b.month ? a.day - b.day : a.month < b.month ? -1 : 1,
  )
  for (const m of sortedMk) {
    sheet1.push([monthShortLabel(m.month), m.day, round(Number(m.byudjet))])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1), "Byudjet")

  // Sheet 2: per-employee totals
  const sheet2: (string | number)[][] = [
    [
      "Hodim",
      "Sifatli",
      "Sifatsiz",
      "Aniqlanmagan",
      "Sotilgan mijoz",
      "Sotilgan mahsulot",
      "Tushum ($)",
      "Reja ($)",
      "Bajarilishi %",
      "Sifat %",
      "Konversiya %",
      "O'rtacha chek ($)",
    ],
  ]
  for (const emp of employees) {
    const days = employeeDaily.filter((e) => e.employee_id === emp.id)
    const agg = aggregateEmployee(days)
    const der = employeeDerived(agg)
    const plan = planById.get(emp.id) ?? 0
    const bajarilishi = plan ? (agg.tushum / plan) * 100 : 0
    sheet2.push([
      emp.name,
      agg.sifatli,
      agg.sifatsiz,
      agg.aniqlanmagan,
      agg.sotilgan_mijoz,
      agg.sotilgan_mahsulot,
      round(agg.tushum),
      round(plan),
      round(bajarilishi),
      round(der.sifatPct),
      round(der.konversiyaPct),
      round(der.ortachaChek),
    ])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2), "Hodimlar jami")

  // Sheet 3: employee daily breakdown
  const sheet3: (string | number)[][] = [
    [
      "Hodim",
      "Oy",
      "Kun",
      "Sifatli",
      "Sifatsiz",
      "Aniqlanmagan",
      "Sotilgan mijoz",
      "Sotilgan mahsulot",
      "Tushum ($)",
    ],
  ]
  for (const emp of employees) {
    const days = employeeDaily
      .filter((e) => e.employee_id === emp.id)
      .sort((a, b) => (a.month === b.month ? a.day - b.day : a.month < b.month ? -1 : 1))
    for (const d of days) {
      sheet3.push([
        emp.name,
        monthShortLabel(d.month),
        d.day,
        d.sifatli,
        d.sifatsiz,
        d.aniqlanmagan,
        d.sotilgan_mijoz,
        d.sotilgan_mahsulot,
        round(Number(d.tushum)),
      ])
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3), "Hodimlar kunlik")

  const safeLabel = label.replace(/\s+/g, "_")
  XLSX.writeFile(wb, `RNP_Dashboard_${safeLabel}.xlsx`)
}
