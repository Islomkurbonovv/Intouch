import { ensureSeedAdmin } from "@/app/actions/auth"
import { LoginForm } from "@/components/login-form"
import { BarChart3 } from "lucide-react"

export default async function LoginPage() {
  // Make sure a default admin account exists on first run.
  await ensureSeedAdmin()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar p-4">
      {/* Atmospheric background: layered indigo glows + fine grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 20% 0%, color-mix(in oklch, var(--sidebar-primary) 28%, transparent), transparent 70%), radial-gradient(50% 50% at 100% 100%, color-mix(in oklch, var(--sidebar-primary) 20%, transparent), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--sidebar-foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--sidebar-foreground) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-primary text-primary-foreground shadow-lg shadow-black/30 ring-1 ring-inset ring-white/20">
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
        <p className="mt-6 text-center text-xs text-sidebar-foreground/40">
          Marketing va sotuv natijalari boshqaruv paneli
        </p>
      </div>
    </main>
  )
}
