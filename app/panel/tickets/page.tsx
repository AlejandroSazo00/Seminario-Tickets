import Link from "next/link"
import { Inbox, PlusCircle } from "lucide-react"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { listTickets, type TicketFilters as Filters } from "@/lib/services/tickets"
import { TicketFilters } from "@/components/tickets/ticket-filters"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Channel, Priority, Status } from "@/lib/types"

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await requireUserOrRedirect()
  const sp = await searchParams
  const canManage = user.role === "agente" || user.role === "admin"

  const filters: Filters = {
    status: (sp.status as Status) ?? "todos",
    priority: (sp.priority as Priority) ?? "todas",
    channel: (sp.channel as Channel) ?? "todos",
    search: sp.q,
    assigneeId:
      sp.assignee === "mine" ? user.id : (sp.assignee as Filters["assigneeId"]) ?? "todos",
  }

  const tickets = await listTickets(user, filters)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </p>
        </div>
        <Button render={<Link href="/panel/tickets/nuevo" />}>
          <PlusCircle className="size-4" /> Nuevo ticket
        </Button>
      </div>

      <TicketFilters canManage={canManage} />

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium">No hay tickets que coincidan</p>
          <p className="text-sm text-muted-foreground">Ajusta los filtros o crea un nuevo ticket.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  )
}
