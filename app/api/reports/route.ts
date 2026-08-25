import { withAuth, json } from "@/lib/api/respond"
import { getReports } from "@/lib/services/tickets"

export async function GET() {
  const auth = await withAuth()
  if ("response" in auth) return auth.response
  const report = await getReports(auth.user)
  return json(report)
}
