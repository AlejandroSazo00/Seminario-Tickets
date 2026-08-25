import { neon } from "@neondatabase/serverless"
import { randomUUID, randomBytes, scryptSync } from "node:crypto"

const sql = neon(process.env.DATABASE_URL)

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return { hash, salt }
}

const now = Date.now()
const daysAgo = (d) => new Date(now - d * 86_400_000).toISOString()
const hoursAgo = (h) => new Date(now - h * 3_600_000).toISOString()

function mkUser(name, email, role) {
  const { hash, salt } = hashPassword("demo1234")
  return { id: randomUUID(), name, email, role, passwordHash: hash, salt, createdAt: daysAgo(120) }
}

async function main() {
  console.log("[seed] limpiando tablas…")
  await sql`TRUNCATE users, tickets, comments, history, counters RESTART IDENTITY CASCADE`

  const admin = mkUser("Ana Torres", "admin@soporte.dev", "admin")
  const agent1 = mkUser("Bruno Díaz", "bruno@soporte.dev", "agente")
  const agent2 = mkUser("Carla Ruiz", "carla@soporte.dev", "agente")
  const client1 = mkUser("Diego López", "diego@empresa.com", "cliente")
  const client2 = mkUser("Elena Marín", "elena@empresa.com", "cliente")
  const client3 = mkUser("Franco Vidal", "franco@empresa.com", "cliente")
  const users = [admin, agent1, agent2, client1, client2, client3]

  for (const u of users) {
    await sql`
      INSERT INTO users (id, name, email, role, password_hash, salt, active, created_at)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.passwordHash}, ${u.salt}, true, ${u.createdAt})
    `
  }
  console.log(`[seed] ${users.length} usuarios insertados`)

  let seq = 0
  const tickets = []
  const comments = []
  const history = []

  async function mkTicket(opts) {
    seq += 1
    const code = `TCK-${String(seq).padStart(4, "0")}`
    const createdAt = daysAgo(opts.createdDaysAgo)
    const updatedAt = hoursAgo(opts.updatedHoursAgo)
    const t = {
      id: randomUUID(),
      code,
      title: opts.title,
      description: opts.description,
      category: opts.category,
      channel: opts.channel,
      priority: opts.priority,
      status: opts.status,
      requesterId: opts.requesterId,
      assigneeId: opts.assigneeId,
      createdAt,
      updatedAt,
      closedAt: opts.closed ? updatedAt : null,
    }
    tickets.push(t)
    history.push({
      id: randomUUID(),
      ticketId: t.id,
      actorId: opts.requesterId,
      type: "creado",
      from: null,
      to: null,
      note: `Ticket creado por el canal ${opts.channel}`,
      createdAt,
    })
    if (opts.assigneeId) {
      history.push({
        id: randomUUID(),
        ticketId: t.id,
        actorId: admin.id,
        type: "asignacion",
        from: null,
        to: opts.assigneeId,
        note: null,
        createdAt: hoursAgo(opts.updatedHoursAgo + 2),
      })
    }
    return t
  }

  const t1 = await mkTicket({
    title: "No puedo iniciar sesión en el portal",
    description:
      "Al ingresar mis credenciales el sistema muestra 'error inesperado' y no me permite acceder. Ya intenté restablecer la contraseña sin éxito.",
    category: "Acceso y cuentas",
    channel: "email",
    priority: "alta",
    status: "en_progreso",
    requesterId: client1.id,
    assigneeId: agent1.id,
    createdDaysAgo: 3,
    updatedHoursAgo: 5,
  })
  comments.push({
    id: randomUUID(),
    ticketId: t1.id,
    authorId: agent1.id,
    body: "Hola Diego, estamos revisando tu cuenta. ¿Podrías indicarnos desde qué navegador ingresas?",
    internal: false,
    createdAt: hoursAgo(20),
  })
  comments.push({
    id: randomUUID(),
    ticketId: t1.id,
    authorId: client1.id,
    body: "Uso Google Chrome en Windows 11.",
    internal: false,
    createdAt: hoursAgo(8),
  })
  history.push({
    id: randomUUID(),
    ticketId: t1.id,
    actorId: agent1.id,
    type: "estado",
    from: "abierto",
    to: "en_progreso",
    note: null,
    createdAt: hoursAgo(21),
  })

  await mkTicket({
    title: "Factura del mes de marzo con monto incorrecto",
    description: "La factura FA-2024-0312 muestra un cargo duplicado por el plan Premium.",
    category: "Facturación",
    channel: "web",
    priority: "media",
    status: "abierto",
    requesterId: client2.id,
    assigneeId: null,
    createdDaysAgo: 1,
    updatedHoursAgo: 22,
  })

  const t3 = await mkTicket({
    title: "La aplicación se cierra al exportar reportes",
    description: "Cada vez que intento exportar un reporte a PDF la aplicación de escritorio se cierra por completo.",
    category: "Errores de software",
    channel: "chat",
    priority: "urgente",
    status: "en_espera",
    requesterId: client3.id,
    assigneeId: agent2.id,
    createdDaysAgo: 2,
    updatedHoursAgo: 3,
  })
  comments.push({
    id: randomUUID(),
    ticketId: t3.id,
    authorId: agent2.id,
    body: "Escalado al equipo de desarrollo. A la espera de un parche.",
    internal: true,
    createdAt: hoursAgo(3),
  })
  history.push({
    id: randomUUID(),
    ticketId: t3.id,
    actorId: agent2.id,
    type: "estado",
    from: "en_progreso",
    to: "en_espera",
    note: "Esperando corrección del equipo de desarrollo",
    createdAt: hoursAgo(3),
  })

  await mkTicket({
    title: "Solicito acceso al módulo de inventario",
    description: "Necesito permisos para consultar el inventario de la sucursal norte.",
    category: "Acceso y cuentas",
    channel: "whatsapp",
    priority: "baja",
    status: "resuelto",
    requesterId: client1.id,
    assigneeId: agent1.id,
    createdDaysAgo: 8,
    updatedHoursAgo: 60,
  })

  const t5 = await mkTicket({
    title: "Impresora de red no responde",
    description: "La impresora del piso 3 no aparece disponible para ningún equipo desde ayer.",
    category: "Hardware",
    channel: "telefono",
    priority: "media",
    status: "cerrado",
    requesterId: client2.id,
    assigneeId: agent2.id,
    createdDaysAgo: 12,
    updatedHoursAgo: 200,
    closed: true,
  })
  history.push({
    id: randomUUID(),
    ticketId: t5.id,
    actorId: agent2.id,
    type: "estado",
    from: "resuelto",
    to: "cerrado",
    note: "Reinicio del servidor de impresión resolvió el problema.",
    createdAt: hoursAgo(200),
  })

  await mkTicket({
    title: "Lentitud en la red de la oficina central",
    description: "Desde esta mañana la conexión a internet es intermitente en toda la planta baja.",
    category: "Redes",
    channel: "email",
    priority: "alta",
    status: "abierto",
    requesterId: client3.id,
    assigneeId: null,
    createdDaysAgo: 0,
    updatedHoursAgo: 2,
  })

  await mkTicket({
    title: "Consulta sobre horarios de soporte",
    description: "¿Cuál es el horario de atención del soporte técnico durante fines de semana?",
    category: "Solicitud de información",
    channel: "chat",
    priority: "baja",
    status: "resuelto",
    requesterId: client1.id,
    assigneeId: agent1.id,
    createdDaysAgo: 5,
    updatedHoursAgo: 90,
  })

  await mkTicket({
    title: "Error 500 al guardar cambios en el perfil",
    description: "Al actualizar mi número de teléfono el servidor devuelve un error 500.",
    category: "Errores de software",
    channel: "web",
    priority: "alta",
    status: "en_progreso",
    requesterId: client2.id,
    assigneeId: agent1.id,
    createdDaysAgo: 4,
    updatedHoursAgo: 12,
  })

  for (const t of tickets) {
    await sql`
      INSERT INTO tickets (id, code, title, description, category, channel, priority, status, requester_id, assignee_id, created_at, updated_at, closed_at)
      VALUES (${t.id}, ${t.code}, ${t.title}, ${t.description}, ${t.category}, ${t.channel}, ${t.priority}, ${t.status}, ${t.requesterId}, ${t.assigneeId}, ${t.createdAt}, ${t.updatedAt}, ${t.closedAt})
    `
  }
  console.log(`[seed] ${tickets.length} tickets insertados`)

  for (const c of comments) {
    await sql`
      INSERT INTO comments (id, ticket_id, author_id, body, internal, created_at)
      VALUES (${c.id}, ${c.ticketId}, ${c.authorId}, ${c.body}, ${c.internal}, ${c.createdAt})
    `
  }
  console.log(`[seed] ${comments.length} comentarios insertados`)

  for (const h of history) {
    await sql`
      INSERT INTO history (id, ticket_id, actor_id, type, "from", "to", note, created_at)
      VALUES (${h.id}, ${h.ticketId}, ${h.actorId}, ${h.type}, ${h.from}, ${h.to}, ${h.note}, ${h.createdAt})
    `
  }
  console.log(`[seed] ${history.length} eventos de historial insertados`)

  await sql`
    INSERT INTO counters (name, value) VALUES ('ticket', ${seq})
    ON CONFLICT (name) DO UPDATE SET value = ${seq}
  `
  console.log(`[seed] contador de tickets en ${seq}`)
  console.log("[seed] completado ✓")
}

main().catch((err) => {
  console.error("[seed] error:", err)
  process.exit(1)
})
