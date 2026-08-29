/**
 * Endpoint POST para autenticación de usuarios.
 * Valida la existencia de credenciales (email/password), ejecuta la verificación 
 * contra la base de datos y retorna la sesión activa o un error 401.
 */

import type { NextRequest } from "next/server"
import { login } from "@/lib/auth/session"
import { json, error } from "@/lib/api/respond"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) return error("Email y contraseña son obligatorios")
  const result = await login(body.email, body.password)
  if (!result.ok) return error(result.error, 401)
  return json({ user: result.user })
}
