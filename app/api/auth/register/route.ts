/**
 * Endpoint POST para el registro de nuevos usuarios.
 * Valida la presencia de datos obligatorios (nombre, email y contraseña), 
 * procesa la creación de la cuenta en la base de datos y retorna el usuario creado con un estado 201 o un conflicto 409.
 */

import type { NextRequest } from "next/server"
import { register } from "@/lib/auth/session"
import { json, error } from "@/lib/api/respond"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.password) return error("Nombre, email y contraseña son obligatorios")
  const result = await register(body.name, body.email, body.password)
  if (!result.ok) return error(result.error, 409)
  return json({ user: result.user }, 201)
}
