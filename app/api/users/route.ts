import type { NextRequest } from "next/server"
import { withAuth, json } from "@/lib/api/respond"
import { listAgents, listUsers } from "@/lib/services/users"
import type { Role } from "@/lib/types"

export async function GET(req: NextRequest) {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const role = req.nextUrl.searchParams.get("role") as Role | null
  // Solo agentes/admin pueden listar todos los usuarios
  if (auth.user.role === "cliente") return json({ users: [] })
  const users = role === "agente" ? await listAgents() : await listUsers(role ?? undefined)
  return json({ users })
}
