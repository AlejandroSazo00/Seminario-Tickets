/**
 * Endpoint POST para el cierre de sesión de usuarios.
 * Invoca la destrucción de la cookie o token de sesión activo 
 * en el servidor y retorna una confirmación de éxito.
 */

import { logout } from "@/lib/auth/session"
import { json } from "@/lib/api/respond"

export async function POST() {
  await logout()
  return json({ ok: true })
}
