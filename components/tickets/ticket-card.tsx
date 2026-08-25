import Link from "next/link"
import { MessageSquare, User2, Clock } from "lucide-react"
import { PriorityBadge, StatusBadge, ChannelBadge } from "@/components/tickets/badges"
import { relativeTime } from "@/lib/format"
import type { TicketView } from "@/lib/services/tickets"

export function TicketCard({ ticket }: { ticket: TicketView }) {
  return (
    <Link
      href={`/panel/tickets/${ticket.code}`}
      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{ticket.code}</span>
            <ChannelBadge channel={ticket.channel} />
          </div>
          <h3 className="mt-1 truncate font-medium leading-snug">{ticket.title}</h3>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <StatusBadge status={ticket.status} />
        <span className="flex items-center gap-1">
          <User2 className="size-3.5" />
          {ticket.assignee ? ticket.assignee.name : "Sin asignar"}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {ticket.commentCount}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="size-3.5" />
          {relativeTime(ticket.updatedAt)}
        </span>
      </div>
    </Link>
  )
}
