import * as XLSX from "xlsx"
import type { Profile, MarketingDaily, PlanSettings, EmployeeDaily } from "@/lib/rnp"
import { monthLabel } from "@/lib/rnp"
import {
  marketingRow,
  aggregateEmployee,
  employeeDerived,
} from "@/lib/calc"

function round(n: number, d = 2) {
  const f = Math.pow(10, d)
  return Math.round(n * f) / f
}

export function exportWorkbook(opts: {
  month: string
  marketing: MarketingDaily[]
  plan: PlanSettings | null
  employees: Profile[]
  employeeDaily: EmployeeDaily[]
  monthDays: number
}) {
  const { month, marketing, plan, employees, employeeDaily, monthDays } = opts
  const wb = XLSX.utils.book_new()

  // Sheet 1: marketing daily
  const sheet1: (string | number)[][] = [
    [
      "Kun",
      "Byudjet ($)",
      "Sifatli",
      "Sifatsiz",
      "Jami Lead",
      "Sotuv",
      "Lead Narxi",
      "Sotuv Narxi",
      "Sifat %",
      "Konversiya %",
      "Reja Lid",
      "Reja %",
    ],
  ]
  for (const m of marketing) {
    const d = marketingRow(m, plan, monthDays)
    sheet1.push([
      m.day,
      round(Number(m.byudjet)),
      m.sifatli,
      d.sifatsiz,
      m.jami_lead,
      m.sotuv,
      round(d.leadNarxi),
      round(d.sotuvNarxi),
      round(d.sifatPct),
      round(d.konversiyaPct),
      round(d.rejaLid),
      round(d.rejaPct),
    ])
  }
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1)
  XLSX.utils.book_append_sheet(wb, ws1, "Kunlik Malumotlar")

  // Sheet 2: employee results
  const sheet2: (string | number)[][] = [
    [
      "Hodim",
      "Gaplashgan",
      "Sifatli",
      "Aniqlanmagan",
      "Sotilgan mijoz",
      "Sotilgan mahsulot",
      "Tushum ($)",
      "Sifat %",
      "Konversiya %",
      "O'rtacha chek",
    ],
  ]
  for (const emp of employees) {
    const days = employeeDaily.filter((e) => e.employee_id === emp.id)
    const agg = aggregateEmployee(days)
    const der = employeeDerived(agg)
    sheet2.push([
      emp.name,
      agg.gaplashgan,
      agg.sifatli,
      agg.aniqlanmagan,
      agg.sotilgan_mijoz,
      agg.sotilgan_mahsulot,
      round(agg.tushum),
      round(der.sifatPct),
      round(der.konversiyaPct),
      round(der.ortachaChek),
    ])
  }
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2)
  XLSX.utils.book_append_sheet(wb, ws2, "Hodimlar natijalari")

  // Sheet 3: employee daily breakdown
  const sheet3: (string | number)[][] = [
    [
      "Hodim",
      "Kun",
      "Gaplashgan",
      "Sifatli",
      "Aniqlanmagan",
      "Sotilgan mijoz",
      "Sotilgan mahsulot",
      "Tushum ($)",
    ],
  ]
  for (const emp of employees) {
    const days = employeeDaily
      .filter((e) => e.employee_id === emp.id)
      .sort((a, b) => a.day - b.day)
    for (const d of days) {
      sheet3.push([
        emp.name,
        d.day,
        d.gaplashgan,
        d.sifatli,
        d.aniqlanmagan,
        d.sotilgan_mijoz,
        d.sotilgan_mahsulot,
        round(Number(d.tushum)),
      ])
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3)
  XLSX.utils.book_append_sheet(wb, ws3, "Kunlik hodim natijalari")

  const safeLabel = monthLabel(month).replace(/\s+/g, "_")
  XLSX.writeFile(wb, `RNP_Dashboard_${safeLabel}.xlsx`)
}
