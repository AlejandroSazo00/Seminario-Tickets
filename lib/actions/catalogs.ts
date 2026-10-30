"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/session"
import {
  createCategory,
  updateCatalogEntry,
  type CatalogKind,
} from "@/lib/services/catalogs"

export type CatalogFormState = { error?: string; ok?: boolean } | undefined

export async function createCategoryAction(
  _previous: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  await requireRole("admin")
  try {
    await createCategory(String(formData.get("label") ?? ""))
    revalidateCatalogPages()
    return { ok: true }
  } catch (error) {
    return { error: catalogError(error) }
  }
}

export async function updateCatalogEntryAction(
  _previous: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  await requireRole("admin")
  const kind = String(formData.get("kind") ?? "") as CatalogKind
  const value = String(formData.get("value") ?? "")
  const label = String(formData.get("label") ?? "")
  const active = formData.get("active") === "on"
  if (!["status", "priority", "category", "channel"].includes(kind)) {
    return { error: "Tipo de catálogo inválido." }
  }

  try {
    await updateCatalogEntry(kind, value, label, active)
    revalidateCatalogPages()
    return { ok: true }
  } catch (error) {
    return { error: catalogError(error, label) }
  }
}

function revalidateCatalogPages() {
  revalidatePath("/panel/catalogos")
  revalidatePath("/panel/tickets")
  revalidatePath("/panel/tickets/nuevo")
  revalidatePath("/panel/reportes")
}

function catalogError(error: unknown, label?: string): string {
  if (!(error instanceof Error)) return "No se pudo guardar el catálogo."
  if ("code" in error && error.code === "23505") {
    return "Ya existe un valor con ese nombre en este catálogo."
  }
  if (error.message.startsWith("CATALOG_ENTRY_IN_USE:")) {
    const count = Number(error.message.slice("CATALOG_ENTRY_IN_USE:".length))
    if (Number.isSafeInteger(count) && count > 0) {
      const ticketText = count === 1 ? "1 ticket depende" : `${count} tickets dependen`
      return `No se puede archivar «${label ?? "este valor"}»: ${ticketText} de él.`
    }
    return "No se puede archivar este valor porque al menos un ticket depende de él."
  }
  switch (error.message) {
    case "INVALID_CATALOG_LABEL":
      return "El nombre es obligatorio y no debe exceder 80 caracteres."
    case "REQUIRED_CATALOG_ENTRY":
      return "Este valor es necesario para el funcionamiento del sistema y no se puede archivar."
    case "INVALID_CATALOG_ENTRY":
      return "El valor del catálogo no es válido."
    case "CATALOG_ENTRY_NOT_FOUND":
      return "El valor ya no existe. Actualiza la página e inténtalo de nuevo."
    case "CATALOG_LABEL_EXISTS":
      return "Ya existe un valor con ese nombre en este catálogo."
    case "CATALOG_SCHEMA_MISSING":
      return "No se puede guardar todavía: ejecuta la migración de catálogos en scripts/schema.sql."
    default:
      throw error
  }
}
