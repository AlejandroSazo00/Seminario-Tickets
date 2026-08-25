import "server-only"
import { sql, rowToUser, randomUUID } from "@/lib/db/sql"
import { hashPassword } from "@/lib/crypto"
import type { PublicUser, Role, User } from "@/lib/types"

function toPublic(u: User): PublicUser {
  const { passwordHash, salt, ...rest } = u
  return rest
}

export async function getUserById(id: string | null): Promise<PublicUser | null> {
  if (!id) return null
  const rows = (await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`) as Record<string, unknown>[]
  return rows[0] ? toPublic(rowToUser(rows[0])) : null
}

export async function listAgents(): Promise<PublicUser[]> {
  const rows = (await sql`
    SELECT * FROM users
    WHERE role IN ('agente', 'admin') AND active = true
    ORDER BY name ASC
  `) as Record<string, unknown>[]
  return rows.map((r) => toPublic(rowToUser(r)))
}

export async function listUsers(role?: Role): Promise<PublicUser[]> {
  const rows = (
    role
      ? await sql`SELECT * FROM users WHERE role = ${role} ORDER BY created_at DESC`
      : await sql`SELECT * FROM users ORDER BY created_at DESC`
  ) as Record<string, unknown>[]
  return rows.map((r) => toPublic(rowToUser(r)))
}

/** Índice id -> usuario público, útil para enriquecer listados. */
export async function userMap(): Promise<Map<string, PublicUser>> {
  const rows = (await sql`SELECT * FROM users`) as Record<string, unknown>[]
  return new Map(rows.map((r) => [r.id as string, toPublic(rowToUser(r))]))
}

// ------- Gestión de usuarios (administración) -------

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
}

export async function emailExists(email: string, exceptId?: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const rows = (
    exceptId
      ? await sql`SELECT 1 FROM users WHERE lower(email) = ${normalized} AND id <> ${exceptId} LIMIT 1`
      : await sql`SELECT 1 FROM users WHERE lower(email) = ${normalized} LIMIT 1`
  ) as Record<string, unknown>[]
  return rows.length > 0
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const { hash, salt } = hashPassword(input.password)
  const id = randomUUID()
  const rows = (await sql`
    INSERT INTO users (id, name, email, role, password_hash, salt, active)
    VALUES (${id}, ${input.name.trim()}, ${input.email.trim().toLowerCase()}, ${input.role}, ${hash}, ${salt}, true)
    RETURNING *
  `) as Record<string, unknown>[]
  return toPublic(rowToUser(rows[0]))
}

export interface UpdateUserInput {
  name: string
  email: string
  role: Role
  password?: string
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
  if (input.password && input.password.length > 0) {
    const { hash, salt } = hashPassword(input.password)
    const rows = (await sql`
      UPDATE users
      SET name = ${input.name.trim()},
          email = ${input.email.trim().toLowerCase()},
          role = ${input.role},
          password_hash = ${hash},
          salt = ${salt}
      WHERE id = ${id}
      RETURNING *
    `) as Record<string, unknown>[]
    return toPublic(rowToUser(rows[0]))
  }
  const rows = (await sql`
    UPDATE users
    SET name = ${input.name.trim()},
        email = ${input.email.trim().toLowerCase()},
        role = ${input.role}
    WHERE id = ${id}
    RETURNING *
  `) as Record<string, unknown>[]
  return toPublic(rowToUser(rows[0]))
}

export async function setUserActive(id: string, active: boolean): Promise<PublicUser> {
  const rows = (await sql`
    UPDATE users SET active = ${active} WHERE id = ${id} RETURNING *
  `) as Record<string, unknown>[]
  return toPublic(rowToUser(rows[0]))
}

/** Número de tickets donde el usuario es solicitante o responsable. */
export async function userTicketCount(id: string): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int AS n FROM tickets
    WHERE requester_id = ${id} OR assignee_id = ${id}
  `) as Record<string, unknown>[]
  return Number(rows[0]?.n ?? 0)
}
