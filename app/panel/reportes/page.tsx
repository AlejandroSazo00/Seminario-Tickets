import { redirect } from "next/navigation"
import { Ticket as TicketIcon, Inbox, AlertCircle, Timer } from "lucide-react"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { getReports } from "@/lib/services/tickets"
import { StatCard } from "@/components/panel/stat-card"
import { Card } from "@/components/ui/card"
import { StatusPie, PriorityBars, TrendLine, ChannelBars } from "@/components/reports/charts"

export default async function ReportsPage() {
  const user = await requireUserOrRedirect()
  if (user.role === "cliente") redirect("/panel")

  const r = await getReports(user)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Reportes</h2>
        <p className="text-sm text-muted-foreground">Indicadores y métricas de la mesa de ayuda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de tickets" value={r.total} icon={TicketIcon} accent="primary" />
        <StatCard label="Abiertos" value={r.abiertos} icon={Inbox} accent="chart-3" />
        <StatCard label="Sin asignar" value={r.sinAsignar} icon={AlertCircle} accent="destructive" />
        <StatCard
          label="Tiempo prom. resolución"
          value={r.tiempoPromedioResolucionHoras ? `${r.tiempoPromedioResolucionHoras} h` : "—"}
          icon={Timer}
          accent="chart-2"
        />
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Tendencia de los últimos 7 días</h3>
        <TrendLine data={r.tendencia} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Tickets por estado</h3>
          <StatusPie data={r.porEstado} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Tickets por prioridad</h3>
          <PriorityBars data={r.porPrioridad} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Tickets por canal</h3>
          <ChannelBars data={r.porCanal} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Carga por agente</h3>
          {r.porAgente.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sin datos de agentes todavía.</p>
          ) : (
            <div className="space-y-3">
              {r.porAgente.map((a) => {
                const total = a.activos + a.resueltos
                const pct = total > 0 ? Math.round((a.resueltos / total) * 100) : 0
                return (
                  <div key={a.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-muted-foreground">
                        {a.activos} activos · {a.resueltos} resueltos
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-chart-2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
