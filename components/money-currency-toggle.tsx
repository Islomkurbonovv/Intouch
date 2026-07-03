"use client"

import { cn } from "@/lib/utils"
import type { InputCurrency } from "@/lib/rnp"

// A compact $/so'm toggle used next to a money input. The amount is always
// stored in USD; picking "so'm" means the entered value will be converted at
// the CBU rate on save. The so'm option is disabled when the rate is unknown.
export function MoneyCurrencyToggle({
  value,
  onChange,
  rate,
}: {
  value: InputCurrency
  onChange: (v: InputCurrency) => void
  rate: number
}) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-border bg-background p-0.5">
      <button
        type="button"
        onClick={() => onChange("USD")}
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium transition-colors",
          value === "USD"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={value === "USD"}
      >
        $
      </button>
      <button
        type="button"
        onClick={() => onChange("UZS")}
        disabled={!rate}
        title={rate ? undefined : "Kurs mavjud emas"}
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-40",
          value === "UZS"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={value === "UZS"}
      >
        so&apos;m
      </button>
    </div>
  )
}
