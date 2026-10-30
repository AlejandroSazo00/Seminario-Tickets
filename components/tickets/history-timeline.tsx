import {
  Plus,
  ArrowRightLeft,
  Flag,
  UserCheck,
  MessageSquare,
  Clock3,
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
import type { CatalogEntry } from "@/lib/services/catalogs"

const ICON: Record<HistoryType, React.ComponentType<{ className?: string }>> = {
  creado: Plus,
  estado: ArrowRightLeft,
  prioridad: Flag,
  asignacion: UserCheck,
  comentario: MessageSquare,
  tiempo: Clock3,
  reabierto: RotateCcw,
  categoria: Tag,
}

function describe(ev: HistoryView, labels: Map<string, string>): string {
  const actor = ev.actor?.name ?? "Alguien"
  switch (ev.type) {
    case "creado":
      return `${actor} creó el ticket`
    case "estado":
      return `${actor} cambió el estado a "${labels.get(`status:${ev.to}`) ?? STATUS_LABEL[ev.to as Status] ?? ev.to}"`
    case "reabierto":
      return `${actor} reabrió el ticket (${labels.get(`status:${ev.to}`) ?? STATUS_LABEL[ev.to as Status] ?? ev.to})`
    case "prioridad":
      return `${actor} cambió la prioridad a "${labels.get(`priority:${ev.to}`) ?? PRIORITY_LABEL[ev.to as Priority] ?? ev.to}"`
    case "asignacion":
      return ev.to
        ? `${actor} asignó el ticket a un agente${ev.note ? `. ${ev.note}` : ""}`
        : `${actor} quitó la asignación${ev.note ? `. ${ev.note}` : ""}`
    case "comentario":
      return ev.note === "Nota interna" ? `${actor} añadió una nota interna` : `${actor} comentó`
    case "tiempo":
      return ev.note ?? `${actor} actualizó el registro de tiempo`
    case "categoria":
      return `${actor} cambió la categoría`
    default:
      return `${actor} actualizó el ticket`
  }
}

export function HistoryTimeline({
  history,
  catalogEntries,
}: {
  history: HistoryView[]
  catalogEntries: CatalogEntry[]
}) {
  const labels = new Map(catalogEntries.map((entry) => [`${entry.kind}:${entry.value}`, entry.label]))
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
              <p className="text-sm leading-snug">{describe(ev, labels)}</p>
              <time className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</time>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
