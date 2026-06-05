import { useEffect, useMemo, useState, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownUp,
  Banknote,
  Building2,
  Check,
  CreditCard,
  Droplets,
  FileDown,
  Leaf,
  LoaderCircle,
  Search,
  Trees,
  X,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { apiFetch } from "~/lib/auth"
import {
  drawBarChart,
  drawImprovementList,
  drawLineChart,
  drawMetricCards,
  drawReportHeader,
  drawReportPage,
  drawSectionTitle,
} from "~/lib/report-pdf"
import { buildImprovementItems, getGoalReportSummary } from "~/lib/report-utils"

type CalculationResult = {
  id: string
  cards: number
  co2Impact: number
  plasticSaved: number
  treesPreserved: number
  waterSaved: number
  energySaved: number
  moneySaved: number
  createdAt: string
}

type AdminOrganization = {
  id: string
  name: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  goal: {
    targetCards: number
    updatedAt: string | null
    configured: boolean
  }
  goalProgressPct: number
  latestCalculation: CalculationResult | null
  history: CalculationResult[]
}

type AdminDashboard = {
  totalCards: number
  totalCo2Impact: number
  totalPlasticSaved: number
  totalTreesPreserved: number
  totalWaterSaved: number
  totalEnergySaved: number
  totalMoneySaved: number
  totalGoalCards: number
  totalGoalProgressPct: number
  organizations: AdminOrganization[]
}

type AdminTab = "overview" | "organizations"
type OrganizationSort = "cards" | "money" | "water" | "co2"

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})
const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
})
const comparisonColors = [
  "#e11d48",
  "#0f172a",
  "#0284c7",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
]
const sortOptions: Array<{ value: OrganizationSort; label: string }> = [
  { value: "cards", label: "Cartões" },
  { value: "money", label: "Economia" },
  { value: "water", label: "Água" },
  { value: "co2", label: "CO2" },
]

