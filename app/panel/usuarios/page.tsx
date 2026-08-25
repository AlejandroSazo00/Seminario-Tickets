import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { listUsers, userTicketCount } from "@/lib/services/users"
import { UsersManager } from "@/components/users/users-manager"

export const metadata = { title: "Usuarios · MesaViva" }

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/ingresar")
  if (user.role !== "admin") redirect("/panel")

  const base = await listUsers()
  const users = await Promise.all(
    base.map(async (u) => ({ ...u, ticketCount: await userTicketCount(u.id) })),
  )

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <UsersManager users={users} currentUserId={user.id} />
    </div>
  )
}
