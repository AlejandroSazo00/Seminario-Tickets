import { NextResponse } from "next/server"
import JSZip from "jszip"
import { generateDoc, allDocSlugs } from "@/lib/docs/generate"
import { getCurrentUser } from "@/lib/auth/session"

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Requiere sesión: la documentación es un recurso interno.
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { slug } = await params

  // Paquete completo (ZIP con todos los .docx)
  if (slug === "todos") {
    const zip = new JSZip()
    for (const s of allDocSlugs()) {
      const doc = await generateDoc(s)
      if (doc) zip.file(doc.filename, doc.buffer)
    }
    const content = await zip.generateAsync({ type: "nodebuffer" })
    return new NextResponse(new Uint8Array(content), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="MesaViva-documentacion.zip"',
      },
    })
  }

  const doc = await generateDoc(slug)
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })

  return new NextResponse(new Uint8Array(doc.buffer), {
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${doc.filename}"`,
    },
  })
}
