/**
 * ============================================================================
 * Proyecto: MesaViva - Sistema de Gestión de Tickets de Soporte
 * Archivo: app/ingresar/page.tsx
 * Descripción: Página de inicio de sesión (Login) con tarjetas de ayuda demo.
 * ============================================================================
 */

import Link from "next/link"
import { redirect } from "next/navigation"
import { Ticket, Info } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { getCurrentUser } from "@/lib/auth/session"

// SEO / Metadata: Título específico para la pestaña del navegador
export const metadata = { title: "Ingresar · MesaViva" }

/**
 * Cuentas predeterminadas para pruebas y demostración rápida del sistema (RBAC),
 * diferenciadas por el rol asignado.
 */
const demoAccounts = [
  { role: "Administrador", email: "admin@soporte.dev" },
  { role: "Agente", email: "bruno@soporte.dev" },
  { role: "Cliente", email: "diego@empresa.com" },
]

/**
 * PÁGINA DE LOGIN (Auth Layout & Container - Server Component)
 * 
 * - Valida si el usuario ya cuenta con una sesión iniciada para redirigirlo al panel.
 * - Renderiza el formulario de autenticación cliente (AuthForm en modo 'login').
 * - Muestra un bloque informativo con las credenciales de demostración por rol.
 */
export default async function LoginPage() {
  // Lógica de Protección: Redirección inmediata al Dashboard si ya existe sesión activa
  if (await getCurrentUser()) redirect("/panel")

  return (
    // Layout centrado con fondo atenuado (bg-muted/40) para maximizar el enfoque visual
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Isotipo y enlace de retorno a la página principal */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-4" />
          </span>
          MesaViva
        </Link>

        {/* Tarjeta contenedora del formulario de autenticación */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa para gestionar tus tickets de soporte.</p>
          
          {/* Formulario Cliente Reusable (Modo Login) */}
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
        </div>

        {/* Bloque Informativo UX: Guía de Cuentas de Demostración */}
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