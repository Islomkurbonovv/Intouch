"use client"

import { useEffect, useRef, useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import { roleLabel, type Profile } from "@/lib/rnp"

// Self-contained header user menu. Deliberately hand-rolled (like PeriodPicker)
// instead of the base-ui Menu primitive, whose `asChild` trigger pattern crashes
// in this project (Base UI error #31 / React #418 on open).
export function UserMenu({ profile }: { profile: Profile }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 pl-1.5"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Foydalanuvchi menyusi"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{profile.name}</span>
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="flex flex-col px-2.5 py-2">
            <span className="text-sm font-medium">{profile.name}</span>
            <span className="text-xs text-muted-foreground">
              @{profile.login} · {roleLabel(profile.role)}
            </span>
          </div>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Chiqish
          </button>
        </div>
      ) : null}
    </div>
  )
}
