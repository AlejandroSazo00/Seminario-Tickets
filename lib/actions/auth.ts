"use server"

import { redirect } from "next/navigation"
import { login, register, logout } from "@/lib/auth/session"

export type ActionState = { error?: string } | undefined

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const result = await login(email, password)
  if (!result.ok) return { error: result.error }
  redirect("/panel")
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "")
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const result = await register(name, email, password)
  if (!result.ok) return { error: result.error }
  redirect("/panel")
}

export async function logoutAction(): Promise<void> {
  await logout()
  redirect("/ingresar")
}
