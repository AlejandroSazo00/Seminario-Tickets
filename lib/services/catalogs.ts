import "server-only"
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/sql"
import {
  CATEGORIES,
  CHANNELS,
  CHANNEL_LABEL,
  PRIORITIES,
  STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Channel,
  type Priority,
  type Status,
} from "@/lib/types"

export type CatalogKind = "status" | "priority" | "category" | "channel"

export interface CatalogEntry {
  kind: CatalogKind
  value: string
  label: string
  active: boolean
  sortOrder: number
}

type Row = Record<string, unknown>

export async function isCatalogSchemaReady(): Promise<boolean> {
  const rows = (await sql`SELECT to_regclass('ticket_catalogs') IS NOT NULL AS ready`) as Row[]
  return rows[0]?.ready === true
}

export async function listCatalogEntries(kind?: CatalogKind): Promise<CatalogEntry[]> {
  if (!(await isCatalogSchemaReady())) return getLegacyCatalogEntries(kind)

  const rows = (kind
    ? await sql`SELECT * FROM ticket_catalogs WHERE kind = ${kind} ORDER BY sort_order, label`
    : await sql`SELECT * FROM ticket_catalogs ORDER BY kind, sort_order, label`) as Row[]

  return rows.map((row) => ({
    kind: row.kind as CatalogKind,
    value: row.value as string,
    label: row.label as string,
    active: row.active as boolean,
    sortOrder: Number(row.sort_order),
  }))
}

export async function getActiveCatalog(kind: CatalogKind): Promise<CatalogEntry[]> {
  return (await listCatalogEntries(kind)).filter((entry) => entry.active)
}

export async function getCatalogLabelMap(): Promise<Record<string, string>> {
  const entries = await listCatalogEntries()
  return Object.fromEntries(entries.map((entry) => [`${entry.kind}:${entry.value}`, entry.label]))
}

export async function isActiveCatalogValue(kind: CatalogKind, value: string): Promise<boolean> {
  if (!(await isCatalogSchemaReady())) {
    if (kind === "status") return STATUSES.includes(value as Status)
    if (kind === "priority") return PRIORITIES.includes(value as Priority)
    if (kind === "channel") {
      const channelRows = (await sql`
        SELECT 1 FROM tickets WHERE channel = ${value} LIMIT 1
      `) as Row[]
      return Object.hasOwn(CHANNEL_LABEL, value) || channelRows.length > 0
    }
    const categoryRows = (await sql`
      SELECT 1 FROM tickets WHERE category = ${value} LIMIT 1
    `) as Row[]
    return CATEGORIES.includes(value) || categoryRows.length > 0
  }

  const rows = (await sql`
    SELECT 1 FROM ticket_catalogs
    WHERE kind = ${kind} AND value = ${value} AND active = true
    LIMIT 1
  `) as Row[]
  return rows.length > 0
}

export async function createCategory(label: string): Promise<void> {
  await requireCatalogSchema()
  const normalized = normalizeLabel(label)
  const existing = (await sql`
    SELECT 1 FROM ticket_catalogs
    WHERE kind = 'category' AND lower(label) = lower(${normalized})
    LIMIT 1
  `) as Row[]
  if (existing.length > 0) throw new Error("CATALOG_LABEL_EXISTS")
  const value = randomUUID()
  await sql`
    INSERT INTO ticket_catalogs (kind, value, label, active, sort_order)
    VALUES ('category', ${value}, ${normalized}, true, 100)
  `
}

