import type { jsPDF } from "jspdf"

type PdfDoc = jsPDF

export type PdfMetricCard = {
  label: string
  value: string
  note?: string
}

export type PdfBarDatum = {
  name: string
  value: number
  label?: string
}

export type PdfLineDatum = {
  label: string
  value: number
}

const slate = {
  50: [248, 250, 252] as const,
  100: [241, 245, 249] as const,
  200: [226, 232, 240] as const,
  400: [148, 163, 184] as const,
  500: [100, 116, 139] as const,
  700: [51, 65, 85] as const,
  900: [15, 23, 42] as const,
}

const rose = {
  50: [255, 241, 242] as const,
  500: [244, 63, 94] as const,
  700: [190, 18, 60] as const,
}

const accentColors = [
  [244, 63, 94] as const,
  [2, 132, 199] as const,
  [22, 163, 74] as const,
  [124, 58, 237] as const,
  [234, 88, 12] as const,
  [15, 23, 42] as const,
]

export function drawReportPage(doc: PdfDoc) {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  doc.setFillColor(...slate[50])
  doc.rect(0, 0, width, height, "F")
}

export function drawReportHeader(
  doc: PdfDoc,
  {
    title,
    subtitle,
    meta,
    x,
    y,
    width,
  }: {
    title: string
    subtitle: string
    meta?: string
    x: number
    y: number
    width: number
  }
) {
  doc.setFillColor(...slate[900])
  doc.roundedRect(x, y, width, 30, 5, 5, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(title, x + 8, y + 13)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.text(subtitle, x + 8, y + 21)

  if (meta) {
    doc.setFontSize(8)
    doc.setTextColor(226, 232, 240)
    doc.text(meta, x + width - 8, y + 13, { align: "right" })
  }
}

export function drawMetricCards(
  doc: PdfDoc,
  cards: PdfMetricCard[],
  x: number,
  y: number,
  width: number,
  options: { columns?: number; cardHeight?: number } = {}
) {
  const columns = options.columns ?? 4
  const cardHeight = options.cardHeight ?? 25
  const gap = 4
  const cardWidth = (width - gap * (columns - 1)) / columns

  cards.forEach((card, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const cardX = x + column * (cardWidth + gap)
    const cardY = y + row * (cardHeight + gap)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...slate[200])
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(...slate[500])
    doc.text(card.label.toUpperCase(), cardX + 4, cardY + 7)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...slate[900])
    doc.text(fitText(doc, card.value, cardWidth - 8), cardX + 4, cardY + 15)

    if (card.note) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.2)
      doc.setTextColor(...slate[500])
      doc.text(fitText(doc, card.note, cardWidth - 8), cardX + 4, cardY + 21)
    }
  })

  return y + Math.ceil(cards.length / columns) * (cardHeight + gap) - gap
}

export function drawSectionTitle(
  doc: PdfDoc,
  title: string,
  x: number,
  y: number
) {
  doc.setTextColor(...slate[900])
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(title, x, y)

  doc.setDrawColor(...rose[500])
  doc.setLineWidth(0.7)
  doc.line(x, y + 2.5, x + 20, y + 2.5)
}

export function drawImprovementList(
  doc: PdfDoc,
  items: string[],
  x: number,
  y: number,
  width: number
) {
  drawSectionTitle(doc, "Principais pontos a melhorar", x, y)

  const boxY = y + 6
  const rowHeight = 12
  const boxHeight = Math.max(1, items.length) * rowHeight + 4

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...slate[200])
  doc.roundedRect(x, boxY, width, boxHeight, 3, 3, "FD")

  const normalized =
    items.length > 0 ? items : ["Sem pontos críticos identificados no período."]
  normalized.forEach((item, index) => {
    const itemY = boxY + 9 + index * rowHeight
    doc.setFillColor(...rose[50])
    doc.circle(x + 5, itemY - 2.2, 2.2, "F")
    doc.setTextColor(...rose[700])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text(String(index + 1), x + 5, itemY - 1.2, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.2)
    doc.setTextColor(...slate[700])
    doc.text(doc.splitTextToSize(item, width - 16), x + 10, itemY)
  })

  return boxY + boxHeight
}

