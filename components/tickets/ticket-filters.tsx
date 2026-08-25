"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Select } from "@/components/ui/field"
import {
  STATUSES,
  PRIORITIES,
  CHANNELS,
  STATUS_LABEL,
  PRIORITY_LABEL,
  CHANNEL_LABEL,
} from "@/lib/types"

export function TicketFilters({ canManage }: { canManage: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get("q") ?? "")

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (!value || value === "todos" || value === "todas") next.delete(key)
    else next.set(key, value)
    router.replace(`${pathname}?${next.toString()}`)
  }

  // Debounce de la búsqueda
  useEffect(() => {
    const id = setTimeout(() => setParam("q", search), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o código…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>
      <Select
        aria-label="Estado"
        value={params.get("status") ?? "todos"}
        onChange={(e) => setParam("status", e.target.value)}
        className="w-auto"
      >
        <option value="todos">Todos los estados</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Prioridad"
        value={params.get("priority") ?? "todas"}
        onChange={(e) => setParam("priority", e.target.value)}
        className="w-auto"
      >
        <option value="todas">Todas las prioridades</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABEL[p]}
          </option>
        ))}
      </Select>
      {canManage && (
        <Select
          aria-label="Canal"
          value={params.get("channel") ?? "todos"}
          onChange={(e) => setParam("channel", e.target.value)}
          className="w-auto"
        >
          <option value="todos">Todos los canales</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_LABEL[c]}
            </option>
          ))}
        </Select>
      )}
      {canManage && (
        <Select
          aria-label="Asignación"
          value={params.get("assignee") ?? "todos"}
          onChange={(e) => setParam("assignee", e.target.value)}
          className="w-auto"
        >
          <option value="todos">Cualquier asignación</option>
          <option value="sin_asignar">Sin asignar</option>
          <option value="mine">Asignados a mí</option>
        </Select>
      )}
    </div>
  )
}
