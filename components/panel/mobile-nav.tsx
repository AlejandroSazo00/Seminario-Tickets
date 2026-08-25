"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket, PlusCircle, BarChart3, BookOpen, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

const NAV = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard, roles: ["cliente", "agente", "admin"] as Role[] },
  { href: "/panel/tickets", label: "Tickets", icon: Ticket, roles: ["cliente", "agente", "admin"] as Role[] },
  { href: "/panel/tickets/nuevo", label: "Nuevo", icon: PlusCircle, roles: ["cliente", "agente", "admin"] as Role[] },
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3, roles: ["agente", "admin"] as Role[] },
  { href: "/panel/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] as Role[] },
  { href: "/panel/documentacion", label: "Docs", icon: BookOpen, roles: ["cliente", "agente", "admin"] as Role[] },
]

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = NAV.filter((i) => i.roles.includes(role))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