export async function updateCatalogEntry(
  kind: CatalogKind,
  value: string,
  label: string,
  active: boolean,
): Promise<void> {
  await requireCatalogSchema()
  const normalized = normalizeLabel(label)
  const duplicate = (await sql`
    SELECT 1 FROM ticket_catalogs
    WHERE kind = ${kind}
      AND lower(label) = lower(${normalized})
      AND value <> ${value}
    LIMIT 1
  `) as Row[]
  if (duplicate.length > 0) throw new Error("CATALOG_LABEL_EXISTS")
  const dependentTickets = active ? 0 : await countCatalogDependents(kind, value)
  if (dependentTickets > 0) {
    throw new Error(`CATALOG_ENTRY_IN_USE:${dependentTickets}`)
  }
  if (kind === "status" && value === "abierto" && !active) {
    throw new Error("REQUIRED_CATALOG_ENTRY")
  }
  if (kind === "priority" && value === "media" && !active) {
    throw new Error("REQUIRED_CATALOG_ENTRY")
  }
  if (kind === "channel" && !active) {
    const otherChannels = (await sql`
      SELECT 1 FROM ticket_catalogs
      WHERE kind = 'channel' AND value <> ${value} AND active = true
      LIMIT 1
    `) as Row[]
    if (otherChannels.length === 0) throw new Error("REQUIRED_CATALOG_ENTRY")
  }
  if (!active && kind === "status" && (value === "resuelto" || value === "cerrado")) {
    const otherFinalStates = (await sql`
      SELECT 1 FROM ticket_catalogs
      WHERE kind = 'status'
        AND value IN ('resuelto', 'cerrado')
        AND value <> ${value}
        AND active = true
      LIMIT 1
    `) as Row[]
    if (otherFinalStates.length === 0) throw new Error("REQUIRED_CATALOG_ENTRY")
  }
  if (!active && kind === "category") {
    const otherCategories = (await sql`
      SELECT 1 FROM ticket_catalogs
      WHERE kind = 'category' AND value <> ${value} AND active = true
      LIMIT 1
    `) as Row[]
    if (otherCategories.length === 0) throw new Error("REQUIRED_CATALOG_ENTRY")
  }
  if (kind === "status" && !STATUSES.includes(value as Status)) throw new Error("INVALID_CATALOG_ENTRY")
  if (kind === "priority" && !PRIORITIES.includes(value as Priority)) throw new Error("INVALID_CATALOG_ENTRY")
  const rows = (await sql`
    UPDATE ticket_catalogs
    SET label = ${normalized}, active = ${active}
    WHERE kind = ${kind} AND value = ${value}
    RETURNING value
  `) as Row[]
  if (rows.length === 0) throw new Error("CATALOG_ENTRY_NOT_FOUND")
}

async function getLegacyCatalogEntries(kind?: CatalogKind): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [
    ...STATUSES.map((value, index) => ({
      kind: "status" as const,
      value,
      label: STATUS_LABEL[value],
      active: true,
      sortOrder: (index + 1) * 10,
    })),
    ...PRIORITIES.map((value, index) => ({
      kind: "priority" as const,
      value,
      label: PRIORITY_LABEL[value],
      active: true,
      sortOrder: (index + 1) * 10,
    })),
    ...CHANNELS.map((value, index) => ({
      kind: "channel" as const,
      value,
      label: CHANNEL_LABEL[value],
      active: true,
      sortOrder: (index + 1) * 10,
    })),
    ...CATEGORIES.map((value, index) => ({
      kind: "category" as const,
      value,
      label: value,
      active: true,
      sortOrder: (index + 1) * 10,
    })),
  ]
  const categoryRows = (await sql`
    SELECT DISTINCT category FROM tickets WHERE btrim(category) <> ''
  `) as Row[]
  for (const row of categoryRows) {
    const value = row.category as string
    if (!entries.some((entry) => entry.kind === "category" && entry.value === value)) {
      entries.push({
        kind: "category",
        value,
        label: value,
        active: true,
        sortOrder: 100,
      })
    }
  }
  const channelRows = (await sql`
    SELECT DISTINCT channel FROM tickets WHERE btrim(channel) <> ''
  `) as Row[]
  for (const row of channelRows) {
    const value = row.channel as string
    if (!entries.some((entry) => entry.kind === "channel" && entry.value === value)) {
      entries.push({
        kind: "channel",
        value,
        label: value,
        active: true,
        sortOrder: 100,
      })
    }
  }
  return kind ? entries.filter((entry) => entry.kind === kind) : entries
}

async function requireCatalogSchema(): Promise<void> {
  if (!(await isCatalogSchemaReady())) throw new Error("CATALOG_SCHEMA_MISSING")
}

function normalizeLabel(label: string): string {
  const normalized = label.trim()
  if (!normalized || normalized.length > 80) throw new Error("INVALID_CATALOG_LABEL")
  return normalized
}

export async function countCatalogDependents(kind: CatalogKind, value: string): Promise<number> {
  let rows: Row[]
  switch (kind) {
    case "status":
      rows = (await sql`SELECT count(*)::int AS count FROM tickets WHERE status = ${value}`) as Row[]
      break
    case "priority":
      rows = (await sql`SELECT count(*)::int AS count FROM tickets WHERE priority = ${value}`) as Row[]
      break
    case "category":
      rows = (await sql`SELECT count(*)::int AS count FROM tickets WHERE category = ${value}`) as Row[]
      break
    case "channel":
      rows = (await sql`SELECT count(*)::int AS count FROM tickets WHERE channel = ${value}`) as Row[]
      break
  }
  return Number(rows[0]?.count ?? 0)
}
