"use client"

import * as React from "react"
import { useActionState } from "react"
import { UserPlus, Pencil, ShieldCheck, ShieldOff, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, Label, Input, Select } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { ROLE_LABEL, ROLES, type PublicUser } from "@/lib/types"
import {
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  type UserFormState,
} from "@/lib/actions/users"

interface UserRow extends PublicUser {
  ticketCount: number
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  agente: "bg-chart-2/15 text-chart-2",
  cliente: "bg-secondary text-secondary-foreground",
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const [editing, setEditing] = React.useState<UserRow | null>(null)
  const [creating, setCreating] = React.useState(false)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "usuario" : "usuarios"} en el sistema
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="size-4" /> Nuevo usuario
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.name}
                          {u.id === currentUserId && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        ROLE_BADGE[u.role],
                      )}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{u.ticketCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        u.active ? "text-chart-2" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          u.active ? "bg-chart-2" : "bg-muted-foreground/50",
                        )}
                      />
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${u.name}`}
                        onClick={() => setEditing(u)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ActiveToggle user={u} disabled={u.id === currentUserId} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {creating && (
        <UserDialog title="Nuevo usuario" onClose={() => setCreating(false)} action={createUserAction} />
      )}
      {editing && (
        <UserDialog
          title="Editar usuario"
          user={editing}
          onClose={() => setEditing(null)}
          action={updateUserAction}
        />
      )}
    </>
  )
}

function ActiveToggle({ user, disabled }: { user: UserRow; disabled: boolean }) {
  const [pending, startTransition] = React.useTransition()

  function toggle() {
    startTransition(async () => {
      try {
        await toggleUserActiveAction(user.id, !user.active)
      } catch {
        /* la revalidación devuelve el estado real */
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={disabled || pending}
      aria-label={user.active ? `Desactivar ${user.name}` : `Activar ${user.name}`}
      title={disabled ? "No puedes desactivar tu propia cuenta" : undefined}
      onClick={toggle}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : user.active ? (
        <ShieldOff className="size-4 text-destructive" />
      ) : (
        <ShieldCheck className="size-4 text-chart-2" />
      )}
    </Button>
  )
}

function UserDialog({
  title,
  user,
  onClose,
  action,
}: {
  title: string
  user?: UserRow
  onClose: () => void
  action: (prev: UserFormState, formData: FormData) => Promise<UserFormState>
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, undefined)

  React.useEffect(() => {
    if (state?.ok) onClose()
  }, [state, onClose])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form action={formAction} className="space-y-4">
          {user && <input type="hidden" name="id" value={user.id} />}

          <Field>
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" defaultValue={user?.name} required autoComplete="off" />
          </Field>

          <Field>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email}
              required
              autoComplete="off"
            />
          </Field>

          <Field>
            <Label htmlFor="role">Rol</Label>
            <Select id="role" name="role" defaultValue={user?.role ?? "cliente"}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="password">
              {user ? "Nueva contraseña" : "Contraseña"}
              {user && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={user ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
              autoComplete="new-password"
            />
          </Field>

          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {user ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}
