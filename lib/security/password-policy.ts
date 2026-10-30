export const PASSWORD_MIN_LENGTH = 15

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }
  if (!/\p{Ll}/u.test(password)) return "La contraseña debe incluir al menos una letra minúscula."
  if (!/\p{Lu}/u.test(password)) return "La contraseña debe incluir al menos una letra mayúscula."
  if (!/\p{N}/u.test(password)) return "La contraseña debe incluir al menos un número."
  if (!/[\p{P}\p{S}]/u.test(password)) {
    return "La contraseña debe incluir al menos un carácter especial."
  }
  if (/\s/.test(password)) return "La contraseña no puede contener espacios."
  return null
}
