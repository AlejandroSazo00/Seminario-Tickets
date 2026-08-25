import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import type { PublicUser } from "@/lib/types"

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Resuelve el usuario autenticado o devuelve una respuesta 401. */
export async function withAuth(): Promise<{ user: PublicUser } | { response: NextResponse }> {
  const user = await getCurrentUser()
  if (!user) return { response: error("No autenticado", 401) }
  return { user }
}
