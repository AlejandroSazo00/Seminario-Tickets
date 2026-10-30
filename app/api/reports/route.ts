import { withAuth, json, error } from "@/lib/api/respond"
import { getReports } from "@/lib/services/tickets"

export async function GET() {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  if (auth.user.role !== "admin") return error("Solo los administradores pueden consultar reportes", 403)
  const report = await getReports(auth.user)
  return json(report)
}
