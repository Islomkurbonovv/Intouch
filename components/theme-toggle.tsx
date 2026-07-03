"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

// Light/dark switch for the header. Renders a stable icon until mounted to
// avoid a hydration mismatch (server has no theme knowledge).
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish"}
      title={isDark ? "Yorug' mavzu" : "Qorong'i mavzu"}
    >
      <Sun
        className={`h-[18px] w-[18px] transition-all ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        aria-hidden="true"
      />
    </Button>
  )
}
