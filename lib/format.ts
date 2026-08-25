import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
}

export function fullDate(iso: string): string {
  return format(new Date(iso), "d 'de' MMMM yyyy, HH:mm", { locale: es })
}

/** Fecha y hora legible (usada en detalle, comentarios e historial). */
export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: es })
}

export function shortDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy", { locale: es })
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}
