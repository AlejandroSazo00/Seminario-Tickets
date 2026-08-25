import type { NextRequest } from "next/server"
import { withAuth, json, error } from "@/lib/api/respond"
import { addComment, getTicketDetail } from "@/lib/services/tickets"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params
  const detail = await getTicketDetail(auth.user, id)
  if (!detail) return error("Ticket no encontrado", 404)
  return json({ comments: detail.comments })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.body?.trim()) return error("El comentario no puede estar vacío")
  try {
    const comment = await addComment(auth.user, id, body.body, Boolean(body.internal))
    return json({ comment }, 201)
  } catch {
    return error("Ticket no encontrado", 404)
  }
}
