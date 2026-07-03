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
import { Label } from "@/components/ui/label"
import { upsertPlanSettings } from "@/app/actions/data"
import { monthLabel } from "@/lib/rnp"
import type { PlanSettings } from "@/lib/rnp"

export function PlanSettingsDialog({
  month,
  plan,
  children,
}: {
  month: string
  plan: PlanSettings | null
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState({
    plan_byudjet: plan ? String(plan.plan_byudjet) : "",
    plan_lead: plan ? String(plan.plan_lead) : "",
    plan_sotuv: plan ? String(plan.plan_sotuv) : "",
  })

  // Re-sync the form to the selected month's plan every time the dialog opens.
  // Without this, a soft month switch keeps the previous month's values and
  // would save them onto the new month.
  useEffect(() => {
    if (!open) return
    setValues({
      plan_byudjet: plan ? String(plan.plan_byudjet) : "",
      plan_lead: plan ? String(plan.plan_lead) : "",
      plan_sotuv: plan ? String(plan.plan_sotuv) : "",
    })
  }, [open, plan])

  function submit() {
    startTransition(async () => {
      const res = await upsertPlanSettings({
        month,
        plan_byudjet: Number(values.plan_byudjet) || 0,
        plan_lead: Number(values.plan_lead) || 0,
        plan_sotuv: Number(values.plan_sotuv) || 0,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Reja sozlamalari saqlandi")
      setOpen(false)
    })
  }

  return (
    <>
      {/* Controlled trigger — the base-ui asChild trigger crashes here, so we
          just wire the passed child's onClick to open the dialog. */}
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Reja sozlamalari</DialogTitle>
          <DialogDescription>{monthLabel(month)} uchun oylik reja</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan_byudjet">Reja Byudjet ($)</Label>
            <Input
              id="plan_byudjet"
              type="number"
              value={values.plan_byudjet}
              onChange={(e) => setValues({ ...values, plan_byudjet: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan_lead">Reja Lead (lidlar soni)</Label>
            <Input
              id="plan_lead"
              type="number"
              value={values.plan_lead}
              onChange={(e) => setValues({ ...values, plan_lead: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan_sotuv">Reja Tushum ($)</Label>
            <Input
              id="plan_sotuv"
              type="number"
              value={values.plan_sotuv}
              onChange={(e) => setValues({ ...values, plan_sotuv: e.target.value })}
              placeholder="masalan: 100000"
            />
            <p className="text-xs text-muted-foreground">
              Oylik daromad (tushum) rejasi dollarda. &quot;Tushum reja %&quot; jami tushumni shu songa nisbatan hisoblaydi.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Bekor qilish
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
