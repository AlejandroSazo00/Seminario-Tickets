// Modelo de dominio del sistema de tickets de soporte (Mesa de Ayuda)

export type Role = "cliente" | "agente" | "admin"

export type Channel = "email" | "telefono" | "chat" | "web" | "whatsapp"

export type Priority = "baja" | "media" | "alta" | "urgente"

export type Status = "abierto" | "en_progreso" | "en_espera" | "resuelto" | "cerrado"

export type HistoryType =
  | "creado"
  | "estado"
  | "prioridad"
  | "asignacion"
  | "comentario"
  | "reabierto"
  | "categoria"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  // Credenciales (solo se exponen internamente, nunca al cliente)
  passwordHash: string
  salt: string
  active: boolean
  createdAt: string
}

/** Usuario seguro para enviar al cliente (sin credenciales). */
export type PublicUser = Omit<User, "passwordHash" | "salt">

export interface Ticket {
  id: string
  code: string // TCK-0001
  title: string
  description: string
  category: string
  channel: Channel
  priority: Priority
  status: Status
  requesterId: string // cliente que reporta
  assigneeId: string | null // agente asignado
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface Comment {
  id: string
  ticketId: string
  authorId: string
  body: string
  internal: boolean // nota interna visible solo para agentes/admin
  createdAt: string
}

export interface HistoryEvent {
  id: string
  ticketId: string
  actorId: string
  type: HistoryType
  from: string | null
  to: string | null
  note: string | null
  createdAt: string
}

// Etiquetas legibles para la interfaz

export const PRIORITY_LABEL: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
}

export const STATUS_LABEL: Record<Status, string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Correo",
  telefono: "Teléfono",
  chat: "Chat en vivo",
  web: "Portal web",
  whatsapp: "WhatsApp",
}

export const ROLE_LABEL: Record<Role, string> = {
  cliente: "Cliente",
  agente: "Agente",
  admin: "Administrador",
}

export const ROLES: Role[] = ["cliente", "agente", "admin"]

export const PRIORITIES: Priority[] = ["baja", "media", "alta", "urgente"]
export const STATUSES: Status[] = ["abierto", "en_progreso", "en_espera", "resuelto", "cerrado"]
export const CHANNELS: Channel[] = ["email", "telefono", "chat", "web", "whatsapp"]

/** Orden de peso para ordenar por prioridad (mayor = más urgente). */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  baja: 1,
  media: 2,
  alta: 3,
  urgente: 4,
}

export const CATEGORIES = [
  "Acceso y cuentas",
  "Facturación",
  "Errores de software",
  "Hardware",
  "Redes",
  "Solicitud de información",
  "Otro",
]
