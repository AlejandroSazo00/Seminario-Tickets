import type { PublicUser, Ticket } from "@/lib/types"

export function canManageTicket(viewer: PublicUser, ticket: Ticket): boolean {
  return viewer.role === "admin" ||
    (viewer.role === "agente" && ticket.assigneeId === viewer.id)
}

export function canAssignTicket(viewer: PublicUser): boolean {
  return viewer.role === "admin"
}

export function canCommentOnTicket(viewer: PublicUser, ticket: Ticket): boolean {
  if (viewer.role === "cliente") return ticket.requesterId === viewer.id
  return canManageTicket(viewer, ticket)
}
