import type { NextRequest } from "next/server"
import { withAuth, json, error } from "@/lib/api/respond"
import {
  getTicketTimeTracking,
  startTicketTimeTracking,
  stopTicketTimeTracking,
} from "@/lib/services/tickets"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params

  try {
    return json(await getTicketTimeTracking(auth.user, id))
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error"
    if (message === "FORBIDDEN") return error("No autorizado", 403)
    if (message === "NOT_FOUND") return error("Ticket no encontrado", 404)
    throw e
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const { id } = await params
  const body = await req.json().catch(() => null)

  if (body?.action !== "start" && body?.action !== "stop") {
    return error("Acción inválida; usa start o stop")
  }

  try {
    if (body.action === "start") await startTicketTimeTracking(auth.user, id)
    else await stopTicketTimeTracking(auth.user, id)
    return json(await getTicketTimeTracking(auth.user, id))
  } catch (e) {
    const errorWithCode = e as Error & { code?: string }
    if (errorWithCode.message === "FORBIDDEN") return error("No autorizado", 403)
    if (errorWithCode.message === "NOT_FOUND") return error("Ticket no encontrado", 404)
    if (errorWithCode.message === "TICKET_CLOSED") return error("No se puede iniciar tiempo en un ticket finalizado", 409)
    if (errorWithCode.message === "TIMER_NOT_RUNNING") {
      return error("No hay un cronómetro activo que puedas detener en este ticket", 409)
    }
    if (errorWithCode.code === "23505") {
      return error("Ya hay un cronómetro activo para este ticket o este agente", 409)
    }
    throw e
  }
}
