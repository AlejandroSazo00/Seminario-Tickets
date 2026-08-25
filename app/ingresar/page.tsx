import Link from "next/link"
import { redirect } from "next/navigation"
import { Ticket, Info } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { getCurrentUser } from "@/lib/auth/session"

export const metadata = { title: "Ingresar · MesaViva" }

const demoAccounts = [
  { role: "Administrador", email: "admin@soporte.dev" },
  { role: "Agente", email: "bruno@soporte.dev" },
  { role: "Cliente", email: "diego@empresa.com" },
]

export default async function LoginPage() {
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
          <h1 className="text-xl font-semibold">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa para gestionar tus tickets de soporte.</p>
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Info className="size-4 text-primary" />
            Cuentas de demostración
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {demoAccounts.map((a) => (
              <li key={a.email} className="flex justify-between gap-2">
                <span>{a.role}</span>
                <code className="text-xs">{a.email}</code>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Contraseña para todas: <code>demo1234</code>
          </p>
        </div>
      </div>
    </div>
  )
}
