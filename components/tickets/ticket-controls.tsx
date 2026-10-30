"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/ui/field"
import type { TicketTimeEntry } from "@/lib/services/tickets"
import type { CatalogEntry } from "@/lib/services/catalogs"
import {
  type Priority,
  type Status,
  type PublicUser,
} from "@/lib/types"
import { updateStatusAction, updatePriorityAction, assignTicketAction } from "@/lib/actions/tickets"

interface Props {
  ticketId: string
  status: Status
  priority: Priority
  assigneeId: string | null
  agents: PublicUser[]
  role: PublicUser["role"]
  priorityLocked: boolean
  activeTicketEntry: TicketTimeEntry | null
  statusCatalog: CatalogEntry[]
  priorityCatalog: CatalogEntry[]
}

export function TicketControls({
  ticketId,
  status,
  priority,
  assigneeId,
  agents,
  role,
  priorityLocked,
  activeTicketEntry,
  statusCatalog,
  priorityCatalog,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  function run(fn: () => Promise<void>) {
    setErrorMessage("")
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el ticket.")
      }
    })
  }

  function changeAssignee(nextAssigneeId: string | null) {
    let overrideActiveTimer = false
    if (activeTicketEntry && role === "admin") {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(activeTicketEntry.startedAt).getTime()) / 1000),
      )
      if (
        !window.confirm(
          `El agente ${activeTicketEntry.agentName} lleva ${formatDuration(elapsedSeconds)} trabajando en este ticket. ¿Deseas detener su cronómetro, registrar ese tiempo y cambiar el agente?`,
        )
      ) {
        return
      }
      overrideActiveTimer = true
    }

    run(() => assignTicketAction(ticketId, nextAssigneeId, overrideActiveTimer))
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estado</label>
        <Select
          value={status}
          disabled={pending}
          onChange={(e) => run(() => updateStatusAction(ticketId, e.target.value as Status))}
        >
          {statusCatalog
            .filter((entry) => entry.active || entry.value === status)
            .map((entry) => (
            <option key={entry.value} value={entry.value} disabled={!entry.active}>
              {entry.label}{entry.active ? "" : " (Archivado)"}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridad</label>
        <Select
          value={priority}
          disabled={pending || priorityLocked}
          onChange={(e) => run(() => updatePriorityAction(ticketId, e.target.value as Priority))}
        >
          {priorityCatalog
            .filter((entry) => entry.active || entry.value === priority)
            .map((entry) => (
            <option key={entry.value} value={entry.value} disabled={!entry.active}>
              {entry.label}{entry.active ? "" : " (Archivada)"}
            </option>
          ))}
        </Select>
        {priorityLocked && (
          <p className="mt-1 text-xs text-muted-foreground">
            La prioridad queda bloqueada después de la primera asignación.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Agente asignado</label>
        {role === "admin" ? (
          <Select
            value={assigneeId ?? ""}
            disabled={pending}
            onChange={(e) => changeAssignee(e.target.value || null)}
          >
            <option value="">Sin asignar</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        ) : (
          <p className="rounded-lg border border-input px-3 py-2 text-sm">
            {agents.find((agent) => agent.id === assigneeId)?.name ?? "Sin asignar"}
          </p>
        )}
        {activeTicketEntry && (
          <p className="mt-1 text-xs text-muted-foreground">
            Cronómetro activo de {activeTicketEntry.agentName}:{" "}
            {formatDuration(
              Math.max(
                0,
                Math.floor((Date.now() - new Date(activeTicketEntry.startedAt).getTime()) / 1000),
              ),
            )}
            {role === "admin" ? ". Cambiar el agente detendrá y registrará este intervalo." : ". La asignación está bloqueada."}
          </p>
        )}
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":")
}
