import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AssignedTicketFilter({ mine }: { mine: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtrar tickets recientes">
      <Button
        variant={mine ? "outline" : "default"}
        size="sm"
        render={<Link href="/panel" />}
      >
        Todos
      </Button>
      <Button
        variant={mine ? "default" : "outline"}
        size="sm"
        render={<Link href="/panel?assigned=mine" />}
      >
        Mis tickets
      </Button>
    </div>
  )
}
