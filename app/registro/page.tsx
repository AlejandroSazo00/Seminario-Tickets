import Link from "next/link"
import { redirect } from "next/navigation"
import { Ticket } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { getCurrentUser } from "@/lib/auth/session"

export const metadata = { title: "Crear cuenta · MesaViva" }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/panel")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-4" />
          </span>
          MesaViva
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te registras como cliente y podrás abrir y dar seguimiento a tus tickets.
          </p>
          <div className="mt-6">
            <AuthForm mode="register" />
          </div>
        </div>
      </div>
    </div>
  )
}
