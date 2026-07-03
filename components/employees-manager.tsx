"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEmployee, updateEmployee, deleteEmployee } from "@/app/actions/data"
import { roleLabel, type Profile, type Role } from "@/lib/rnp"

type FormState = {
  name: string
  login: string
  password: string
  role: Role
}

const EMPTY_FORM: FormState = { name: "", login: "", password: "", role: "salesperson" }

export function EmployeesManager({ employees, me }: { employees: Profile[]; me: Profile }) {
  const router = useRouter()
  const isSuper = me.role === "super_admin"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [pending, startTransition] = useTransition()

  // A plain admin can only touch salespeople.
  function canManage(emp: Profile) {
    if (emp.id === me.id) return true
    return isSuper || emp.role === "salesperson"
  }

  const roleOptions: { value: Role; label: string }[] = isSuper
    ? [
        { value: "salesperson", label: "Sotuvchi" },
        { value: "admin", label: "Admin" },
        { value: "super_admin", label: "Bosh admin" },
      ]
    : [{ value: "salesperson", label: "Sotuvchi" }]

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(emp: Profile) {
    setEditing(emp)
    setForm({ name: emp.name, login: emp.login, password: "", role: emp.role })
    setDialogOpen(true)
  }

  function submit() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("name", form.name)
      fd.set("login", form.login)
      fd.set("password", form.password)
      fd.set("role", form.role)

      let res: { error?: string; ok?: boolean }
      if (editing) {
        fd.set("id", editing.id)
        res = await updateEmployee(fd)
      } else {
        res = await createEmployee(fd)
      }

      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(editing ? "Hodim yangilandi" : "Hodim qo'shildi")
      setDialogOpen(false)
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      const res = await deleteEmployee(target.id)
      if (res.error) {
        toast.error(res.error)
        setDeleteTarget(null)
        return
      }
      toast.success("Hodim o'chirildi")
      setDeleteTarget(null)
      router.refresh()
    })
  }

  function badgeVariant(role: Role): "default" | "secondary" | "outline" {
    if (role === "super_admin") return "default"
    if (role === "admin") return "outline"
    return "secondary"
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Hodimlar</h2>
          <p className="text-sm text-muted-foreground">
            Login va parolni siz belgilaysiz. Hodim shu ma&apos;lumotlar bilan tizimga kiradi.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Hodim qo&apos;shish</span>
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ism</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Hozircha hodim yo&apos;q.
                  </TableCell>
                </TableRow>
              ) : null}
              {employees.map((emp) => {
                const manageable = canManage(emp)
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                          {emp.name.charAt(0).toUpperCase()}
                        </span>
                        {emp.name}
                        {emp.id === me.id ? <span className="text-xs text-muted-foreground">(siz)</span> : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">@{emp.login}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(emp.role)}>{roleLabel(emp.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(emp)} disabled={!manageable} aria-label={`${emp.name}ni tahrirlash`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(emp)} disabled={!manageable || emp.id === me.id} aria-label={`${emp.name}ni o'chirish`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Hodimni tahrirlash" : "Yangi hodim"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Ma'lumotlarni o'zgartiring. Parolni bo'sh qoldirsangiz o'zgarmaydi."
                : "Hodim ma'lumotlari va kirish uchun login/parolni kiriting."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-name">Ism</Label>
              <Input id="emp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="To'liq ism" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-login">Login</Label>
              <Input id="emp-login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="masalan: alisher" autoCapitalize="none" autoCorrect="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-password">Parol</Label>
              <Input id="emp-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Bo'sh qoldiring — o'zgarmaydi" : "Kamida 6 belgi"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-role">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })} disabled={roleOptions.length === 1}>
                <SelectTrigger id="emp-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isSuper ? (
                <p className="text-xs text-muted-foreground">Faqat bosh admin admin qo&apos;sha oladi.</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button onClick={submit} disabled={pending}>
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hodimni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.name}</span> o&apos;chiriladi.
                  Uning barcha natijalari ham o&apos;chib ketadi. Bu amalni ortga qaytarib bo&apos;lmaydi.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete() }} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
