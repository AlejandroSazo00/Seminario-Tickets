import Link from "next/link"
import { redirect } from "next/navigation"
import { Ticket } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { getCurrentUser } from "@/lib/auth/session"

// SEO / Metadata: Título específico para la pestaña del navegador
export const metadata = { title: "Crear cuenta · MesaViva" }

/**
 * PÁGINA DE REGISTRO (Auth Layout & Container)
 * Server Component que envuelve el formulario de registro y valida sesión previa.
 */
export default async function RegisterPage() {
  // Lógica de Protección: Si el usuario ya está autenticado, lo redirige al Dashboard
  if (await getCurrentUser()) redirect("/panel")

  return (
    // Centrado absoluto de pantalla con fondo sutil (bg-muted/40) para resaltar la tarjeta
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Identidad de Marca / Retorno a la Landing */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-4" />
          </span>
          MesaViva
        </Link>

        {/* Tarjeta Contenedora del Formulario (Card Pattern) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te registras como cliente y podrás abrir y dar seguimiento a tus tickets.
          </p>
          
          {/* Formulario Cliente Reusable (Modo Registro) */}
          <div className="mt-6">
            <AuthForm mode="register" />
          </div>
        </div>
      </div>
    </div>
  )
}