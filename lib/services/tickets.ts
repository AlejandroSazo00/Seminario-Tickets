import "server-only"
import { sql, rowToTicket, rowToComment, rowToHistory, nextTicketCode, randomUUID } from "@/lib/db/sql"
import type {
  Channel,
  Comment,
  HistoryEvent,
  Priority,
  PublicUser,
  Status,
  Ticket,
} from "@/lib/types"
import { PRIORITY_WEIGHT } from "@/lib/types"
import { userMap } from "@/lib/services/users"
import { canAssignTicket, canCommentOnTicket, canManageTicket } from "@/lib/tickets/permissions"
import { getCatalogLabelMap, isActiveCatalogValue } from "@/lib/services/catalogs"

type Row = Record<string, unknown>

// ------- View models -------

export interface TicketView extends Ticket {
  requester: PublicUser | null
  assignee: PublicUser | null
  commentCount: number
  statusLabel: string
  priorityLabel: string
  channelLabel: string
}

export interface CommentView extends Comment {
  author: PublicUser | null
}

export interface HistoryView extends HistoryEvent {
  actor: PublicUser | null
}

export interface TicketDetail {
  ticket: Ticket
  requester: PublicUser | null
  assignee: PublicUser | null
  comments: CommentView[]
  history: HistoryView[]
}

export interface TicketTimeEntry {
  id: string
  ticketId: string
  agentId: string
  agentName: string
  startedAt: string
  stoppedAt: string | null
  durationSeconds: number | null
}

export interface TicketTimeTracking {
  entries: TicketTimeEntry[]
  totalSeconds: number
  activeEntry: TicketTimeEntry | null
  activeTicketEntry: TicketTimeEntry | null
}

export interface TicketFilters {
  status?: Status | "todos"
  priority?: Priority | "todas"
  channel?: Channel | "todos"
  assigneeId?: string | "todos" | "sin_asignar"
  search?: string
}

// ------- Helpers -------

function canManage(viewer: PublicUser): boolean {
  return viewer.role === "agente" || viewer.role === "admin"
}

function canView(viewer: PublicUser, t: Ticket): boolean {
  if (canManage(viewer)) return true
  return t.requesterId === viewer.id
}

async function addHistory(
  ticketId: string,
  actorId: string,
  ev: Omit<HistoryEvent, "id" | "ticketId" | "actorId" | "createdAt">,
) {
  await sql`
    INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
    VALUES (${randomUUID()}, ${ticketId}, ${actorId}, ${ev.type}, ${ev.from}, ${ev.to}, ${ev.note})
  `
}

async function findTicket(id: string): Promise<Ticket | null> {
  const rows = (await sql`SELECT * FROM tickets WHERE id = ${id} OR code = ${id} LIMIT 1`) as Row[]
  return rows[0] ? rowToTicket(rows[0]) : null
}

async function touch(id: string) {
  await sql`UPDATE tickets SET updated_at = now() WHERE id = ${id}`
}

// ------- Consultas -------

