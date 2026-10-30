"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Clock3, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TicketTimeEntry } from "@/lib/services/tickets"
import { formatDateTime } from "@/lib/format"

export function TimeTracker({
  ticketId,
  entries,
  totalSeconds,
  activeEntry,
  activeTicketEntry,
  canControl,
  isAdmin,
}: {
  ticketId: string
  entries: TicketTimeEntry[]
  totalSeconds: number
  activeEntry: TicketTimeEntry | null
  activeTicketEntry: TicketTimeEntry | null
  canControl: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!activeTicketEntry) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [activeTicketEntry])

  const currentSeconds = activeTicketEntry
    ? Math.max(0, Math.floor((now - new Date(activeTicketEntry.startedAt).getTime()) / 1000))
    : 0
  const canStop = !!activeTicketEntry && (isAdmin || !!activeEntry)
  const canStart = canControl && !activeTicketEntry

  function run(action: "start" | "stop") {
    setErrorMessage("")
    if (action === "stop" && activeTicketEntry && !activeEntry && isAdmin) {
      if (
        !window.confirm(
          `El timer de ${activeTicketEntry.agentName} lleva ${formatDuration(currentSeconds)} activo. ¿Deseas detenerlo y registrar ese tiempo?`,
        )
      ) {
        return
      }
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "No se pudo registrar el tiempo")
        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar el tiempo")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Tiempo registrado</p>
          <p className="font-mono text-lg font-semibold">
            {formatDuration(totalSeconds + currentSeconds)}
          </p>
        </div>
        {canControl && (
          <Button
            type="button"
            variant={canStop ? "destructive" : "default"}
            disabled={pending || (!canStop && !canStart)}
            onClick={() => run(canStop ? "stop" : "start")}
          >
            {canStop ? <Square /> : <Play />}
            {canStop ? "Detener" : canStart ? "Iniciar" : "En curso"}
          </Button>
        )}
      </div>

      {activeTicketEntry && (
        <p className="text-xs text-muted-foreground">
          Cronómetro activo de {activeTicketEntry.agentName}: {formatDuration(currentSeconds)}
          {!canControl && " · Solo lectura"}
        </p>
      )}
      {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}

      {entries.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="size-4" /> Intervalos registrados
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {entries.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate">{entry.agentName}</span>
                  <span className="text-muted-foreground">{formatDateTime(entry.startedAt)}</span>
                </span>
                <span className="shrink-0 font-mono">
                  {entry.durationSeconds === null
                    ? "En curso"
                    : formatDuration(entry.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":")
}
