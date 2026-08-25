import "server-only"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx"

const BRAND = "2563EB"
const GRAY = "64748B"

export function h1(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 140 } })
}

export function h2(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } })
}

export function h3(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 100 } })
}

export function p(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED })
}

export function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], bullet: { level }, spacing: { after: 60 } })
}

export function code(text: string): Paragraph {
  return new Paragraph({
    children: text.split("\n").map(
      (line, i) =>
        new TextRun({ text: line, font: "Consolas", size: 18, break: i === 0 ? 0 : 1 }),
    ),
    shading: { type: "clear", color: "auto", fill: "F1F5F9" },
    spacing: { after: 120, before: 60 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: BRAND, space: 8 },
    },
  })
}

/** Tabla simple con cabecera resaltada. */
export function table(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text) =>
        new TableCell({
          shading: { type: "clear", color: "auto", fill: BRAND },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })] }),
          ],
        }),
    ),
  })

  const bodyRows = rows.map(
    (cells, ri) =>
      new TableRow({
        children: cells.map(
          (text) =>
            new TableCell({
              shading: { type: "clear", color: "auto", fill: ri % 2 === 0 ? "F8FAFC" : "FFFFFF" },
              margins: { top: 50, bottom: 50, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
            }),
        ),
      }),
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  })
}

export function coverTitle(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MesaViva", bold: true, size: 56, color: BRAND })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Sistema de gestión de tickets de soporte", size: 24, color: GRAY })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 40 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: subtitle, italics: true, size: 22, color: GRAY })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Versión 1.0 · ${new Date().toLocaleDateString("es")}`, size: 18, color: GRAY })],
      pageBreakBefore: false,
    }),
    new Paragraph({ pageBreakBefore: true }),
  ]
}

export async function buildDoc(title: string, children: (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    creator: "MesaViva",
    title,
    styles: {
      default: {
        heading1: { run: { size: 30, bold: true, color: BRAND }, paragraph: { spacing: { after: 140 } } },
        heading2: { run: { size: 24, bold: true, color: "1E293B" } },
        heading3: { run: { size: 20, bold: true, color: "334155" } },
        document: { run: { font: "Calibri", size: 21, color: "1E293B" } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children }],
  })
  return Packer.toBuffer(doc)
}
