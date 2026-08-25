import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  hint?: string
  accent?: "primary" | "chart-2" | "chart-3" | "chart-4" | "destructive"
}

const ACCENT: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  destructive: "bg-destructive/12 text-destructive",
}

export function StatCard({ label, value, icon: Icon, hint, accent = "primary" }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", ACCENT[accent])}>
        <Icon className="size-5.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}
