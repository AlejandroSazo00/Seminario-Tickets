"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"
import { ROLE_LABEL, type PublicUser } from "@/lib/types"
import { logoutAction } from "@/lib/actions/auth"

const ROLE_STYLE: Record<string, string> = {
  cliente: "bg-chart-2/15 text-chart-2",
  agente: "bg-primary/15 text-primary",
  admin: "bg-chart-5/15 text-chart-5",
}

export function Topbar({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.push("/ingresar")
      router.refresh()
    })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Mesa de ayuda</p>
        <h1 className="text-base font-semibold leading-tight">Bienvenido, {user.name.split(" ")[0]}</h1>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-2.5 text-sm transition-colors hover:bg-accent"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <span
            className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${ROLE_STYLE[user.role]}`}
          >
            {ROLE_LABEL[user.role]}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
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
