import type { NextRequest } from "next/server"
import { withAuth, json, error } from "@/lib/api/respond"
import { listTickets, createTicket, type TicketFilters } from "@/lib/services/tickets"
import { CHANNELS, PRIORITIES } from "@/lib/types"

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
  const channel = CHANNELS.includes(body.channel) ? body.channel : "web"
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "media"
  const ticket = await createTicket(auth.user, {
    title: body.title,
    description: body.description,
    category: body.category,
    channel,
    priority,
    requesterId: body.requesterId,
  })
  return json({ ticket }, 201)
}
