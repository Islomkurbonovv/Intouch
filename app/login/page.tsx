import { ensureSeedAdmin } from "@/app/actions/auth"
import { LoginForm } from "@/components/login-form"
import { BarChart3 } from "lucide-react"

export default async function LoginPage() {
  // Make sure a default admin account exists on first run.
  await ensureSeedAdmin()

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BarChart3 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
              RNP Dashboard
            </h1>
            <p className="mt-1 text-sm text-sidebar-foreground/60">
              Boshqaruv paneliga kirish
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