export async function listTickets(viewer: PublicUser, filters: TicketFilters = {}): Promise<TicketView[]> {
  const ticketRows = (
    canManage(viewer)
      ? await sql`SELECT * FROM tickets`
      : await sql`SELECT * FROM tickets WHERE requester_id = ${viewer.id}`
  ) as Row[]

  let rows = ticketRows.map(rowToTicket)

  if (filters.status && filters.status !== "todos") rows = rows.filter((t) => t.status === filters.status)
  if (filters.priority && filters.priority !== "todas") rows = rows.filter((t) => t.priority === filters.priority)
  if (filters.channel && filters.channel !== "todos") rows = rows.filter((t) => t.channel === filters.channel)
  if (filters.assigneeId && filters.assigneeId !== "todos") {
    if (filters.assigneeId === "sin_asignar") rows = rows.filter((t) => !t.assigneeId)
    else rows = rows.filter((t) => t.assigneeId === filters.assigneeId)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    rows = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    )
  }

  // Orden: primero abiertos por prioridad, luego por actualización reciente
  rows.sort((a, b) => {
    const openA = a.status === "cerrado" || a.status === "resuelto" ? 1 : 0
    const openB = b.status === "cerrado" || b.status === "resuelto" ? 1 : 0
    if (openA !== openB) return openA - openB
    const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (pw !== 0) return pw
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const [users, counts, catalogLabels] = await Promise.all([
    userMap(),
    commentCounts(),
    getCatalogLabelMap(),
  ])

  return rows.map((t) => ({
    ...t,
    requester: users.get(t.requesterId) ?? null,
    assignee: t.assigneeId ? (users.get(t.assigneeId) ?? null) : null,
    commentCount: counts.get(t.id) ?? 0,
    statusLabel: catalogLabels[`status:${t.status}`] ?? t.status,
    priorityLabel: catalogLabels[`priority:${t.priority}`] ?? t.priority,
    channelLabel: catalogLabels[`channel:${t.channel}`] ?? t.channel,
  }))
}

async function commentCounts(): Promise<Map<string, number>> {
  const rows = (await sql`SELECT ticket_id, count(*)::int AS n FROM comments GROUP BY ticket_id`) as Row[]
  return new Map(rows.map((r) => [r.ticket_id as string, Number(r.n)]))
}

export async function getTicketDetail(viewer: PublicUser, id: string): Promise<TicketDetail | null> {
  const ticket = await findTicket(id)
  if (!ticket || !canView(viewer, ticket)) return null

  const manage = canManage(viewer)
  const users = await userMap()

  const commentRows = (await sql`
    SELECT * FROM comments WHERE ticket_id = ${ticket.id} ORDER BY created_at ASC
  `) as Row[]
  const comments: CommentView[] = commentRows
    .map(rowToComment)
    .filter((c) => manage || !c.internal) // los clientes no ven notas internas
    .map((c) => ({ ...c, author: users.get(c.authorId) ?? null }))

  const historyRows = (await sql`
    SELECT * FROM history WHERE ticket_id = ${ticket.id} ORDER BY created_at ASC
  `) as Row[]
  const history: HistoryView[] = historyRows.map(rowToHistory).map((h) => ({
    ...h,
    actor: users.get(h.actorId) ?? null,
  }))

  return {
    ticket,
    requester: users.get(ticket.requesterId) ?? null,
    assignee: ticket.assigneeId ? (users.get(ticket.assigneeId) ?? null) : null,
    comments,
    history,
  }
}

// ------- Mutaciones -------

export interface CreateTicketInput {
  title: string
  description: string
  category: string
  channel: Channel
  priority: Priority
  requesterId?: string // solo agentes/admin pueden crear en nombre de otro
}

export async function createTicket(viewer: PublicUser, input: CreateTicketInput): Promise<Ticket> {
  const [categoryActive, priorityActive, channelActive] = await Promise.all([
    isActiveCatalogValue("category", input.category),
    isActiveCatalogValue("priority", input.priority),
    isActiveCatalogValue("channel", input.channel),
  ])
  if (!categoryActive) throw new Error("INVALID_CATEGORY")
  if (!priorityActive) throw new Error("INVALID_CATALOG_PRIORITY")
  if (!channelActive) throw new Error("INVALID_CATALOG_CHANNEL")
  const requesterId = canManage(viewer) && input.requesterId ? input.requesterId : viewer.id
  const id = randomUUID()
  const code = await nextTicketCode()
  const rows = (await sql`
    INSERT INTO tickets (id, code, title, description, category, channel, priority, status, requester_id, assignee_id)
    VALUES (
      ${id}, ${code}, ${input.title.trim()}, ${input.description.trim()}, ${input.category},
      ${input.channel}, ${input.priority}, 'abierto', ${requesterId}, NULL
    )
    RETURNING *
  `) as Row[]
  const ticket = rowToTicket(rows[0])
  await addHistory(ticket.id, viewer.id, {
    type: "creado",
    from: null,
    to: null,
    note: `Creado por canal ${input.channel}`,
  })
  return ticket
}

export async function updateStatus(viewer: PublicUser, id: string, status: Status, note?: string): Promise<Ticket> {
  const t = await requireManageableTicket(viewer, id)
  if (t.status === status) return t
  if (!(await isActiveCatalogValue("status", status))) throw new Error("INVALID_CATALOG_STATUS")
  const from = t.status
  const reopened =
    (from === "resuelto" || from === "cerrado") && (status === "abierto" || status === "en_progreso")
  // "resuelto" y "cerrado" son ambos estados terminales: registramos closedAt
  // en cualquiera de los dos para que los reportes de tiempo de resolución
  // los contemplen. Al reabrir (pasar a abierto/en_progreso) se limpia.
  const closedAt = status === "cerrado" || status === "resuelto" ? new Date().toISOString() : null
  const [lockedRows, , rows] = await sql.transaction([
    sql`
      SELECT id FROM tickets
      WHERE id = ${t.id}
        AND (${viewer.role === "admin"} OR assignee_id = ${viewer.id})
      FOR UPDATE
    `,
    sql`
      WITH stopped AS (
        UPDATE ticket_time_entries
        SET stopped_at = now(),
            duration_seconds = GREATEST(0, floor(extract(epoch FROM (now() - started_at)))::integer)
        WHERE ticket_id = ${t.id}
          AND stopped_at IS NULL
          AND ${closedAt !== null}
          AND EXISTS (
            SELECT 1 FROM tickets
            WHERE id = ${t.id}
              AND (${viewer.role === "admin"} OR assignee_id = ${viewer.id})
          )
        RETURNING agent_id, duration_seconds
      )
      INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
      SELECT
        ${randomUUID()},
        ${t.id},
        ${viewer.id},
        'tiempo',
        NULL,
        NULL,
        'Cronómetro(s) detenido(s) automáticamente al finalizar el ticket: ' ||
          string_agg(
            agent.name || ' (' ||
              lpad((stopped.duration_seconds / 3600)::text, 2, '0') || ':' ||
              lpad(((stopped.duration_seconds % 3600) / 60)::text, 2, '0') || ':' ||
              lpad((stopped.duration_seconds % 60)::text, 2, '0') || ')',
            ', '
          ) || '.'
      FROM stopped
      JOIN users AS agent ON agent.id = stopped.agent_id
      HAVING count(*) > 0
    `,
    sql`
      UPDATE tickets SET status = ${status}, closed_at = ${closedAt}, updated_at = now()
      WHERE id = ${t.id}
        AND (${viewer.role === "admin"} OR assignee_id = ${viewer.id})
      RETURNING *
    `,
    sql`
      INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
      SELECT
        ${randomUUID()}, ${t.id}, ${viewer.id}, ${reopened ? "reabierto" : "estado"},
        ${from}, ${status}, ${note ?? null}
      WHERE EXISTS (
        SELECT 1 FROM tickets
        WHERE id = ${t.id}
          AND (${viewer.role === "admin"} OR assignee_id = ${viewer.id})
      )
    `,
  ])
  if (lockedRows.length === 0 || (rows as Row[]).length === 0) throw new Error("FORBIDDEN")
  return rowToTicket((rows as Row[])[0])
}

export async function updatePriority(viewer: PublicUser, id: string, priority: Priority): Promise<Ticket> {
  const t = await requireManageableTicket(viewer, id)
  if (t.priority === priority) return t
  if (!(await isActiveCatalogValue("priority", priority))) throw new Error("INVALID_CATALOG_PRIORITY")

  const from = t.priority
  const rows = (await sql`
    UPDATE tickets
    SET priority = ${priority}, updated_at = now()
    WHERE id = ${t.id}
      AND assignee_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM history
        WHERE ticket_id = ${t.id} AND type = 'asignacion' AND "to" IS NOT NULL
      )
    RETURNING *
  `) as Row[]
  if (rows.length === 0) throw new Error("PRIORITY_LOCKED")
  await addHistory(t.id, viewer.id, { type: "prioridad", from, to: priority, note: null })
  return rowToTicket(rows[0])
}

export async function assignTicket(
  viewer: PublicUser,
  id: string,
  assigneeId: string | null,
  overrideActiveTimer = false,
): Promise<Ticket> {
  if (!canAssignTicket(viewer)) throw new Error("FORBIDDEN")
  const t = await requireManageableTicket(viewer, id)
  const from = t.assigneeId
  if (from === assigneeId) return t

  if (assigneeId) {
    const assigneeRows = (await sql`
      SELECT id
      FROM users
      WHERE id = ${assigneeId}
        AND active = true
        AND role IN ('agente', 'admin')
    `) as Row[]
    if (assigneeRows.length === 0) throw new Error("INVALID_ASSIGNEE")
  }

  const [lockedRows, activeRows, updatedRows] = await sql.transaction([
    sql`SELECT id FROM tickets WHERE id = ${t.id} FOR UPDATE`,
    sql`
    SELECT entry.agent_id, agent.name AS agent_name, entry.started_at
    FROM ticket_time_entries AS entry
    JOIN users AS agent ON agent.id = entry.agent_id
    WHERE entry.ticket_id = ${t.id} AND entry.stopped_at IS NULL
    ORDER BY entry.started_at ASC
    `,
    sql`
      WITH active AS (
        SELECT entry.agent_id, entry.started_at
        FROM ticket_time_entries AS entry
        WHERE entry.ticket_id = ${t.id} AND entry.stopped_at IS NULL
      ),
      stopped AS (
        UPDATE ticket_time_entries
        SET stopped_at = now(),
            duration_seconds = GREATEST(0, floor(extract(epoch FROM (now() - started_at)))::integer)
        WHERE ticket_id = ${t.id}
          AND stopped_at IS NULL
          AND ${overrideActiveTimer}
        RETURNING agent_id, duration_seconds
      ),
      updated AS (
        UPDATE tickets
        SET assignee_id = ${assigneeId},
            status = CASE WHEN ${assigneeId !== null} AND status = 'abierto' THEN 'en_progreso' ELSE status END,
            updated_at = now()
        WHERE id = ${t.id}
          AND (${overrideActiveTimer} OR NOT EXISTS (SELECT 1 FROM active))
        RETURNING *
      ),
      timer_note AS (
        SELECT string_agg(
          agent.name || ' (' ||
            lpad((stopped.duration_seconds / 3600)::text, 2, '0') || ':' ||
            lpad(((stopped.duration_seconds % 3600) / 60)::text, 2, '0') || ':' ||
            lpad((stopped.duration_seconds % 60)::text, 2, '0') || ')',
          ', '
        ) AS details
        FROM stopped
        JOIN users AS agent ON agent.id = stopped.agent_id
      ),
      history_written AS (
        INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
        SELECT
          ${randomUUID()},
          updated.id,
          ${viewer.id},
          'asignacion',
          ${from},
          ${assigneeId},
          CASE
            WHEN timer_note.details IS NULL THEN NULL
            ELSE 'Cronómetro detenido al reasignar. Agente(s) anterior(es) y tiempo: ' || timer_note.details || '.'
          END
        FROM updated
        CROSS JOIN timer_note
        RETURNING ticket_id
      )
      SELECT * FROM updated
    `,
  ])
  const ticketRows = updatedRows as Row[]
  if (lockedRows.length === 0) throw new Error("NOT_FOUND")
  if (ticketRows.length === 0) {
    if (activeRows.length > 0) throw new Error("ACTIVE_TIMER")
    throw new Error("TICKET_UPDATE_FAILED")
  }
  return rowToTicket(ticketRows[0])
}

export async function addComment(viewer: PublicUser, id: string, body: string, internal = false): Promise<Comment> {
  const ticket = await findTicket(id)
  if (!ticket) throw new Error("NOT_FOUND")
  if (!canCommentOnTicket(viewer, ticket)) throw new Error("FORBIDDEN")
  const isInternal = canManage(viewer) ? internal : false // clientes no crean notas internas
  const [lockedRows, commentRows] = await sql.transaction([
    sql`
      SELECT id FROM tickets
      WHERE id = ${ticket.id}
        AND (
          ${viewer.role === "admin"}
          OR (${viewer.role === "agente"} AND assignee_id = ${viewer.id})
          OR (${viewer.role === "cliente"} AND requester_id = ${viewer.id})
        )
      FOR UPDATE
    `,
    sql`
      WITH inserted AS (
        INSERT INTO comments (id, ticket_id, author_id, body, internal)
        SELECT ${randomUUID()}, id, ${viewer.id}, ${body.trim()}, ${isInternal}
        FROM tickets
        WHERE id = ${ticket.id}
          AND (
            ${viewer.role === "admin"}
            OR (${viewer.role === "agente"} AND assignee_id = ${viewer.id})
            OR (${viewer.role === "cliente"} AND requester_id = ${viewer.id})
          )
        RETURNING *
      ),
      history_written AS (
        INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
        SELECT
          ${randomUUID()}, ticket_id, ${viewer.id}, 'comentario', NULL, NULL,
          ${isInternal ? "Nota interna" : null}
        FROM inserted
        RETURNING id
      ),
      updated AS (
        UPDATE tickets
        SET updated_at = now()
        WHERE id = ${ticket.id} AND EXISTS (SELECT 1 FROM inserted)
        RETURNING id
      )
      SELECT * FROM inserted
    `,
  ])
  if (lockedRows.length === 0 || commentRows.length === 0) throw new Error("FORBIDDEN")
  return rowToComment((commentRows as Row[])[0])
}

export async function getTicketTimeTracking(viewer: PublicUser, id: string): Promise<TicketTimeTracking> {
  if (!canManage(viewer)) throw new Error("FORBIDDEN")
  const ticket = await findTicket(id)
  if (!ticket) throw new Error("NOT_FOUND")

  const rows = (await sql`
    SELECT entry.*, agent.name AS agent_name
    FROM ticket_time_entries AS entry
    JOIN users AS agent ON agent.id = entry.agent_id
    WHERE entry.ticket_id = ${ticket.id}
    ORDER BY entry.started_at DESC
  `) as Row[]

  const entries = rows.map((row): TicketTimeEntry => ({
    id: row.id as string,
    ticketId: row.ticket_id as string,
    agentId: row.agent_id as string,
    agentName: row.agent_name as string,
    startedAt: new Date(row.started_at as string).toISOString(),
    stoppedAt: row.stopped_at ? new Date(row.stopped_at as string).toISOString() : null,
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
  }))

  return {
    entries,
    totalSeconds: entries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0),
    activeEntry: entries.find((entry) => entry.agentId === viewer.id && entry.stoppedAt === null) ?? null,
    activeTicketEntry: entries.find((entry) => entry.stoppedAt === null) ?? null,
  }
}

