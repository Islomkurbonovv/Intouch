import { cn } from "@/lib/utils"
import { pctTone } from "@/lib/calc"
import { fmtPct } from "@/lib/rnp"

export function PctBadge({ value }: { value: number }) {
  const tone = pctTone(value)
  const toneClasses: Record<string, string> = {
    low: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/15",
    mid: "bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/25 dark:text-warning",
    high: "bg-success/10 text-success ring-1 ring-inset ring-success/15",
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-14 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        toneClasses[tone],
      )}
    >
      {fmtPct(value)}%
    </span>
  )
}
