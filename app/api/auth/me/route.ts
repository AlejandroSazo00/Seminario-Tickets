import { getCurrentUser } from "@/lib/auth/session"
import { json } from "@/lib/api/respond"

export async function GET() {
  const user = await getCurrentUser()
  return json({ user })
}
