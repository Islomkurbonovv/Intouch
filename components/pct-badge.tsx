import { cn } from "@/lib/utils"
import { pctTone } from "@/lib/calc"
import { fmt } from "@/lib/rnp"

export function PctBadge({ value }: { value: number }) {
  const tone = pctTone(value)
  const toneClasses: Record<string, string> = {
    low: "bg-destructive/10 text-destructive",
    mid: "bg-warning/15 text-warning-foreground",
    high: "bg-success/10 text-success",
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-14 items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
        toneClasses[tone],
      )}
    >
      {fmt(value)}%
    </span>
  )
}
