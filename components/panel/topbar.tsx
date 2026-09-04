"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"
import { ROLE_LABEL, type PublicUser } from "@/lib/types"
import { logoutAction } from "@/lib/actions/auth"

/**
 * Mapeo de estilos CSS según el rol del usuario para los distintivos (Badges).
 */
const ROLE_STYLE: Record<string, string> = {
  cliente: "bg-chart-2/15 text-chart-2",
  agente: "bg-primary/15 text-primary",
  admin: "bg-chart-5/15 text-chart-5",
}

/**
 * Propiedades esperadas por el componente Topbar.
 */
interface TopbarProps {
  /** Objeto del usuario autenticado con datos públicos (nombre, email, rol) */
  user: PublicUser
}

/**
 * BARRA SUPERIOR DEL PANEL (UI Client Component)
 * 
 * - Muestra el saludo personalizado y el avatar con las iniciales del usuario.
 * - Incluye un menú desplegable con el correo, nombre completo y botón de cierre de sesión.
 * - Utiliza `useTransition` para gestionar el cierre de sesión asíncrono sin congelar la UI.
 * 
 * @param {TopbarProps} props - Propiedades del componente.
 * @returns {JSX.Element} Cabecera superior del panel.
 */
export function Topbar({ user }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Generación de iniciales a partir del nombre (máximo 2 letras)
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  /**
   * Manejador para el cierre de sesión asíncrono.
   */
  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.push("/ingresar")
      router.refresh()
    })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur md:px-6">
      {/* Título y Bienvenida */}
      <div>
        <p className="text-sm text-muted-foreground">Mesa de ayuda</p>
        <h1 className="text-base font-semibold leading-tight">Bienvenido, {user.name.split(" ")[0]}</h1>
      </div>

      {/* Menú de Perfil de Usuario */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-2.5 text-sm transition-colors hover:bg-accent"
        >
          {/* Avatar con Iniciales */}
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          
          {/* Badge del Rol (Cliente / Agente / Admin) */}
          <span
            className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${ROLE_STYLE[user.role]}`}
          >
            {ROLE_LABEL[user.role]}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        {/* Dropdown flotante con Backdrop de cierre */}
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              
              {/* Botón para Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={pending}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                <LogOut className="size-4" />
                {pending ? "Cerrando…" : "Cerrar sesión"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}