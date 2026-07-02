import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: "default" | "primary" | "success" | "warning"
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          toneClasses[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </Card>
  )
}
