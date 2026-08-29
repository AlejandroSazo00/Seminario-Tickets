import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Definición de Props para el componente de métricas
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  hint?: string
  accent?: "primary" | "chart-2" | "chart-3" | "chart-4" | "destructive"
}

// UI Mapping: Diccionario de estilos para acentos de color en contenedores de iconos
// Utiliza opacidad (/12, /15) sobre tokens dinámicos para mantener un contraste accesible en Light/Dark Mode
const ACCENT: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  destructive: "bg-destructive/12 text-destructive",
}

/**
 * COMPONENTE STATCARD (Métrica / KPI Individual)
 * Utilizado en el Resumen/Dashboard para proyectar datos clave (ej. total de tickets, resueltos, tiempo medio).
 */
export function StatCard({ label, value, icon: Icon, hint, accent = "primary" }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4 p-5">
      {/* Contenedor del Icono: Acento visual adaptativo */}
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", ACCENT[accent])}>
        <Icon className="size-5.5" />
      </div>

      {/* Bloque de Información: Jerarquía visual de lectura rápida */}
      <div className="min-w-0">
        {/* Etiqueta / Métrica */}
        <p className="text-sm text-muted-foreground">{label}</p>
        
        {/* Valor Principal (Data Point) */}
        <p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
        
        {/* Texto de Apoyo / Tendencia (Opcional) */}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}