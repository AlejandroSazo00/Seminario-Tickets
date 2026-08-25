"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock, Send } from "lucide-react"
import { addCommentAction, type FormState } from "@/lib/actions/tickets"
import { Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"
import type { CommentView } from "@/lib/services/tickets"

interface Props {
  ticketId: string
  comments: CommentView[]
  canManage: boolean
  currentUserId: string
}

export function CommentThread({ ticketId, comments, canManage, currentUserId }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(addCommentAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Conversación</h3>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Aún no hay comentarios. Sé el primero en responder.
          </p>
        )}
        {comments.map((c) => {
          const mine = c.authorId === currentUserId
          const initials = (c.author?.name ?? "?")
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
          return (
            <div key={c.id} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials}
              </span>
              <div
                className={`min-w-0 flex-1 rounded-xl border p-3 ${
                  c.internal
                    ? "border-chart-3/40 bg-chart-3/10"
                    : mine
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">{c.author?.name ?? "Usuario"}</span>
                  {c.internal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/20 px-1.5 py-0.5 font-medium text-chart-3">
                      <Lock className="size-3" /> Nota interna
                    </span>
                  )}
                  <span className="ml-auto text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      <form ref={formRef} action={action} className="space-y-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <Textarea name="body" rows={3} required placeholder="Escribe una respuesta…" />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <div className="flex items-center justify-between gap-3">
          {canManage ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="internal" className="size-4 rounded border-input accent-[var(--chart-3)]" />
              Nota interna (no visible para el cliente)
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={pending}>
            <Send className="size-4" />
            {pending ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
