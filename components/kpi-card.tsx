import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "default" | "primary" | "success" | "warning" | "danger"

const toneStyles: Record<
  Tone,
  { icon: string; glow: string; accent: string }
> = {
  default: {
    icon: "bg-secondary text-secondary-foreground",
    glow: "from-foreground/[0.04]",
    accent: "bg-foreground/15",
  },
  primary: {
    icon: "bg-primary/12 text-primary ring-1 ring-inset ring-primary/20",
    glow: "from-primary/[0.07]",
    accent: "bg-primary",
  },
  success: {
    icon: "bg-success/12 text-success ring-1 ring-inset ring-success/20",
    glow: "from-success/[0.07]",
    accent: "bg-success",
  },
  warning: {
    icon: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/25",
    glow: "from-warning/[0.08]",
    accent: "bg-warning",
  },
  danger: {
    icon: "bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/20",
    glow: "from-destructive/[0.07]",
    accent: "bg-destructive",
  },
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
}) {
  const s = toneStyles[tone]

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 elevated hover:-translate-y-0.5 hover:border-border sm:p-5">
      {/* Tone glow in the corner for subtle depth */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          s.glow,
        )}
        aria-hidden="true"
      />
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-4 h-8 w-1 rounded-r-full opacity-70 transition-all group-hover:h-10 group-hover:opacity-100",
          s.accent,
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
            s.icon,
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
