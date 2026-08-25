import {
  Plus,
  ArrowRightLeft,
  Flag,
  UserCheck,
  MessageSquare,
  RotateCcw,
  Tag,
} from "lucide-react"
import { formatDateTime } from "@/lib/format"
import {
  STATUS_LABEL,
  PRIORITY_LABEL,
  type HistoryType,
  type Status,
  type Priority,
} from "@/lib/types"
import type { HistoryView } from "@/lib/services/tickets"

const ICON: Record<HistoryType, React.ComponentType<{ className?: string }>> = {
  creado: Plus,
  estado: ArrowRightLeft,
  prioridad: Flag,
  asignacion: UserCheck,
  comentario: MessageSquare,
  reabierto: RotateCcw,
  categoria: Tag,
}

function describe(ev: HistoryView): string {
  const actor = ev.actor?.name ?? "Alguien"
  switch (ev.type) {
    case "creado":
      return `${actor} creó el ticket`
    case "estado":
      return `${actor} cambió el estado a "${STATUS_LABEL[ev.to as Status] ?? ev.to}"`
    case "reabierto":
      return `${actor} reabrió el ticket (${STATUS_LABEL[ev.to as Status] ?? ev.to})`
    case "prioridad":
      return `${actor} cambió la prioridad a "${PRIORITY_LABEL[ev.to as Priority] ?? ev.to}"`
    case "asignacion":
      return ev.to ? `${actor} asignó el ticket a un agente` : `${actor} quitó la asignación`
    case "comentario":
      return ev.note === "Nota interna" ? `${actor} añadió una nota interna` : `${actor} comentó`
    case "categoria":
      return `${actor} cambió la categoría`
    default:
      return `${actor} actualizó el ticket`
  }
}

export function HistoryTimeline({ history }: { history: HistoryView[] }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold">Historial</h3>
      <ol className="relative space-y-4 border-l border-border pl-6">
        {history.map((ev) => {
          const Icon = ICON[ev.type]
          return (
            <li key={ev.id} className="relative">
              <span className="absolute -left-[31px] flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                <Icon className="size-3.5" />
              </span>
              <p className="text-sm leading-snug">{describe(ev)}</p>
              <time className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</time>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
