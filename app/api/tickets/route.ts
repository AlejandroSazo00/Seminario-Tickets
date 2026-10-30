import type { NextRequest } from "next/server"
import { withAuth, json, error } from "@/lib/api/respond"
import { listTickets, createTicket, type TicketFilters } from "@/lib/services/tickets"
import { PRIORITIES, type Channel } from "@/lib/types"

export async function GET(req: NextRequest) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const sp = req.nextUrl.searchParams
  const filters: TicketFilters = {
    status: (sp.get("status") as TicketFilters["status"]) ?? undefined,
    priority: (sp.get("priority") as TicketFilters["priority"]) ?? undefined,
    channel: (sp.get("channel") as TicketFilters["channel"]) ?? undefined,
    assigneeId: sp.get("assigneeId") ?? undefined,
    search: sp.get("search") ?? undefined,
  }
  const tickets = await listTickets(auth.user, filters)
  return json({ tickets })
}

export async function POST(req: NextRequest) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.description || !body?.category) {
    return error("title, description y category son obligatorios")
  }
  if (body.channel !== undefined && body.channel !== null && typeof body.channel !== "string") {
    return error("Canal inválido")
  }
  const channel = (body.channel ?? "web") as Channel
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "media"
  try {
    const ticket = await createTicket(auth.user, {
      title: body.title,
      description: body.description,
      category: body.category,
      channel,
      priority,
      requesterId: body.requesterId,
    })
    return json({ ticket }, 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error"
    if (message === "INVALID_CATEGORY") return error("La categoría no existe o está archivada", 400)
    if (message === "INVALID_CATALOG_PRIORITY") return error("La prioridad no existe o está archivada", 400)
    if (message === "INVALID_CATALOG_CHANNEL") return error("El canal no existe o está archivado", 400)
    if (message === "FORBIDDEN") return error("No autorizado", 403)
    throw e
  }
}
