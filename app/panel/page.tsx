import Link from "next/link"
import { Ticket as TicketIcon, AlertCircle, CheckCircle2, Inbox, ArrowRight, PlusCircle } from "lucide-react"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { listTickets, getReports } from "@/lib/services/tickets"
import { StatCard } from "@/components/panel/stat-card"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await requireUserOrRedirect()
  const [tickets, reports] = await Promise.all([listTickets(user), getReports(user)])
  const recent = tickets.slice(0, 6)
  const isClient = user.role === "cliente"

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Resumen</h2>
          <p className="text-sm text-muted-foreground">
            {isClient ? "Estado de tus solicitudes de soporte." : "Vista general de la mesa de ayuda."}
          </p>
        </div>
        <Button render={<Link href="/panel/tickets/nuevo" />}>
          <PlusCircle className="size-4" /> Nuevo ticket
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de tickets" value={reports.total} icon={TicketIcon} accent="primary" />
        <StatCard label="Abiertos" value={reports.abiertos} icon={Inbox} accent="chart-3" hint="Requieren atención" />
        {!isClient && (
          <StatCard label="Sin asignar" value={reports.sinAsignar} icon={AlertCircle} accent="destructive" />
        )}
        <StatCard
          label="Resueltos (7 días)"
          value={reports.resueltosUltimos7}
          icon={CheckCircle2}
          accent="chart-2"
        />
        {isClient && (
          <StatCard
            label="Tiempo prom. resolución"
            value={reports.tiempoPromedioResolucionHoras ? `${reports.tiempoPromedioResolucionHoras} h` : "—"}
            icon={CheckCircle2}
            accent="chart-2"
          />
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Actividad reciente</h3>
          <Link
            href="/panel/tickets"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="p-10 text-center">
            <Inbox className="mx-auto size-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">Aún no hay tickets</p>
            <p className="text-sm text-muted-foreground">Crea tu primer ticket para comenzar el seguimiento.</p>
            <Button className="mt-4" render={<Link href="/panel/tickets/nuevo" />}>
              <PlusCircle className="size-4" /> Crear ticket
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