export async function startTicketTimeTracking(viewer: PublicUser, id: string): Promise<void> {
  const ticket = await requireManageableTicket(viewer, id)
  if (ticket.status === "cerrado" || ticket.status === "resuelto") {
    throw new Error("TICKET_CLOSED")
  }

  const rows = (await sql`
    WITH eligible AS (
      SELECT id
      FROM tickets
      WHERE id = ${ticket.id}
        AND (${viewer.role === "admin"} OR assignee_id = ${viewer.id})
        AND status NOT IN ('resuelto', 'cerrado')
      FOR UPDATE
    )
    INSERT INTO ticket_time_entries (id, ticket_id, agent_id)
    SELECT ${randomUUID()}, eligible.id, ${viewer.id}
    FROM eligible
    RETURNING id
  `) as Row[]
  if (rows.length === 0) throw new Error("FORBIDDEN")
  await touch(ticket.id)
}

export async function stopTicketTimeTracking(viewer: PublicUser, id: string): Promise<void> {
  if (!canManage(viewer)) throw new Error("FORBIDDEN")
  const ticket = await findTicket(id)
  if (!ticket) throw new Error("NOT_FOUND")
  if (!canManageTicket(viewer, ticket)) throw new Error("FORBIDDEN")

  const rows = (await sql`
    WITH stopped AS (
      UPDATE ticket_time_entries
      SET stopped_at = now(),
          duration_seconds = GREATEST(0, floor(extract(epoch FROM (now() - started_at)))::integer)
      WHERE ticket_id = ${ticket.id}
        AND (${viewer.role === "admin"} OR agent_id = ${viewer.id})
        AND stopped_at IS NULL
      RETURNING agent_id, duration_seconds
    ),
    history_written AS (
      INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note)
      SELECT
        ${randomUUID()}, ${ticket.id}, ${viewer.id}, 'tiempo', NULL, NULL,
        ${viewer.role === "admin" ? "Administrador detuvo manualmente el cronómetro: " : "Agente detuvo su cronómetro: "} ||
          string_agg(
            agent.name || ' (' ||
              lpad((stopped.duration_seconds / 3600)::text, 2, '0') || ':' ||
              lpad(((stopped.duration_seconds % 3600) / 60)::text, 2, '0') || ':' ||
              lpad((stopped.duration_seconds % 60)::text, 2, '0') || ')',
            ', '
          ) || '.'
      FROM stopped
      JOIN users AS agent ON agent.id = stopped.agent_id
      HAVING count(*) > 0
      RETURNING id
    )
    SELECT * FROM stopped
  `) as Row[]
  if (rows.length === 0) throw new Error("TIMER_NOT_RUNNING")
  await touch(ticket.id)
}