export function drawBarChart(
  doc: PdfDoc,
  title: string,
  data: PdfBarDatum[],
  x: number,
  y: number,
  width: number,
  height = 58
) {
  drawChartFrame(doc, title, x, y, width, height)

  if (data.length === 0) {
    drawEmptyChart(doc, x, y, width, height)
    return y + height
  }

  const chartX = x + 8
  const chartY = y + 12
  const chartWidth = width - 16
  const chartHeight = height - 24
  const max = niceMax(Math.max(1, ...data.map((entry) => entry.value)))
  const gap = 3
  const barWidth = Math.max(
    5,
    (chartWidth - gap * Math.max(0, data.length - 1)) / data.length
  )

  drawGrid(doc, chartX, chartY, chartWidth, chartHeight, max)

  data.forEach((entry, index) => {
    const value = Math.max(0, entry.value)
    const barHeight = (value / max) * chartHeight
    const barX = chartX + index * (barWidth + gap)
    const barY = chartY + chartHeight - barHeight
    const color = accentColors[index % accentColors.length]

    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(barX, barY, barWidth, barHeight, 1.4, 1.4, "F")

    doc.setTextColor(...slate[700])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.5)
    doc.text(
      fitText(doc, entry.label ?? formatCompact(value), barWidth + 5),
      barX + barWidth / 2,
      barY - 1.5,
      {
        align: "center",
      }
    )

    doc.setTextColor(...slate[500])
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.2)
    doc.text(
      fitText(doc, entry.name, Math.max(10, barWidth + 3)),
      barX + barWidth / 2,
      y + height - 3,
      {
        align: "center",
      }
    )
  })

  return y + height
}

export function drawLineChart(
  doc: PdfDoc,
  title: string,
  data: PdfLineDatum[],
  x: number,
  y: number,
  width: number,
  height = 58
) {
  drawChartFrame(doc, title, x, y, width, height)

  if (data.length === 0) {
    drawEmptyChart(doc, x, y, width, height)
    return y + height
  }

  const chartX = x + 8
  const chartY = y + 12
  const chartWidth = width - 16
  const chartHeight = height - 24
  const max = niceMax(Math.max(1, ...data.map((entry) => entry.value)))
  const points = data.map((entry, index) => ({
    x:
      chartX +
      (data.length === 1
        ? chartWidth
        : (index / (data.length - 1)) * chartWidth),
    y: chartY + chartHeight - (Math.max(0, entry.value) / max) * chartHeight,
    entry,
  }))

  drawGrid(doc, chartX, chartY, chartWidth, chartHeight, max)

  doc.setDrawColor(...rose[500])
  doc.setLineWidth(1)
  for (let index = 1; index < points.length; index++) {
    doc.line(
      points[index - 1].x,
      points[index - 1].y,
      points[index].x,
      points[index].y
    )
  }

  points.forEach((point, index) => {
    doc.setFillColor(
      index === points.length - 1 ? 15 : 244,
      index === points.length - 1 ? 23 : 63,
      index === points.length - 1 ? 42 : 94
    )
    doc.circle(point.x, point.y, 1.5, "F")
  })

  const first = points[0]
  const last = points.at(-1)
  if (first && last) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...slate[500])
    doc.text(first.entry.label, chartX, y + height - 3)
    doc.text(last.entry.label, chartX + chartWidth, y + height - 3, {
      align: "right",
    })
  }

  return y + height
}

function drawChartFrame(
  doc: PdfDoc,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...slate[200])
  doc.roundedRect(x, y, width, height, 3, 3, "FD")

  doc.setTextColor(...slate[900])
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.2)
  doc.text(title, x + 6, y + 7)
}

function drawGrid(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number,
  max: number
) {
  doc.setDrawColor(...slate[100])
  doc.setLineWidth(0.3)

  for (let index = 0; index <= 3; index++) {
    const lineY = y + (index / 3) * height
    doc.line(x, lineY, x + width, lineY)
  }

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(...slate[400])
  doc.text(formatCompact(max), x, y - 1)
  doc.text("0", x, y + height + 4)
}

function drawEmptyChart(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...slate[500])
  doc.text("Sem dados suficientes", x + width / 2, y + height / 2, {
    align: "center",
  })
}

function fitText(doc: PdfDoc, text: string, maxWidth: number) {
  if (doc.getTextWidth(text) <= maxWidth) return text

  let next = text
  while (next.length > 3 && doc.getTextWidth(`${next}...`) > maxWidth) {
    next = next.slice(0, -1)
  }
  return `${next.trim()}...`
}

function niceMax(value: number) {
  const exponent = Math.floor(Math.log10(value))
  const magnitude = Math.pow(10, exponent)
  return Math.ceil(value / magnitude) * magnitude
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
