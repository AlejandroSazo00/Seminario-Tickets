import "server-only"
import { neon } from "@neondatabase/serverless"
import { randomUUID } from "node:crypto"
import type { Comment, HistoryEvent, Ticket, User } from "@/lib/types"

/**
 * Cliente SQL sobre Neon (PostgreSQL). Reemplaza el antiguo almacén en memoria.
 *
 * Se usa la función `neon()` con plantillas etiquetadas, que envía consultas
 * parametrizadas por HTTP (previene inyección SQL). Cada servicio del dominio
 * consume este módulo para leer y escribir datos.
 */
export const sql = neon(process.env.DATABASE_URL!)

export { randomUUID }

// ------- Mapeadores fila -> objeto de dominio -------

type Row = Record<string, unknown>

export function rowToUser(r: Row): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as User["role"],
    passwordHash: r.password_hash as string,
    salt: r.salt as string,
    active: r.active as boolean,
    createdAt: toIso(r.created_at),
  }
}

export function rowToTicket(r: Row): Ticket {
  return {
    id: r.id as string,
    code: r.code as string,
    title: r.title as string,
    description: r.description as string,
    category: r.category as string,
    channel: r.channel as Ticket["channel"],
    priority: r.priority as Ticket["priority"],
    status: r.status as Ticket["status"],
    requesterId: r.requester_id as string,
    assigneeId: (r.assignee_id as string | null) ?? null,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
    closedAt: r.closed_at ? toIso(r.closed_at) : null,
  }
}

export function rowToComment(r: Row): Comment {
  return {
    id: r.id as string,
    ticketId: r.ticket_id as string,
    authorId: r.author_id as string,
    body: r.body as string,
    internal: r.internal as boolean,
    createdAt: toIso(r.created_at),
  }
}

export function rowToHistory(r: Row): HistoryEvent {
  return {
    id: r.id as string,
    ticketId: r.ticket_id as string,
    actorId: r.actor_id as string,
    type: r.type as HistoryEvent["type"],
    from: (r.from as string | null) ?? null,
    to: (r.to as string | null) ?? null,
    note: (r.note as string | null) ?? null,
    createdAt: toIso(r.created_at),
  }
}

/** Normaliza timestamps de Postgres a ISO string, como esperaba el dominio. */
function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(value as string).toISOString()
}

/**
 * Reserva y devuelve el siguiente código de ticket (TCK-0001) de forma atómica
 * usando un contador en la tabla `counters`.
 */
export async function nextTicketCode(): Promise<string> {
  const rows = (await sql`
    INSERT INTO counters (name, value)
    VALUES ('ticket', 1)
    ON CONFLICT (name) DO UPDATE SET value = counters.value + 1
    RETURNING value
  `) as Row[]
  const value = Number(rows[0].value)
  return `TCK-${String(value).padStart(4, "0")}`
}
