"use client"

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { upsertEmployeePlans } from "@/app/actions/data"
import { monthLabel } from "@/lib/rnp"
import type { Profile, EmployeePlan } from "@/lib/rnp"

// Manager-only dialog: set each salesperson's monthly revenue (tushum) target
// in USD. All rows are saved together via a single bulk upsert.
export function EmployeePlansDialog({
  month,
  employees,
  plans,
  children,
}: {
  month: string
  employees: Profile[]
  plans: EmployeePlan[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>({})

  // Re-sync the inputs to the selected month's saved plans every time the dialog
  // opens, so a month switch doesn't carry the previous month's numbers over.
  useEffect(() => {
    if (!open) return
    const byId = new Map(plans.map((p) => [p.employee_id, p.plan_tushum]))
    const next: Record<string, string> = {}
    for (const emp of employees) {
      const v = byId.get(emp.id)
      next[emp.id] = v ? String(v) : ""
    }
    setValues(next)
  }, [open, plans, employees])

  function submit() {
    startTransition(async () => {
      const res = await upsertEmployeePlans({
        month,
        plans: employees.map((emp) => ({
          employee_id: emp.id,
          plan_tushum: Number(values[emp.id]) || 0,
        })),
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Hodim rejalari saqlandi")
      setOpen(false)
    })
  }

  return (
    <>
      {/* Controlled trigger — base-ui asChild trigger crashes, so we wire the
          passed child's onClick to open the dialog. */}
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hodim rejalari</DialogTitle>
            <DialogDescription>
              {monthLabel(month)} — har bir hodimning oylik tushum rejasi ($)
            </DialogDescription>
          </DialogHeader>

          {employees.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hodim yo&apos;q. &quot;Hodimlar&quot; bo&apos;limidan sotuvchi qo&apos;shing.
            </p>
          ) : (
            <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2 pr-1">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{emp.name}</span>
                  <div className="relative w-36 shrink-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={values[emp.id] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [emp.id]: e.target.value }))}
                      placeholder="0"
                      className="pl-6 text-right tabular-nums"
                      aria-label={`${emp.name} oylik tushum rejasi`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button onClick={submit} disabled={pending || employees.length === 0}>
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
