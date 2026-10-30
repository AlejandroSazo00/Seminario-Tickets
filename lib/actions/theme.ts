"use server"

import { cookies } from "next/headers"

export type ThemePreference = "light" | "dark"

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  if (theme !== "light" && theme !== "dark") throw new Error("INVALID_THEME")
  const store = await cookies()
  store.set("theme", theme, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}
