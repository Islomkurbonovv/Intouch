"use client"

import { useActionState } from "react"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <Card className="border-sidebar-border/50 shadow-lg">
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              name="login"
              type="text"
              placeholder="Loginingizni kiriting"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Parolingizni kiriting"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Kirilmoqda...
              </>
            ) : (
              "Kirish"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
