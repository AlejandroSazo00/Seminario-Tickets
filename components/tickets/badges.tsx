import { cn } from "@/lib/utils"
import {
  CHANNEL_LABEL,
  PRIORITY_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  type Channel,
  type Priority,
  type Role,
  type Status,
} from "@/lib/types"

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"

const STATUS_STYLE: Record<Status, string> = {
  abierto: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  en_progreso: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  en_espera: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  resuelto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cerrado: "bg-muted text-muted-foreground",
}

const STATUS_DOT: Record<Status, string> = {
  abierto: "bg-sky-500",
  en_progreso: "bg-amber-500",
  en_espera: "bg-violet-500",
  resuelto: "bg-emerald-500",
  cerrado: "bg-muted-foreground",
}

const PRIORITY_STYLE: Record<Priority, string> = {
  baja: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  media: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  alta: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  urgente: "bg-red-500/15 text-red-700 dark:text-red-300",
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn(base, STATUS_STYLE[status], className)}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn(base, PRIORITY_STYLE[priority], className)}>{PRIORITY_LABEL[priority]}</span>
}

export function ChannelBadge({ channel, className }: { channel: Channel; className?: string }) {
  return (
    <span className={cn(base, "bg-muted text-muted-foreground", className)}>{CHANNEL_LABEL[channel]}</span>
  )
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const style =
    role === "admin"
      ? "bg-primary/12 text-primary"
      : role === "agente"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : "bg-muted text-muted-foreground"
  return <span className={cn(base, style, className)}>{ROLE_LABEL[role]}</span>
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const init = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary",
        className,
      )}
    >
      {init}
    </span>
  )
}
