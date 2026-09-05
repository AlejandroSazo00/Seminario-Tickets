import test from "node:test"
import assert from "node:assert/strict"
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
} from "../../lib/crypto.ts"

test("prueba de integración: credenciales válidas permiten generar y recuperar la sesión", () => {
  const user = {
    id: "cliente-integracion-001",
    password: "TicketSeguro2026!",
  }

  const credentials = hashPassword(user.password)
  const authenticated = verifyPassword(user.password, credentials.hash, credentials.salt)

  assert.equal(authenticated, true)

  const sessionToken = signSession(user.id)
  const authenticatedUserId = verifySession(sessionToken)

  assert.equal(authenticatedUserId, user.id)
})

test("prueba de integración: credenciales inválidas no deben iniciar el flujo de sesión", () => {
  const user = {
    id: "cliente-integracion-002",
    password: "ClaveValida2026!",
  }

  const credentials = hashPassword(user.password)
  const authenticated = verifyPassword("ClaveNoValida", credentials.hash, credentials.salt)

  assert.equal(authenticated, false)

  const sessionToken = authenticated ? signSession(user.id) : null
  assert.equal(sessionToken, null)
})
