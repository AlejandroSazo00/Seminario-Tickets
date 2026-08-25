"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/ui/field"
import {
  STATUSES,
  PRIORITIES,
  STATUS_LABEL,
  PRIORITY_LABEL,
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
}

export function TicketControls({ ticketId, status, priority, assigneeId, agents }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estado</label>
        <Select
          value={status}
          disabled={pending}
          onChange={(e) => run(() => updateStatusAction(ticketId, e.target.value as Status))}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridad</label>
        <Select
          value={priority}
          disabled={pending}
          onChange={(e) => run(() => updatePriorityAction(ticketId, e.target.value as Priority))}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Agente asignado</label>
        <Select
          value={assigneeId ?? ""}
          disabled={pending}
          onChange={(e) => run(() => assignTicketAction(ticketId, e.target.value || null))}
        >
          <option value="">Sin asignar</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
