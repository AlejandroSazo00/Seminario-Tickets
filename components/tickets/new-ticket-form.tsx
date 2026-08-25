"use client"

import { useActionState } from "react"
import { AlertCircle } from "lucide-react"
import { createTicketAction, type FormState } from "@/lib/actions/tickets"
import { Field, Label, Input, Textarea, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import {
  CATEGORIES,
  CHANNELS,
  PRIORITIES,
  CHANNEL_LABEL,
  PRIORITY_LABEL,
  type PublicUser,
} from "@/lib/types"

interface Props {
  canManage: boolean
  clients: PublicUser[]
}

export function NewTicketForm({ canManage, clients }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTicketAction, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Field>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required placeholder="Resumen breve del problema" maxLength={120} />
      </Field>

      <Field>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="Describe con detalle qué ocurre, pasos para reproducirlo, mensajes de error…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="category">Categoría</Label>
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="priority">Prioridad</Label>
          <Select id="priority" name="priority" defaultValue="media">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="channel">Canal de origen</Label>
          <Select id="channel" name="channel" defaultValue="web">
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>

        {canManage && (
          <Field>
            <Label htmlFor="requesterId">Solicitante</Label>
            <Select id="requesterId" name="requesterId" defaultValue="">
              <option value="">Yo mismo</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creando…" : "Crear ticket"}
        </Button>
      </div>
    </form>
  )
}
