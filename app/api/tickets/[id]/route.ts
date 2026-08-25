import type { NextRequest } from "next/server"
import { withAuth, json, error } from "@/lib/api/respond"
import { getTicketDetail, updateStatus, updatePriority, assignTicket } from "@/lib/services/tickets"
import { PRIORITIES, STATUSES } from "@/lib/types"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params
  const detail = await getTicketDetail(auth.user, id)
  if (!detail) return error("Ticket no encontrado", 404)
  return json(detail)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return error("Cuerpo inválido")

  try {
    let ticket
    if (body.status) {
      if (!STATUSES.includes(body.status)) return error("Estado inválido")
      ticket = await updateStatus(auth.user, id, body.status, body.note)
    } else if (body.priority) {
      if (!PRIORITIES.includes(body.priority)) return error("Prioridad inválida")
      ticket = await updatePriority(auth.user, id, body.priority)
    } else if (body.assigneeId !== undefined) {
      ticket = await assignTicket(auth.user, id, body.assigneeId)
    } else {
      return error("Nada que actualizar")
    }
    return json({ ticket })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    if (msg === "FORBIDDEN") return error("No autorizado", 403)
    if (msg === "NOT_FOUND") return error("Ticket no encontrado", 404)
    return error(msg, 400)
  }
}
