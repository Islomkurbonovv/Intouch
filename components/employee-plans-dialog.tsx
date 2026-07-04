"use client"

import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
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
import { monthLabel, fmtUsd } from "@/lib/rnp"
import { cn } from "@/lib/utils"
import type { Profile, EmployeePlan, PlanSettings } from "@/lib/rnp"

// Manager-only dialog: distribute the monthly revenue target ("Reja Tushum" =
// plan_settings.plan_sotuv) across salespeople. The sum of the per-employee
// targets must not exceed the monthly target — saving is blocked if it does.
export function EmployeePlansDialog({
  month,
  employees,
  plans,
  plan,
  children,
}: {
  month: string
  employees: Profile[]
  plans: EmployeePlan[]
  plan: PlanSettings | null
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

  // Monthly revenue target to distribute, and how much is currently allocated.
  const target = Number(plan?.plan_sotuv) || 0
  const allocated = useMemo(
    () => employees.reduce((s, emp) => s + (Number(values[emp.id]) || 0), 0),
    [employees, values],
  )
  const remaining = target - allocated
  const over = target > 0 && allocated > target

  function submit() {
    if (over) {
      toast.error("Hodimlar rejalari yig'indisi oylik rejadan oshib ketdi")
      return
    }
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
              {monthLabel(month)} — oylik &quot;Reja Tushum&quot;ni hodimlarga taqsimlang ($)
            </DialogDescription>
          </DialogHeader>

          {employees.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hodim yo&apos;q. &quot;Hodimlar&quot; bo&apos;limidan sotuvchi qo&apos;shing.
            </p>
          ) : (
            <>
              <div className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto py-2 pr-1">
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

              {/* Allocation summary — kept in sync with the monthly "Reja Tushum". */}
              <div className="mt-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                {target > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Oylik reja (Reja Tushum)</span>
                      <span className="font-medium tabular-nums">{fmtUsd(target)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Taqsimlangan</span>
                      <span className={cn("font-medium tabular-nums", over && "text-destructive")}>
                        {fmtUsd(allocated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                      <span className="text-muted-foreground">Qoldiq</span>
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          remaining < 0 ? "text-destructive" : "text-success",
                        )}
                      >
                        {fmtUsd(remaining)}
                      </span>
                    </div>
                    {over ? (
                      <p className="pt-1 text-xs text-destructive">
                        Yig&apos;indi oylik rejadan oshib ketdi — kamaytiring, aks holda saqlab bo&apos;lmaydi.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Jami taqsimlangan</span>
                      <span className="font-medium tabular-nums">{fmtUsd(allocated)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Oylik &quot;Reja Tushum&quot; hali sozlanmagan — &quot;Reja sozlamalari&quot;dan kiriting.
                      Shunda yig&apos;indi shu rejadan oshmasligi tekshiriladi.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button onClick={submit} disabled={pending || employees.length === 0 || over}>
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