async function requireManageableTicket(viewer: PublicUser, id: string): Promise<Ticket> {
  const t = await findTicket(id)
  if (!t) throw new Error("NOT_FOUND")
  if (!canManageTicket(viewer, t)) throw new Error("FORBIDDEN")
  return t
}

function formatElapsedSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")
}

// ------- Reportes -------

export interface ReportData {
  total: number
  abiertos: number
  sinAsignar: number
  resueltosUltimos7: number
  porEstado: { key: Status; label: string; value: number }[]
  porPrioridad: { key: Priority; label: string; value: number }[]
  porCanal: { key: Channel; label: string; value: number }[]
  porAgente: { name: string; activos: number; resueltos: number }[]
  tiempoPorAgenteTarea: {
    agentId: string
    agentName: string
    ticketCode: string
    ticketTitle: string
    totalSeconds: number
  }[]
  tendencia: { fecha: string; creados: number; resueltos: number }[]
  tiempoPromedioResolucionHoras: number | null
}

export async function getReports(viewer: PublicUser): Promise<ReportData> {
  const { STATUSES, PRIORITIES, CHANNELS } = await import("@/lib/types")
  const catalogLabels = await getCatalogLabelMap()
  const { getActiveCatalog } = await import("@/lib/services/catalogs")
  const channels = await getActiveCatalog("channel")

  const ticketRows = (
    viewer.role === "cliente"
      ? await sql`SELECT * FROM tickets WHERE requester_id = ${viewer.id}`
      : await sql`SELECT * FROM tickets`
  ) as Row[]
  const tickets = ticketRows.map(rowToTicket)

  const count = <T extends string>(keys: T[], pick: (t: Ticket) => T, label: Record<T, string>) =>
    keys.map((key) => ({ key, label: label[key], value: tickets.filter((t) => pick(t) === key).length }))

  const now = Date.now()
  const resueltosUltimos7 = tickets.filter(
    (t) =>
      (t.status === "resuelto" || t.status === "cerrado") &&
      t.closedAt &&
      now - new Date(t.closedAt).getTime() < 7 * 86_400_000,
  ).length

  // Tendencia últimos 7 días
  const tendencia: ReportData["tendencia"] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - i * 86_400_000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = dayStart.getTime() + 86_400_000
    const label = dayStart.toLocaleDateString("es", { day: "2-digit", month: "short" })
    tendencia.push({
      fecha: label,
      creados: tickets.filter((t) => {
        const c = new Date(t.createdAt).getTime()
        return c >= dayStart.getTime() && c < dayEnd
      }).length,
      resueltos: tickets.filter((t) => {
        if (!t.closedAt) return false
        const c = new Date(t.closedAt).getTime()
        return c >= dayStart.getTime() && c < dayEnd
      }).length,
    })
  }

  // Por agente — igual que /api/users, los clientes no deben ver el listado
  // ni la carga de trabajo del equipo de soporte.
  const porAgente =
    viewer.role === "cliente"
      ? []
      : (
          ((await sql`SELECT * FROM users WHERE role IN ('agente', 'admin')`) as Row[]).map((a) => ({
            name: a.name as string,
            activos: tickets.filter(
              (t) => t.assigneeId === a.id && t.status !== "cerrado" && t.status !== "resuelto",
            ).length,
            resueltos: tickets.filter(
              (t) => t.assigneeId === a.id && (t.status === "cerrado" || t.status === "resuelto"),
            ).length,
          })) as { name: string; activos: number; resueltos: number }[]
        ).filter((a) => a.activos + a.resueltos > 0)

  const tiempoPorAgenteTarea: ReportData["tiempoPorAgenteTarea"] =
    viewer.role !== "admin"
      ? []
      : (
          (await sql`
            SELECT
              agent.id AS agent_id,
              agent.name AS agent_name,
              ticket.code AS ticket_code,
              ticket.title AS ticket_title,
              SUM(
                CASE
                  WHEN entry.stopped_at IS NULL
                    THEN GREATEST(0, floor(extract(epoch FROM (now() - entry.started_at)))::integer)
                  ELSE entry.duration_seconds
                END
              )::int AS total_seconds
            FROM ticket_time_entries AS entry
            JOIN users AS agent ON agent.id = entry.agent_id
            JOIN tickets AS ticket ON ticket.id = entry.ticket_id
            GROUP BY agent.id, agent.name, ticket.id, ticket.code, ticket.title
            ORDER BY agent.name, ticket.code
          `) as Row[]
        ).map((row) => ({
          agentId: row.agent_id as string,
          agentName: row.agent_name as string,
          ticketCode: row.ticket_code as string,
          ticketTitle: row.ticket_title as string,
          totalSeconds: Number(row.total_seconds),
        }))

  // Tiempo promedio de resolución
  const resueltos = tickets.filter((t) => t.closedAt)
  const avg =
    resueltos.length > 0
      ? resueltos.reduce(
          (acc, t) => acc + (new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime()),
          0,
        ) /
        resueltos.length /
        3_600_000
      : null

  return {
    total: tickets.length,
    abiertos: tickets.filter((t) => t.status !== "cerrado" && t.status !== "resuelto").length,
    sinAsignar: tickets.filter((t) => !t.assigneeId && t.status !== "cerrado").length,
    resueltosUltimos7,
    porEstado: count(
      STATUSES,
      (t) => t.status,
      Object.fromEntries(STATUSES.map((status) => [status, catalogLabels[`status:${status}`] ?? status])) as Record<Status, string>,
    ),
    porPrioridad: count(
      PRIORITIES,
      (t) => t.priority,
      Object.fromEntries(PRIORITIES.map((priority) => [priority, catalogLabels[`priority:${priority}`] ?? priority])) as Record<Priority, string>,
    ),
    porCanal: channels.map((channel) => ({
      key: channel.value as Channel,
      label: channel.label,
      value: tickets.filter((ticket) => ticket.channel === channel.value).length,
    })).concat(
      CHANNELS.filter((channel) => !channels.some((entry) => entry.value === channel))
        .filter((channel) => tickets.some((ticket) => ticket.channel === channel))
        .map((channel) => ({
          key: channel,
          label: catalogLabels[`channel:${channel}`] ?? channel,
          value: tickets.filter((ticket) => ticket.channel === channel).length,
        })),
    ),
    porAgente,
    tiempoPorAgenteTarea,
    tendencia,
    tiempoPromedioResolucionHoras: avg ? Math.round(avg * 10) / 10 : null,
  }
}
