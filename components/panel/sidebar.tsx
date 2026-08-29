"use client"

// Importación de utilidades de navegación y utilidades visuales
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket, PlusCircle, BarChart3, BookOpen, LifeBuoy, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

// Definición de la estructura de ítems de navegación para la arquitectura del sistema
interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[] // Control UX: Permisos de visibilidad según el tipo de usuario
}

/**
 * Menú de navegación principal (Dashboard)
 * Agrupa las secciones del sistema y restringe accesos según el rol asignado.
 */
const NAV: NavItem[] = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard, roles: ["cliente", "agente", "admin"] },
  { href: "/panel/tickets", label: "Tickets", icon: Ticket, roles: ["cliente", "agente", "admin"] },
  { href: "/panel/tickets/nuevo", label: "Nuevo ticket", icon: PlusCircle, roles: ["cliente", "agente", "admin"] },
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3, roles: ["agente", "admin"] },
  { href: "/panel/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  { href: "/panel/documentacion", label: "Documentación", icon: BookOpen, roles: ["cliente", "agente", "admin"] },
]

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  
  // UX / Seguridad Visual: Filtrado dinámico de navegación según el rol del usuario conectado
  const items = NAV.filter((i) => i.roles.includes(role))

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      {/* Header del Sidebar: Marca e Identidad Visual (Branding) */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LifeBuoy className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">MesaViva</span>
      </div>

      {/* Menú de navegación interactivo */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          // UX Feedback: Detección de la ruta activa para resaltar la ubicación actual
          const active = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" // Estado activo (Highlight)
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", // Estado reposo + hover
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer del Sidebar: Información de versión y contexto del sistema */}
      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        MesaViva · v1.0
      </div>
    </aside>
  )
}