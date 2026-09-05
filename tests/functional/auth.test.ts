import test from "node:test"
import assert from "node:assert/strict"
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
} from "../../lib/crypto.ts"

test("prueba funcional: acepta la contraseña correcta y rechaza una incorrecta", () => {
  const password = "Soporte2026!"
  const { hash, salt } = hashPassword(password)

  assert.equal(verifyPassword(password, hash, salt), true)
  assert.equal(verifyPassword("ClaveIncorrecta", hash, salt), false)
})

test("prueba funcional: crea y valida una sesión firmada", () => {
  const userId = "usuario-prueba-001"
  const token = signSession(userId)

  assert.equal(verifySession(token), userId)
})

test("prueba funcional: rechaza una sesión manipulada", () => {
  const token = signSession("usuario-prueba-002")
  const [payload, signature] = token.split(".")
  const last = signature.at(-1)
  const replacement = last === "a" ? "b" : "a"
  const tampered = `${payload}.${signature.slice(0, -1)}${replacement}`

  assert.equal(verifySession(tampered), null)
})
