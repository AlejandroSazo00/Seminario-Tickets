import { FileText, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mermaid } from "@/components/docs/mermaid"
import { DIAGRAMS } from "@/lib/docs/diagrams"

const DOCS = [
  { file: "documento-tecnico", title: "Documento técnico", desc: "Alcance, requerimientos, decisiones de diseño y modelo de datos." },
  { file: "arquitectura", title: "Documento de arquitectura", desc: "Capas, componentes, patrones y stack tecnológico." },
  { file: "api-rest", title: "Especificación API REST", desc: "Endpoints, métodos, parámetros y códigos de respuesta." },
  { file: "manual-usuario", title: "Manual de usuario", desc: "Guía paso a paso para clientes, agentes y administradores." },
  { file: "manual-tecnico", title: "Manual técnico / instalación", desc: "Requisitos, despliegue y conexión a base de datos." },
]

export default function DocumentacionPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Documentación del proyecto</h2>
        <p className="text-sm text-muted-foreground">
          Diagramas UML, modelo entidad-relación y entregables descargables en formato Word (.docx).
        </p>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Download className="size-4 text-primary" /> Entregables (.docx)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS.map((d) => (
            <Card key={d.file} className="flex items-start gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{d.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{d.desc}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  render={<a href={`/api/docs/${d.file}`} />}
                >
                  <Download className="size-3.5" /> Descargar .docx
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <Card className="mt-3 flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <div>
            <p className="font-medium">Descargar todo</p>
            <p className="text-xs text-muted-foreground">Todos los documentos técnicos en un solo paquete.</p>
          </div>
          <Button render={<a href="/api/docs/todos" />}>
            <Download className="size-4" /> Paquete completo
          </Button>
        </Card>
      </section>

      <section className="space-y-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <FileText className="size-4 text-primary" /> Diagramas
        </h3>
        {DIAGRAMS.map((d) => (
          <Card key={d.slug} className="p-6">
            <h4 className="font-semibold">{d.title}</h4>
            <p className="mb-4 text-sm text-muted-foreground">{d.description}</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <Mermaid chart={d.chart} />
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
