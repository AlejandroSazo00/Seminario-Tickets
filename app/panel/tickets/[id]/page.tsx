import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Tag, User2 } from "lucide-react"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { getTicketDetail, getTicketTimeTracking } from "@/lib/services/tickets"
import { listAgents } from "@/lib/services/users"
import { PriorityBadge, StatusBadge, ChannelBadge } from "@/components/tickets/badges"
import { TicketControls } from "@/components/tickets/ticket-controls"
import { CommentThread } from "@/components/tickets/comment-thread"
import { HistoryTimeline } from "@/components/tickets/history-timeline"
import { TimeTracker } from "@/components/tickets/time-tracker"
import { Card } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format"
import { canCommentOnTicket, canManageTicket } from "@/lib/tickets/permissions"
import { listCatalogEntries } from "@/lib/services/catalogs"

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUserOrRedirect()
  const detail = await getTicketDetail(user, id)
  if (!detail) notFound()

  const canManage = user.role === "agente" || user.role === "admin"
  const canEditTicket = canManageTicket(user, detail.ticket)
  const canComment = canCommentOnTicket(user, detail.ticket)
  const [agents, timeTracking, catalogEntries] = await Promise.all([
    canManage ? listAgents() : [],
    canManage ? getTicketTimeTracking(user, id) : null,
    listCatalogEntries(),
  ])
  const catalogLabels = Object.fromEntries(
    catalogEntries.map((entry) => [`${entry.kind}:${entry.value}`, entry.label]),
  )
  const { ticket, requester, assignee, comments, history } = detail

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href="/panel/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a tickets
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{ticket.code}</span>
              <StatusBadge status={ticket.status} label={catalogLabels[`status:${ticket.status}`]} />
              <PriorityBadge priority={ticket.priority} label={catalogLabels[`priority:${ticket.priority}`]} />
              <ChannelBadge channel={ticket.channel} label={catalogLabels[`channel:${ticket.channel}`]} />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-balance">{ticket.title}</h1>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">{ticket.description}</p>
          </Card>

          <Card className="p-6">
            <CommentThread
              ticketId={ticket.id}
              comments={comments}
              canManage={canManage}
              canComment={canComment}
              currentUserId={user.id}
            />
          </Card>
        </div>

        <div className="space-y-5">
          {canEditTicket ? (
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Gestión</h3>
              <TicketControls
                ticketId={ticket.id}
                status={ticket.status}
                priority={ticket.priority}
                assigneeId={ticket.assigneeId}
                agents={agents}
                role={user.role}
                priorityLocked={
                  !!ticket.assigneeId ||
                  history.some((event) => event.type === "asignacion" && event.to !== null)
                }
                activeTicketEntry={timeTracking?.activeTicketEntry ?? null}
                statusCatalog={catalogEntries.filter((entry) => entry.kind === "status")}
                priorityCatalog={catalogEntries.filter((entry) => entry.kind === "priority")}
              />
            </Card>
          ) : (
            <Card className="space-y-3 p-5">
              <h3 className="font-semibold">
                {canManage ? "Ticket en solo lectura" : "Detalles"}
              </h3>
              <Detail
                icon={Tag}
                label="Estado"
                value={<StatusBadge status={ticket.status} label={catalogLabels[`status:${ticket.status}`]} />}
              />
              <Detail icon={User2} label="Agente" value={assignee?.name ?? "Sin asignar"} />
              {canManage && (
                <p className="text-xs text-muted-foreground">
                  Solo puedes gestionar tickets asignados a tu usuario. La asignación la administra un administrador.
                </p>
              )}
            </Card>
          )}

          {canManage && timeTracking && (
            <Card className="space-y-4 p-5">
              <h3 className="font-semibold">Tiempo de trabajo</h3>
              <TimeTracker
                ticketId={ticket.id}
                entries={timeTracking.entries}
                totalSeconds={timeTracking.totalSeconds}
                activeEntry={timeTracking.activeEntry}
                activeTicketEntry={timeTracking.activeTicketEntry}
                canControl={canEditTicket}
                isAdmin={user.role === "admin"}
              />
            </Card>
          )}

          <Card className="space-y-3 p-5 text-sm">
            <h3 className="font-semibold">Información</h3>
            <Detail icon={User2} label="Solicitante" value={requester?.name ?? "—"} />
            <Detail icon={Tag} label="Categoría" value={catalogLabels[`category:${ticket.category}`] ?? ticket.category} />
            <Detail icon={Calendar} label="Creado" value={formatDateTime(ticket.createdAt)} />
            <Detail icon={Calendar} label="Actualizado" value={formatDateTime(ticket.updatedAt)} />
            {ticket.closedAt && (
              <Detail icon={Calendar} label="Cerrado" value={formatDateTime(ticket.closedAt)} />
            )}
          </Card>

          <Card className="p-5">
            <HistoryTimeline history={history} catalogEntries={catalogEntries} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
