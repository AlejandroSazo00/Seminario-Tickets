import test from "node:test"
import assert from "node:assert/strict"
import { getPasswordPolicyError } from "../../lib/security/password-policy.ts"

test("password policy accepts a long password with all required character classes", () => {
  assert.equal(getPasswordPolicyError("Correcta!Clave2026"), null)
  assert.equal(getPasswordPolicyError("ContraseñaSegura2026!"), null)
})

test("password policy requires at least 15 characters", () => {
  expectPasswordError("Abcdefg1!", /15 caracteres/)
})

test("password policy requires uppercase, lowercase, number, and special character", () => {
  expectPasswordError("abcdefghijklmn1!", /mayúscula/)
  expectPasswordError("ABCDEFGHIJKLMN1!", /minúscula/)
  expectPasswordError("Abcdefghijklmn!", /número/)
  expectPasswordError("Abcdefghijklmn1", /especial/)
})

test("password policy rejects whitespace", () => {
  expectPasswordError("Abcdefghijk 1!XY", /espacios/)
})

function expectPasswordError(password: string, expected: RegExp): void {
  const error = getPasswordPolicyError(password)
  assert.ok(error)
  assert.match(error, expected)
}
