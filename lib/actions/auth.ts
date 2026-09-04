"use server"

/** Server Action: se ejecuta únicamente en el servidor (backend), 
 *  nunca en el cliente.
 */

import { redirect } from "next/navigation"
import { login, register, logout } from "@/lib/auth/session"


/** Tipo de retorno de las acciones: error de validación/auth, 
 *  o undefined si hubo redirect.
 */
export type ActionState = { error?: string } | undefined

/**
 * Procesa el login: extrae credenciales del form y las valida contra la sesión.
 */
export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "") // dato recibido del formulario
  const password = String(formData.get("password") ?? "")
  const result = await login(email, password) // delega autenticación real a session.ts
  if (!result.ok) return { error: result.error } // credenciales inválidas, retorna error
  redirect("/panel") // login exitoso → redirige al dashboard
}


/**
 * Procesa el registro: crea un nuevo usuario con los datos del formulario.
 */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "")
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const result = await register(name, email, password) // delega creación de usuario a session.ts
  if (!result.ok) return { error: result.error } // registro fallido
  redirect("/panel")  // registro exitoso redirige al dashboard
}


/**
 * Cierra la sesión activa y redirige al usuario a la pantalla de login.
 */
export async function logoutAction(): Promise<void> {
  await logout() // invalida la sesión actual
  redirect("/ingresar") // redirige a la pantalla de inicio de sesión
}