export default function AdminDashboardRoute() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [organizationQuery, setOrganizationQuery] = useState("")
  const [organizationSort, setOrganizationSort] =
    useState<OrganizationSort>("cards")
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<
    string[]
  >([])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiFetch("/admin/dashboard")
        if (!response.ok) throw new Error()
        const nextData = (await response.json()) as AdminDashboard
        if (!cancelled) setData(nextData)
      } catch {
        if (!cancelled)
          setError("Não foi possível carregar o painel administrativo.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const rankingData = useMemo(
    () =>
      (data?.organizations ?? [])
        .map((organization) => ({
          name: organization.name,
          owner: organization.ownerName,
          cards: organization.latestCalculation?.cards ?? 0,
          money: organization.latestCalculation?.moneySaved ?? 0,
          water: organization.latestCalculation?.waterSaved ?? 0,
          co2: organization.latestCalculation?.co2Impact ?? 0,
        }))
        .sort((a, b) => b.cards - a.cards)
        .slice(0, 8),
    [data?.organizations]
  )

  const trendData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const organization of data?.organizations ?? []) {
      for (const entry of organization.history) {
        const day = dateFormatter.format(new Date(entry.createdAt))
        totals.set(day, (totals.get(day) ?? 0) + entry.cards)
      }
    }
    return Array.from(totals.entries()).map(([day, cards]) => ({ day, cards }))
  }, [data?.organizations])

  const filteredOrganizations = useMemo(() => {
    const query = organizationQuery.trim().toLowerCase()
    return [...(data?.organizations ?? [])]
      .filter((organization) => {
        if (!query) return true
        return [
          organization.name,
          organization.ownerName,
          organization.ownerEmail,
        ].some((value) => value.toLowerCase().includes(query))
      })
      .sort(
        (a, b) =>
          metricValue(b, organizationSort) - metricValue(a, organizationSort)
      )
  }, [data?.organizations, organizationQuery, organizationSort])

  useEffect(() => {
    if (selectedOrganizationIds.length > 0 || !data?.organizations.length)
      return
    setSelectedOrganizationIds(
      [...data.organizations]
        .sort((a, b) => metricValue(b, "cards") - metricValue(a, "cards"))
        .slice(0, 3)
        .map((organization) => organization.id)
    )
  }, [data?.organizations, selectedOrganizationIds.length])

  const selectedOrganizations = useMemo(
    () =>
      selectedOrganizationIds
        .map((id) =>
          (data?.organizations ?? []).find(
            (organization) => organization.id === id
          )
        )
        .filter((organization): organization is AdminOrganization =>
          Boolean(organization)
        ),
    [data?.organizations, selectedOrganizationIds]
  )

  const comparisonTrendData = useMemo(() => {
    const maxHistoryLength = Math.max(
      0,
      ...selectedOrganizations.map(
        (organization) => organization.history.length
      )
    )
    return Array.from({ length: maxHistoryLength }, (_, index) => {
      const row: Record<string, number | string> = { step: `R${index + 1}` }
      for (const organization of selectedOrganizations) {
        const entry = organization.history[index]
        if (entry) {
          row[organization.id] = metricFromCalculation(entry, organizationSort)
        }
      }
      return row
    })
  }, [organizationSort, selectedOrganizations])

  const comparisonBarData = useMemo(
    () =>
      selectedOrganizations.map((organization) => ({
        name: organization.name,
        cards: organization.latestCalculation?.cards ?? 0,
        money: organization.latestCalculation?.moneySaved ?? 0,
        water: organization.latestCalculation?.waterSaved ?? 0,
        co2: organization.latestCalculation?.co2Impact ?? 0,
      })),
    [selectedOrganizations]
  )

  const selectedTotals = useMemo(
    () =>
      selectedOrganizations.reduce(
        (totals, organization) => {
          const latest = organization.latestCalculation
          totals.cards += latest?.cards ?? 0
          totals.money += latest?.moneySaved ?? 0
          totals.water += latest?.waterSaved ?? 0
          totals.co2 += latest?.co2Impact ?? 0
          return totals
        },
        { cards: 0, money: 0, water: 0, co2: 0 }
      ),
    [selectedOrganizations]
  )

  const reportInsights = useMemo(() => {
    const organizations = data?.organizations ?? []
    const ranked = [...organizations].sort(
      (a, b) => metricValue(b, "cards") - metricValue(a, "cards")
    )
    const top = ranked[0] ?? null
    const lowestWithData =
      ranked.filter((organization) => organization.latestCalculation).at(-1) ??
      null
    const withoutHistory = organizations.filter(
      (organization) => organization.history.length === 0
    ).length
    const averageCards =
      organizations.length > 0 ? data!.totalCards / organizations.length : 0
    const topThreeCards = ranked
      .slice(0, 3)
      .reduce(
        (total, organization) =>
          total + (organization.latestCalculation?.cards ?? 0),
        0
      )
    const topThreeShare = data?.totalCards
      ? (topThreeCards / data.totalCards) * 100
      : 0

    return {
      top,
      lowestWithData,
      withoutHistory,
      averageCards,
      topThreeShare,
    }
  }, [data])

  const generateReport = async () => {
    if (!data) return
    setIsGeneratingReport(true)
    setError(null)

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })
      const marginX = 14
      const pageWidth = doc.internal.pageSize.getWidth()
      const contentWidth = pageWidth - marginX * 2
      const generatedAt = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
      const goalSummary = getGoalReportSummary({
        currentCards: data.totalCards,
        goalConfigured: data.totalGoalCards > 0,
        goalTargetCards: data.totalGoalCards,
        progressPct: data.totalGoalProgressPct,
      })
      const remainingGoalCards = Math.max(
        0,
        data.totalGoalCards - data.totalCards
      )
      const improvementItems = buildImprovementItems({
        currentCards: data.totalCards,
        goalConfigured: data.totalGoalCards > 0,
        goalTargetCards: data.totalGoalCards,
        progressPct: data.totalGoalProgressPct,
        historyCount: trendData.length,
        inactiveOrganizations: reportInsights.withoutHistory,
        topThreeShare: reportInsights.topThreeShare,
      })

      drawReportPage(doc)
      drawReportHeader(doc, {
        title: "LimpaC Admin",
        subtitle: "Relatório consolidado de organizações",
        meta: `Gerado em ${generatedAt}`,
        x: marginX,
        y: 12,
        width: contentWidth,
      })

      const summaryEndY = drawMetricCards(
        doc,
        [
          {
            label: "Organizações",
            value: numberFormatter.format(data.organizations.length),
            note: `${numberFormatter.format(reportInsights.withoutHistory)} sem histórico`,
          },
          {
            label: "Cartões digitais",
            value: numberFormatter.format(data.totalCards),
            note: "Total consolidado",
          },
          {
            label: "Meta consolidada",
            value: goalSummary.targetCards
              ? numberFormatter.format(goalSummary.targetCards)
              : "Não configurada",
            note: goalSummary.status,
          },
          {
            label: "Progresso da meta",
            value: `${goalSummary.progressPct}%`,
            note: `${numberFormatter.format(remainingGoalCards)} cartões restantes`,
          },
          {
            label: "Economia",
            value: moneyFormatter.format(data.totalMoneySaved),
            note: "Total estimado",
          },
          {
            label: "CO2 evitado",
            value: `${data.totalCo2Impact.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
            note: "Em CO2e",
          },
        ],
        marginX,
        50,
        contentWidth,
        { columns: 3, cardHeight: 23 }
      )

      const improvementsEndY = drawImprovementList(
        doc,
        improvementItems,
        marginX,
        summaryEndY + 10,
        contentWidth
      )

      autoTable(doc, {
        startY: improvementsEndY + 10,
        head: [["Insight", "Leitura"]],
        body: [
          [
            "Organização líder",
            reportInsights.top
              ? `${reportInsights.top.name} concentra ${numberFormatter.format(reportInsights.top.latestCalculation?.cards ?? 0)} cartões`
              : "Sem dados",
          ],
          [
            "Oportunidade de ativação",
            reportInsights.withoutHistory > 0
              ? `${numberFormatter.format(reportInsights.withoutHistory)} organizações ainda não possuem histórico`
              : "Todas as organizações possuem histórico",
          ],
          [
            "Média por organização",
            `${numberFormatter.format(reportInsights.averageCards)} cartões digitais`,
          ],
          [
            "Meta consolidada",
            data.totalGoalCards > 0
              ? `${numberFormatter.format(data.totalCards)} de ${numberFormatter.format(data.totalGoalCards)} cartões (${Math.round(data.totalGoalProgressPct)}%)`
              : "Nenhuma meta configurada nas organizações",
          ],
          [
            "Concentração top 3",
            `${reportInsights.topThreeShare.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% dos cartões digitais`,
          ],
          [
            "Menor base com dados",
            reportInsights.lowestWithData
              ? `${reportInsights.lowestWithData.name}: ${numberFormatter.format(reportInsights.lowestWithData.latestCalculation?.cards ?? 0)} cartões`
              : "Sem dados",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 8.2,
          cellPadding: 2,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: marginX, right: marginX },
      })

      doc.addPage()
      drawReportPage(doc)
      drawSectionTitle(doc, "Organizações", marginX, 18)
      autoTable(doc, {
        startY: 24,
        head: [
          [
            "Organização",
            "Responsável",
            "Cartões",
            "Meta",
            "Progresso",
            "Economia",
            "Água",
            "CO2",
          ],
        ],
        body: data.organizations.map((organization) => [
          organization.name,
          organization.ownerEmail,
          numberFormatter.format(organization.latestCalculation?.cards ?? 0),
          organization.goal.configured
            ? numberFormatter.format(organization.goal.targetCards)
            : "-",
          organization.goal.configured
            ? `${Math.round(organization.goalProgressPct)}%`
            : "-",
          moneyFormatter.format(
            organization.latestCalculation?.moneySaved ?? 0
          ),
          `${numberFormatter.format(organization.latestCalculation?.waterSaved ?? 0)} L`,
          `${(organization.latestCalculation?.co2Impact ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [190, 18, 60],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          cellPadding: 1.8,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: marginX, right: marginX },
      })

      doc.addPage()
      drawReportPage(doc)
      drawSectionTitle(doc, "Gráficos consolidados", marginX, 18)
      drawBarChart(
        doc,
        "Top organizações por cartões",
        rankingData.map((entry) => ({
          name: entry.name,
          value: entry.cards,
          label: compactFormatter.format(entry.cards),
        })),
        marginX,
        26,
        (contentWidth - 8) / 2,
        70
      )
      drawLineChart(
        doc,
        "Tendência consolidada de cartões",
        trendData.map((entry) => ({ label: entry.day, value: entry.cards })),
        marginX + (contentWidth + 8) / 2,
        26,
        (contentWidth - 8) / 2,
        70
      )
      drawBarChart(
        doc,
        "Impactos ambientais",
        [
          {
            name: "Água",
            value: data.totalWaterSaved,
            label: `${compactFormatter.format(data.totalWaterSaved)} L`,
          },
          {
            name: "Energia",
            value: data.totalEnergySaved,
            label: `${compactFormatter.format(data.totalEnergySaved)} kWh`,
          },
          {
            name: "Plástico",
            value: data.totalPlasticSaved,
            label: `${compactFormatter.format(data.totalPlasticSaved)} kg`,
          },
          {
            name: "CO2",
            value: data.totalCo2Impact,
            label: `${compactFormatter.format(data.totalCo2Impact)} kg`,
          },
        ],
        marginX,
        106,
        contentWidth,
        62
      )

      if (selectedOrganizations.length > 0) {
        doc.addPage()
        drawReportPage(doc)
        drawSectionTitle(doc, "Comparação selecionada", marginX, 18)
        autoTable(doc, {
          startY: 24,
          head: [["Indicador", "Total selecionado"]],
          body: [
            [
              "Organizações selecionadas",
              numberFormatter.format(selectedOrganizations.length),
            ],
            ["Cartões digitais", numberFormatter.format(selectedTotals.cards)],
            ["Economia", moneyFormatter.format(selectedTotals.money)],
            [
              "Água preservada",
              `${numberFormatter.format(selectedTotals.water)} L`,
            ],
            [
              "CO2 evitado",
              `${selectedTotals.co2.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
            ],
          ],
          theme: "grid",
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          styles: {
            font: "helvetica",
            fontSize: 8.2,
            textColor: [15, 23, 42],
            lineColor: [226, 232, 240],
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: marginX, right: marginX },
        })
        autoTable(doc, {
          startY: (doc as any).lastAutoTable?.finalY
            ? (doc as any).lastAutoTable.finalY + 8
            : 86,
          head: [
            [
              "Organização",
              "Responsável",
              sortLabel(organizationSort),
              "Registros",
            ],
          ],
          body: selectedOrganizations.map((organization) => [
            organization.name,
            organization.ownerEmail,
            formatMetric(
              metricValue(organization, organizationSort),
              organizationSort
            ),
            numberFormatter.format(organization.history.length),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [190, 18, 60],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          styles: {
            font: "helvetica",
            fontSize: 8,
            textColor: [15, 23, 42],
            lineColor: [226, 232, 240],
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: marginX, right: marginX },
        })
        drawBarChart(
          doc,
          `Comparação por ${sortLabel(organizationSort)}`,
          comparisonBarData.map((entry) => ({
            name: entry.name,
            value: Number(entry[organizationSort]),
            label: formatMetric(
              Number(entry[organizationSort]),
              organizationSort
            ),
          })),
          marginX,
          128,
          contentWidth,
          56
        )
      }

      doc.save("limpac-admin-relatorio.pdf")
    } catch {
      setError("Não foi possível gerar o relatório administrativo.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const toggleOrganization = (organizationId: string) => {
    setSelectedOrganizationIds((current) =>
      current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId]
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Edenred
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-950">
            Painel administrativo
          </h1>
        </div>
        <Button
          onClick={() => void generateReport()}
          disabled={isGeneratingReport || !data}
          className="h-11 rounded-2xl bg-slate-950 px-4 text-[10px] font-semibold tracking-[0.22em] text-white uppercase hover:bg-slate-800"
        >
          {isGeneratingReport ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Relatório
        </Button>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="relative inline-grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.28)]">
        <span
          className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-slate-950 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "organizations" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          Visão Geral
        </TabButton>
        <TabButton
          active={activeTab === "organizations"}
          onClick={() => setActiveTab("organizations")}
        >
          Organizações
        </TabButton>
      </div>

      {activeTab === "overview" ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Metric
              icon={<Building2 />}
              label="Orgs"
              value={data?.organizations.length ?? 0}
              loading={isLoading}
            />
            <Metric
              icon={<CreditCard />}
              label="Cartões"
              value={data?.totalCards ?? 0}
              loading={isLoading}
            />
            <Metric
              icon={<Banknote />}
              label="Economia"
              value={data?.totalMoneySaved ?? 0}
              money
              loading={isLoading}
            />
            <Metric
              icon={<Droplets />}
              label="Água"
              value={data?.totalWaterSaved ?? 0}
              suffix=" L"
              loading={isLoading}
            />
            <Metric
              icon={<Leaf />}
              label="CO2"
              value={data?.totalCo2Impact ?? 0}
              suffix=" kg"
              decimals={2}
              loading={isLoading}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <ChartCard title="Cartões por organização">
              {rankingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rankingData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        compactFormatter.format(Number(value))
                      }
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) =>
                        numberFormatter.format(Number(value))
                      }
                      cursor={{ fill: "rgba(244,63,94,0.08)" }}
                    />
                    <Bar dataKey="cards" fill="#e11d48" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Tendência consolidada">
              {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        compactFormatter.format(Number(value))
                      }
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) =>
                        numberFormatter.format(Number(value))
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="cards"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </section>
        </>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
          <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
            <CardContent className="space-y-4 p-6 sm:px-7 sm:py-1">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Trees className="h-5 w-5 text-rose-500" />
                  <h2 className="font-heading text-xl font-semibold text-slate-950">
                    Organizações
                  </h2>
                </div>
                <div className="relative min-w-0 lg:w-64">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={organizationQuery}
                    onChange={(event) =>
                      setOrganizationQuery(event.target.value)
                    }
                    placeholder="Buscar org ou responsável"
                    className="h-10 rounded-2xl border-slate-200 bg-slate-50/80 pl-9"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Selecionadas ({selectedOrganizations.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedOrganizationIds([])}
                    className="inline-flex h-7 items-center gap-1 rounded-xl px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-950"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedOrganizations.length > 0 ? (
                    selectedOrganizations.map((organization, index) => (
                      <span
                        key={organization.id}
                        className="inline-flex h-8 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              comparisonColors[index % comparisonColors.length],
                          }}
                        />
                        {organization.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      Selecione uma ou mais organizações para comparar.
                    </span>
                  )}
                </div>
              </div>

              <div className="relative grid grid-cols-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1">
                <span
                  className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl bg-slate-950 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    width: "calc((100% - 0.5rem) / 4)",
                    transform: `translateX(${sortOptions.findIndex((option) => option.value === organizationSort) * 100}%)`,
                  }}
                />
                {sortOptions.map((option) => (
                  <SortButton
                    key={option.value}
                    active={organizationSort === option.value}
                    onClick={() => setOrganizationSort(option.value)}
                  >
                    {option.label}
                  </SortButton>
                ))}
              </div>

              <div className="divide-y divide-slate-100">
                {filteredOrganizations.map((organization) => (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() => toggleOrganization(organization.id)}
                    className={`grid w-full gap-3 rounded-2xl px-3 py-4 text-left text-sm transition-colors lg:grid-cols-[auto_minmax(160px,1fr)_repeat(2,minmax(96px,auto))] lg:items-center ${
                      selectedOrganizationIds.includes(organization.id)
                        ? "bg-rose-50/80 text-slate-950 ring-1 ring-rose-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        selectedOrganizationIds.includes(organization.id)
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-slate-200 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {organization.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {organization.ownerEmail}
                      </p>
                    </div>
                    <Value
                      label="Cartões"
                      value={numberFormatter.format(
                        organization.latestCalculation?.cards ?? 0
                      )}
                    />
                    <Value
                      label="Economia"
                      value={moneyFormatter.format(
                        organization.latestCalculation?.moneySaved ?? 0
                      )}
                    />
                  </button>
                ))}
                {filteredOrganizations.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Nenhuma organização encontrada.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
              <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Comparação ativa
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-slate-950">
                      {selectedOrganizations.length === 0
                        ? "Nenhuma organização selecionada"
                        : `${selectedOrganizations.length} ${selectedOrganizations.length > 1 ? "organizações" : "organização"}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedOrganizations
                        .map((organization) => organization.name)
                        .join(" + ") || "Selecione orgs na lista."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      Registros
                    </p>
                    <p className="mt-1 font-heading text-2xl font-semibold text-slate-950">
                      {numberFormatter.format(
                        selectedOrganizations.reduce(
                          (total, organization) =>
                            total + organization.history.length,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <ValueBox
                    label="Cartões"
                    value={numberFormatter.format(selectedTotals.cards)}
                  />
                  <ValueBox
                    label="Economia"
                    value={moneyFormatter.format(selectedTotals.money)}
                  />
                  <ValueBox
                    label="Água"
                    value={`${numberFormatter.format(selectedTotals.water)} L`}
                  />
                  <ValueBox
                    label="CO2"
                    value={`${selectedTotals.co2.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`}
                  />
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-6 xl:grid-cols-2">
              <ChartCard
                title={`Histórico comparado por ${sortLabel(organizationSort)}`}
              >
                {comparisonTrendData.length > 0 &&
                selectedOrganizations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={comparisonTrendData}
                      margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="step"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          compactFormatter.format(Number(value))
                        }
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) =>
                          formatMetric(Number(value), organizationSort)
                        }
                      />
                      {selectedOrganizations.map((organization, index) => (
                        <Line
                          key={organization.id}
                          type="monotone"
                          dataKey={organization.id}
                          name={organization.name}
                          stroke={
                            comparisonColors[index % comparisonColors.length]
                          }
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard
                title={`Cruzamento por ${sortLabel(organizationSort)}`}
              >
                {comparisonBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonBarData}
                      margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          compactFormatter.format(Number(value))
                        }
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) =>
                          formatMetric(Number(value), organizationSort)
                        }
                        cursor={{ fill: "rgba(15,23,42,0.05)" }}
                      />
                      <Bar
                        dataKey={organizationSort}
                        fill="#0f172a"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
            </section>
          </div>
        </section>
      )}
    </div>
  )
}

function metricValue(organization: AdminOrganization, sort: OrganizationSort) {
  const latest = organization.latestCalculation
  if (!latest) return 0
  return metricFromCalculation(latest, sort)
}

function metricFromCalculation(
  calculation: CalculationResult,
  sort: OrganizationSort
) {
  if (sort === "money") return calculation.moneySaved
  if (sort === "water") return calculation.waterSaved
  if (sort === "co2") return calculation.co2Impact
  return calculation.cards
}

function sortLabel(sort: OrganizationSort) {
  if (sort === "money") return "economia"
  if (sort === "water") return "água"
  if (sort === "co2") return "CO2"
  return "cartões"
}

function formatMetric(value: number, sort: OrganizationSort) {
  if (sort === "money") return moneyFormatter.format(value)
  if (sort === "water") return `${numberFormatter.format(value)} L`
  if (sort === "co2")
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`
  return numberFormatter.format(value)
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-10 h-10 w-36 rounded-xl px-4 text-sm font-medium transition-colors duration-300 ${
        active ? "text-white" : "text-slate-600 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  )
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-10 inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors duration-300 ${
        active ? "text-white" : "text-slate-600 hover:text-slate-950"
      }`}
    >
      <ArrowDownUp className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

function Metric({
  icon,
  label,
  value,
  suffix,
  money,
  decimals = 0,
  loading,
}: {
  icon: ReactNode
  label: string
  value: number
  suffix?: string
  money?: boolean
  decimals?: number
  loading: boolean
}) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
      <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100 [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            {label}
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-10 w-32 rounded-xl bg-slate-100" />
        ) : (
          <div className="font-heading text-3xl font-semibold text-slate-950">
            <NumberFlow
              value={value}
              locales="pt-BR"
              format={
                money
                  ? { style: "currency", currency: "BRL" }
                  : { maximumFractionDigits: decimals }
              }
              suffix={suffix}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
      <CardContent className="space-y-4 p-6 sm:px-7 sm:py-1">
        <h2 className="font-heading text-xl font-semibold text-slate-950">
          {title}
        </h2>
        <div className="h-72 min-w-0">{children}</div>
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-sm text-slate-500">
      Sem dados suficientes
    </div>
  )
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-950 tabular-nums">{value}</p>
    </div>
  )
}

function ValueBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-2 truncate font-heading text-xl font-semibold text-slate-950 tabular-nums">
        {value}
      </p>
    </div>
  )
}
