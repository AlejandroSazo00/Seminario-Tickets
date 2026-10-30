"use client"

import { useActionState } from "react"
import { Archive, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/field"
import {
  createCategoryAction,
  updateCatalogEntryAction,
  type CatalogFormState,
} from "@/lib/actions/catalogs"
import type { CatalogEntry } from "@/lib/services/catalogs"

const GROUPS = [
  { kind: "status", title: "Estados de tickets", description: "Se pueden renombrar o archivar." },
  { kind: "priority", title: "Prioridades", description: "Se pueden renombrar o archivar." },
  { kind: "category", title: "Categorías", description: "Puedes agregar, renombrar o archivar categorías." },
  { kind: "channel", title: "Canales de origen", description: "Se pueden renombrar o archivar." },
] as const

export function CatalogManager({
  entries,
  schemaReady,
}: {
  entries: CatalogEntry[]
  schemaReady: boolean
}) {
  const [createState, createAction, createPending] = useActionState<CatalogFormState, FormData>(
    createCategoryAction,
    undefined,
  )

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Catálogos</h2>
        <p className="text-sm text-muted-foreground">
          Administra las opciones que se utilizan al crear y gestionar tickets.
        </p>
      </header>

      {!schemaReady && (
        <Card role="alert" className="border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Los catálogos están en modo de compatibilidad de solo lectura porque falta crear la tabla
          {" "}ticket_catalogs. Ejecuta la sección de catálogos de scripts/schema.sql para habilitar su
          administración.
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-semibold">Agregar categoría</h3>
        <form action={createAction} className="mt-3 flex flex-wrap gap-2">
          <Input name="label" required maxLength={80} placeholder="Nombre de la categoría" className="min-w-60 flex-1" disabled={!schemaReady} />
          <Button type="submit" disabled={!schemaReady || createPending}>
            <Plus className="size-4" /> Agregar
          </Button>
        </form>
        {createState?.error && <p role="alert" className="mt-2 text-sm text-destructive">{createState.error}</p>}
      </Card>

      {GROUPS.map((group) => (
        <section key={group.kind} className="space-y-3">
          <div>
            <h3 className="font-semibold">{group.title}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-3">
            {entries
              .filter((entry) => entry.kind === group.kind)
              .map((entry) => (
                <CatalogRow
                  key={`${entry.kind}:${entry.value}`}
                  entry={entry}
                  schemaReady={schemaReady}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function CatalogRow({ entry, schemaReady }: { entry: CatalogEntry; schemaReady: boolean }) {
  const [state, action, pending] = useActionState<CatalogFormState, FormData>(
    updateCatalogEntryAction,
    undefined,
  )

  return (
    <Card className="p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="kind" value={entry.kind} />
        <input type="hidden" name="value" value={entry.value} />
        <label className="min-w-52 flex-1 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Nombre visible</span>
          <Input name="label" defaultValue={entry.label} required maxLength={80} disabled={!schemaReady} />
        </label>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={entry.active} disabled={!schemaReady} />
          {entry.active ? "Activo" : "Archivado"}
        </label>
        <Button type="submit" variant={entry.active ? "outline" : "default"} disabled={!schemaReady || pending}>
          {entry.active ? <Archive className="size-4" /> : <Check className="size-4" />}
          {entry.active ? "Guardar / archivar" : "Guardar / activar"}
        </Button>
        {state?.error && (
          <p role="alert" className="basis-full text-sm text-destructive">{state.error}</p>
        )}
        {state?.ok && <p className="basis-full text-sm text-emerald-600">Catálogo actualizado.</p>}
      </form>
    </Card>
  )
}
