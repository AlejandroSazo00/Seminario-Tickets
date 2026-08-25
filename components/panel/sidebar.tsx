"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket, PlusCircle, BarChart3, BookOpen, LifeBuoy, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

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
  const items = NAV.filter((i) => i.roles.includes(role))

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LifeBuoy className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">MesaViva</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        MesaViva · v1.0
      </div>
    </aside>
  )
}
