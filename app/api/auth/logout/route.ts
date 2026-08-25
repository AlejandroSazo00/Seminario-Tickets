import { logout } from "@/lib/auth/session"
import { json } from "@/lib/api/respond"

export async function POST() {
  await logout()
  return json({ ok: true })
}
