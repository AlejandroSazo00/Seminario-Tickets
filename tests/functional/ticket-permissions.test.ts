import test from "node:test"
import assert from "node:assert/strict"
import { canAssignTicket, canCommentOnTicket, canManageTicket } from "../../lib/tickets/permissions.ts"
import type { PublicUser, Ticket } from "../../lib/types.ts"

const agent: PublicUser = {
  id: "agent-1",
  name: "Agente Uno",
  email: "agent@example.test",
  role: "agente",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const admin: PublicUser = { ...agent, id: "admin-1", role: "admin" }
const client: PublicUser = { ...agent, id: "client-1", role: "cliente" }

const ticket: Ticket = {
  id: "ticket-1",
  code: "TCK-0001",
  title: "Ticket de prueba",
  description: "Validación de permisos",
  category: "Otro",
  channel: "web",
  priority: "media",
  status: "en_progreso",
  requesterId: client.id,
  assigneeId: agent.id,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  closedAt: null,
}

test("solo el admin puede asignar o reasignar tickets", () => {
  assert.equal(canAssignTicket(admin), true)
  assert.equal(canAssignTicket(agent), false)
  assert.equal(canAssignTicket(client), false)
})

test("un agente solo puede modificar y comentar tickets asignados a él", () => {
  const otherAgent = { ...agent, id: "agent-2" }
  const unassignedTicket = { ...ticket, assigneeId: null }

  assert.equal(canManageTicket(agent, ticket), true)
  assert.equal(canCommentOnTicket(agent, ticket), true)
  assert.equal(canManageTicket(agent, unassignedTicket), false)
  assert.equal(canCommentOnTicket(agent, unassignedTicket), false)
  assert.equal(canManageTicket(otherAgent, ticket), false)
  assert.equal(canCommentOnTicket(otherAgent, ticket), false)
  assert.equal(canManageTicket(admin, ticket), true)
})

test("los clientes solo pueden comentar sus propios tickets", () => {
  assert.equal(canCommentOnTicket(client, ticket), true)
  assert.equal(canCommentOnTicket({ ...client, id: "client-2" }, ticket), false)
})
