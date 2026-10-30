import { redirect } from "next/navigation"
import { requireUserOrRedirect } from "@/lib/auth/session"
import { isCatalogSchemaReady, listCatalogEntries } from "@/lib/services/catalogs"
import { CatalogManager } from "@/components/catalogs/catalog-manager"

export const metadata = { title: "Catálogos · MesaViva" }

export default async function CatalogsPage() {
  const user = await requireUserOrRedirect()
  if (user.role !== "admin") redirect("/panel")
  const [entries, schemaReady] = await Promise.all([
    listCatalogEntries(),
    isCatalogSchemaReady(),
  ])

  return (
    <div className="mx-auto max-w-5xl">
      <CatalogManager entries={entries} schemaReady={schemaReady} />
    </div>
  )
}
