"use server"
/** Server Action: se ejecuta únicamente en el servidor (backend), 
 *  nunca en el cliente.
 */

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/session"
import {
  createTicket,
  updateStatus,
  updatePriority,
  assignTicket,
  addComment,
} from "@/lib/services/tickets"
import type { Channel, Priority, Status } from "@/lib/types"


/** Tipo de retorno de las acciones de formulario: error de validación,
 *  bandera de éxito (ok), o undefined si hubo redirect.
 */
export type FormState = { error?: string; ok?: boolean } | undefined


/**
 * Crea un nuevo ticket a partir de los datos del formulario.
 */
export async function createTicketAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim()
  const channel = String(formData.get("channel") ?? "web") as Channel
  const priority = String(formData.get("priority") ?? "media") as Priority
  const requesterId = formData.get("requesterId") ? String(formData.get("requesterId")) : undefined

  if (!title || !description || !category) {
    return { error: "Completa título, descripción y categoría." }
  }

  let ticket
  try {
    ticket = await createTicket(user, { title, description, category, channel, priority, requesterId })
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CATEGORY") {
      return { error: "La categoría seleccionada está archivada o ya no existe." }
    }
    if (error instanceof Error && error.message === "INVALID_CATALOG_PRIORITY") {
      return { error: "La prioridad seleccionada está archivada o ya no existe." }
    }
    if (error instanceof Error && error.message === "INVALID_CATALOG_CHANNEL") {
      return { error: "El canal seleccionado está archivado o ya no existe." }
    }
    throw error
  }
  revalidatePath("/panel/tickets") // fuerza a Next.js a refrescar el caché de estas rutas
  revalidatePath("/panel")
  redirect(`/panel/tickets/${ticket.code}`) // redirige al detalle del ticket recién creado
}


/**
 * Actualiza el estado (status) de un ticket existente.
 */
export async function updateStatusAction(id: string, status: Status, note?: string): Promise<void> {
  const user = await requireUser()
  try {
    await updateStatus(user, id, status, note)
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Solo el administrador o el agente asignado puede cambiar el estado.")
    }
    throw error
  }
  revalidatePath(`/panel/tickets/${id}`) // refresca el detalle del ticket
  revalidatePath("/panel/tickets") // refresca el listado
  revalidatePath("/panel") // refresca el dashboard
  revalidatePath("/panel/reportes")
}


/**
 * Actualiza la prioridad de un ticket existente.
 */
export async function updatePriorityAction(id: string, priority: Priority): Promise<void> {
  const user = await requireUser()
  try {
    await updatePriority(user, id, priority)
  } catch (error) {
    if (error instanceof Error && error.message === "PRIORITY_LOCKED") {
      throw new Error("La prioridad no se puede cambiar después de la primera asignación.")
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Solo el administrador o el agente asignado puede cambiar el ticket.")
    }
    throw error
  }
  revalidatePath(`/panel/tickets/${id}`)
  revalidatePath("/panel/tickets")
}


/**
 * Asigna (o desasigna, si assigneeId es null) un ticket a un usuario.
 */
export async function assignTicketAction(
  id: string,
  assigneeId: string | null,
  overrideActiveTimer = false,
): Promise<void> {
  const user = await requireUser()
  try {
    await assignTicket(user, id, assigneeId, overrideActiveTimer)
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Solo un administrador puede asignar o reasignar tickets.")
    }
    if (error instanceof Error && error.message === "ACTIVE_TIMER") {
      throw new Error("Hay un cronómetro activo. Actualiza la página y confirma la reasignación como administrador.")
    }
    if (error instanceof Error && error.message === "INVALID_ASSIGNEE") {
      throw new Error("Selecciona un agente activo válido.")
    }
    throw error
  }
  revalidatePath(`/panel/tickets/${id}`)
  revalidatePath("/panel/tickets")
  revalidatePath("/panel/reportes")
}

/**
 * Agrega un comentario a un ticket. Puede marcarse como interno (visible solo para el equipo).
 */
export async function addCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const id = String(formData.get("ticketId") ?? "")
  const body = String(formData.get("body") ?? "").trim()
  const internal = formData.get("internal") === "on"
  if (!body) return { error: "El comentario no puede estar vacío." }
  try {
    await addComment(user, id, body, internal)
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Solo puedes comentar tickets asignados a ti." }
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "Ticket no encontrado." }
    }
    throw error
  }
  revalidatePath(`/panel/tickets/${id}`)  // refresca el detalle del ticket con el nuevo comentario
  return { ok: true }
}
