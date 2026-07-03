import * as XLSX from "xlsx"
import type { Profile, MarketingDaily, EmployeeDaily } from "@/lib/rnp"
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
}) {
  const { label, marketing, employees, employeeDaily } = opts
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
      "Gaplashgan",
      "Sifatli",
      "Aniqlanmagan",
      "Sotilgan mijoz",
      "Sotilgan mahsulot",
      "Tushum ($)",
      "Sifat %",
      "Konversiya %",
      "O'rtacha chek ($)",
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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2), "Hodimlar jami")

  // Sheet 3: employee daily breakdown
  const sheet3: (string | number)[][] = [
    [
      "Hodim",
      "Oy",
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
      .sort((a, b) => (a.month === b.month ? a.day - b.day : a.month < b.month ? -1 : 1))
    for (const d of days) {
      sheet3.push([
        emp.name,
        monthShortLabel(d.month),
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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3), "Hodimlar kunlik")

  const safeLabel = label.replace(/\s+/g, "_")
  XLSX.writeFile(wb, `RNP_Dashboard_${safeLabel}.xlsx`)
}
