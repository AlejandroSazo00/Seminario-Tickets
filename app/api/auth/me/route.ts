/**
 * Endpoint GET para la verificación de la sesión activa.
 * Consulta y retorna la información del usuario autenticado actualmente 
 * o un valor nulo en formato JSON si no hay sesión abierta.
 */

import { getCurrentUser } from "@/lib/auth/session"
import { json } from "@/lib/api/respond"

export async function GET() {
  const user = await getCurrentUser()
  return json({ user })
}
