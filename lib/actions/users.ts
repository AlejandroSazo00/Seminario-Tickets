"use server"

import { revalidatePath } from "next/cache"
import { requireRole, getCurrentUser } from "@/lib/auth/session"
import {
  createUser,
  updateUser,
  setUserActive,
  emailExists,
  getUserById,
} from "@/lib/services/users"
import { ROLES, type Role } from "@/lib/types"

export type UserFormState = { error?: string; ok?: boolean } | undefined

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireRole("admin")
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "cliente") as Role

  if (!name || !email) return { error: "Nombre y correo son obligatorios." }
  if (!validEmail(email)) return { error: "El correo no tiene un formato válido." }
  if (!ROLES.includes(role)) return { error: "Rol no válido." }
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." }
  if (await emailExists(email)) return { error: "Ya existe una cuenta con ese correo." }

  await createUser({ name, email, password, role })
  revalidatePath("/panel/usuarios")
  return { ok: true }
}

export async function updateUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireRole("admin")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "cliente") as Role

  const target = await getUserById(id)
  if (!target) return { error: "Usuario no encontrado." }
  if (!name || !email) return { error: "Nombre y correo son obligatorios." }
  if (!validEmail(email)) return { error: "El correo no tiene un formato válido." }
  if (!ROLES.includes(role)) return { error: "Rol no válido." }
  if (password.length > 0 && password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." }
  }
  if (await emailExists(email, id)) return { error: "Otro usuario ya usa ese correo." }

  await updateUser(id, { name, email, role, password: password || undefined })
  revalidatePath("/panel/usuarios")
  return { ok: true }
}

export async function toggleUserActiveAction(id: string, active: boolean): Promise<void> {
  const admin = await requireRole("admin")
  if (id === admin.id && !active) {
    // Un administrador no puede desactivarse a sí mismo
    throw new Error("SELF_DEACTIVATION")
  }
  await setUserActive(id, active)
  revalidatePath("/panel/usuarios")
}

export async function currentUserId(): Promise<string | null> {
  const u = await getCurrentUser()
  return u?.id ?? null
}
