import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { listUsers } from "@/lib/services/users"
import { NewTicketForm } from "@/components/tickets/new-ticket-form"
import { Card } from "@/components/ui/card"

export default async function NewTicketPage() {
  const user = await requireUserOrRedirect()
  const canManage = user.role === "agente" || user.role === "admin"
  const clients = canManage ? (await listUsers()).filter((u) => u.role === "cliente") : []

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/panel/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a tickets
      </Link>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Nuevo ticket</h2>
        <p className="text-sm text-muted-foreground">Registra una nueva incidencia o solicitud de soporte.</p>
      </div>
      <Card className="p-6">
        <NewTicketForm canManage={canManage} clients={clients} />
      </Card>
    </div>
  )
}
