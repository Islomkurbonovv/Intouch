"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { monthNamesUz, monthLabel } from "@/lib/rnp"

export function PeriodPicker({
  view,
  month,
  year,
}: {
  view: "monthly" | "yearly"
  month: string
  year: number
}) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"monthly" | "yearly">(view)
  const selectedYear = view === "yearly" ? year : Number(month.split("-")[0])
  const selectedMonthIdx = view === "yearly" ? -1 : Number(month.split("-")[1]) - 1
  const [browseYear, setBrowseYear] = useState(selectedYear)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const months = monthNamesUz()

  const triggerLabel = view === "yearly" ? `${year} — yillik` : monthLabel(month)

  function pickMonth(idx: number) {
    const mm = String(idx + 1).padStart(2, "0")
    setOpen(false)
    router.push(`/?month=${browseYear}-${mm}`)
  }

  function pickYear() {
    setOpen(false)
    router.push(`/?view=yearly&year=${browseYear}`)
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="w-[170px] justify-between bg-background"
        onClick={() => {
          setMode(view)
          setBrowseYear(selectedYear)
          setOpen((o) => !o)
        }}
        aria-label="Davrni tanlash"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {triggerLabel}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
          {/* Mode toggle */}
          <div className="mb-3 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("monthly")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Oylik
            </button>
            <button
              type="button"
              onClick={() => setMode("yearly")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yillik
            </button>
          </div>

          {/* Year navigation */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setBrowseYear((y) => y - 1)}
              aria-label="Oldingi yil"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{browseYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setBrowseYear((y) => y + 1)}
              aria-label="Keyingi yil"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {mode === "monthly" ? (
            <div className="grid grid-cols-3 gap-2">
              {months.map((name, idx) => {
                const isActive =
                  view !== "yearly" && idx === selectedMonthIdx && browseYear === selectedYear
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickMonth(idx)}
                    className={cn(
                      "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-foreground hover:bg-accent",
                    )}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {browseYear}-yil bo&apos;yicha barcha oylar yig&apos;indisi ko&apos;rsatiladi.
              </p>
              <Button onClick={pickYear} className="w-full">
                {browseYear}-yilni ko&apos;rish
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
