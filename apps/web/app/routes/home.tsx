import { useEffect, useMemo, useState, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Droplets,
  FileDown,
  Leaf,
  LoaderCircle,
  ReceiptText,
  Smartphone,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Skeleton } from "~/components/ui/skeleton"
import { apiFetch, useAuth } from "~/lib/auth"
import {
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

type GoalResult = {
  targetCards: number
  updatedAt: string
  configured: boolean
}

type MetricsResult = {
  co2PerCard: number
  plasticPerCard: number
  treesPerCard: number
  waterPerCard: number
  energyPerCard: number
  moneySavedPerCardBrl: number
  materialCostPerCardBrl: number
  manufacturingCostPerCardBrl: number
  shippingCostPerCardBrl: number
}

type DashboardState = {
  goal: GoalResult
  latestCalculation: CalculationResult | null
  metrics: MetricsResult
  hasHistory: boolean
  progressPct: number
}

type TransactionCalculationResult = {
  id: string
  totalTransactions: number
  digitalPct: number
  digitalTransactions: number
  physicalTransactions: number
  co2Avoided: number
  paperSaved: number
  waterSaved: number
  moneySaved: number
  createdAt: string
}

type TransactionGoalResult = {
  targetDigitalPct: number
  updatedAt: string | null
  configured: boolean
}

type TransactionDashboardState = {
  goal: TransactionGoalResult
  latestCalculation: TransactionCalculationResult | null
  hasHistory: boolean
  progressPct: number
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export default function Home() {
  const { activeOrganizationId, activeOrganization } = useAuth()
  const [state, setState] = useState<DashboardState | null>(null)
  const [transactionState, setTransactionState] =
    useState<TransactionDashboardState | null>(null)
  const [history, setHistory] = useState<CalculationResult[]>([])
  const [transactionHistory, setTransactionHistory] = useState<
    TransactionCalculationResult[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrganizationId) {
      setState(null)
      setTransactionState(null)
      setHistory([])
      setTransactionHistory([])
      return
    }

    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const [
          stateResponse,
          historyResponse,
          transactionResponse,
          transactionHistoryResponse,
        ] = await Promise.all([
          apiFetch(`/calculation/state?organizationId=${activeOrganizationId}`),
          apiFetch(
            `/calculation/history?organizationId=${activeOrganizationId}`
          ),
          apiFetch(`/transaction/state?organizationId=${activeOrganizationId}`),
          apiFetch(
            `/transaction/history?organizationId=${activeOrganizationId}`
          ),
        ])

        if (!stateResponse.ok) {
          throw new Error("Não foi possível carregar o dashboard.")
        }

        const nextState = (await stateResponse.json()) as DashboardState
        const nextHistory =
          historyResponse.status === 204
            ? []
            : historyResponse.ok
              ? ((await historyResponse.json()) as CalculationResult[])
              : []

        const nextTransactionState = transactionResponse.ok
          ? ((await transactionResponse.json()) as TransactionDashboardState)
          : null
        const nextTransactionHistory =
          transactionHistoryResponse.status === 204
            ? []
            : transactionHistoryResponse.ok
              ? ((await transactionHistoryResponse.json()) as TransactionCalculationResult[])
              : []

        if (!cancelled) {
          setState(nextState)
          setHistory(nextHistory)
          setTransactionState(nextTransactionState)
          setTransactionHistory(nextTransactionHistory)
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível conectar o front ao backend no momento.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [activeOrganizationId])

  const latest = state?.latestCalculation ?? null
  const latestTransaction = transactionState?.latestCalculation ?? null
  const orderedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [history]
  )
  const chartData = useMemo(() => {
    const byDay = new Map<
      string,
      { day: string; order: number; cards?: number; transacoes?: number }
    >()

    for (const entry of orderedHistory) {
      const date = new Date(entry.createdAt)
      const day = dateFormatter.format(date)
      const existing = byDay.get(day) ?? { day, order: date.getTime() }
      existing.cards = entry.cards
      existing.order = date.getTime()
      byDay.set(day, existing)
    }

    const orderedTransactions = [...transactionHistory].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    for (const entry of orderedTransactions) {
      const date = new Date(entry.createdAt)
      const day = dateFormatter.format(date)
      const existing = byDay.get(day) ?? { day, order: date.getTime() }
      existing.transacoes = entry.digitalTransactions
      existing.order = Math.max(existing.order, date.getTime())
      byDay.set(day, existing)
    }

    const merged = [...byDay.values()].sort((a, b) => a.order - b.order)

    // Carry the last known value forward so each line keeps going on
    // days without movement instead of stopping at its last record.
    let lastCards: number | undefined
    let lastTransactions: number | undefined
    for (const point of merged) {
      if (point.cards == null) {
        point.cards = lastCards
      } else {
        lastCards = point.cards
      }
      if (point.transacoes == null) {
        point.transacoes = lastTransactions
      } else {
        lastTransactions = point.transacoes
      }
    }

    return merged
  }, [orderedHistory, transactionHistory])

  const generateReport = async () => {
    if (!latest && history.length === 0) {
      setError("Não há dados suficientes para gerar o relatório.")
      return
    }

    setIsGeneratingReport(true)
    setError(null)

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 16
      const contentWidth = pageWidth - marginX * 2
      const generatedAt = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
      const currentCards = latest?.cards ?? 0
      const previousCards =
        orderedHistory.length > 1
          ? orderedHistory[orderedHistory.length - 2]?.cards
          : null
      const goalSummary = getGoalReportSummary({
        currentCards,
        goalConfigured: state?.goal.configured ?? false,
        goalTargetCards: state?.goal.targetCards ?? 0,
        progressPct: state?.progressPct ?? 0,
      })
      const improvementItems = buildImprovementItems({
        currentCards,
        goalConfigured: state?.goal.configured ?? false,
        goalTargetCards: state?.goal.targetCards ?? 0,
        progressPct: state?.progressPct ?? 0,
        historyCount: orderedHistory.length,
        previousCards,
      })
      const trendData = orderedHistory.map((entry) => ({
        label: dateFormatter.format(new Date(entry.createdAt)),
        value: entry.cards,
      }))

      drawReportPage(doc)
      drawReportHeader(doc, {
        title: "LimpaC",
        subtitle: `Relatório de impacto - ${activeOrganization?.name ?? "Organização"}`,
        meta: `Gerado em ${generatedAt}`,
        x: marginX,
        y: 14,
        width: contentWidth,
      })

      const metricsEndY = drawMetricCards(
        doc,
        [
          {
            label: "Cartões digitais",
            value: latest ? numberFormatter.format(latest.cards) : "-",
            note: "Base atual",
          },
          {
            label: "Economia",
            value: latest ? moneyFormatter.format(latest.moneySaved) : "-",
            note: "Total estimado",
          },
          {
            label: "Água preservada",
            value: latest
              ? `${numberFormatter.format(latest.waterSaved)} L`
              : "-",
            note: "Impacto acumulado",
          },
          {
            label: "CO2 evitado",
            value: latest
              ? `${latest.co2Impact.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`
              : "-",
            note: "Em CO2e",
          },
        ],
        marginX,
        52,
        contentWidth,
        { columns: 2 }
      )

      const goalEndY = drawMetricCards(
        doc,
        [
          {
            label: "Meta - Cartões digitais",
            value: goalSummary.targetCards
              ? `${numberFormatter.format(goalSummary.targetCards)} cartões`
              : "Não configurada",
            note:
              goalSummary.remainingCards == null
                ? goalSummary.status
                : `${goalSummary.progressPct}% concluída - ${numberFormatter.format(goalSummary.remainingCards)} restantes`,
          },
          {
            label: "Meta - Transações digitais",
            value: transactionState?.goal.configured
              ? `${transactionState.goal.targetDigitalPct}% do total`
              : "Não configurada",
            note: transactionState?.goal.configured
              ? `${Math.round(transactionState.progressPct)}% concluída - hoje ${Math.round(latestTransaction?.digitalPct ?? 0)}% digitais`
              : "Defina uma meta na calculadora de transações",
          },
        ],
        marginX,
        metricsEndY + 7,
        contentWidth,
        { columns: 2, cardHeight: 24 }
      )

      const transactionsEndY = drawMetricCards(
        doc,
        [
          {
            label: "Transações totais",
            value: latestTransaction
              ? numberFormatter.format(latestTransaction.totalTransactions)
              : "Sem registro",
            note: latestTransaction
              ? `${Math.round(latestTransaction.digitalPct)}% em meios digitais`
              : "Use a calculadora de transações",
          },
          {
            label: "Economia em transações",
            value: latestTransaction
              ? moneyFormatter.format(latestTransaction.moneySaved)
              : "-",
            note: latestTransaction
              ? `${numberFormatter.format(latestTransaction.digitalTransactions)} transações digitais`
              : "Sem dados",
          },
        ],
        marginX,
        goalEndY + 7,
        contentWidth,
        { columns: 2, cardHeight: 24 }
      )

      const improvementsEndY = drawImprovementList(
        doc,
        improvementItems,
        marginX,
        transactionsEndY + 12,
        contentWidth
      )
      let chartY = improvementsEndY + 10
      if (chartY + 52 > pageHeight - 12) {
        doc.addPage()
        drawReportPage(doc)
        chartY = 20
      }
      drawLineChart(
        doc,
        "Tendência de cartões digitais",
        trendData,
        marginX,
        chartY,
        contentWidth,
        52
      )

      let historyTitleY = chartY + 66
      let historyTableY = historyTitleY + 6
      if (historyTableY > pageHeight - 45) {
        doc.addPage()
        drawReportPage(doc)
        historyTitleY = 22
        historyTableY = 28
      }

      drawSectionTitle(doc, "Histórico de resultados", marginX, historyTitleY)
      autoTable(doc, {
        startY: historyTableY,
        head: [["Data", "Cartões", "Economia"]],
        body:
          orderedHistory.length > 0
            ? orderedHistory
                .slice()
                .reverse()
                .map((entry) => [
                  dateFormatter.format(new Date(entry.createdAt)),
                  numberFormatter.format(entry.cards),
                  moneyFormatter.format(entry.moneySaved),
                ])
            : [["Sem histórico", "-", "-"]],
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: marginX, right: marginX },
      })

      doc.save("limpac-relatorio.pdf")
    } catch {
      setError("Não foi possível gerar o relatório em PDF.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (!activeOrganizationId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
        Crie uma organização no seletor do topo para começar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Organização
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-950">
            Dados {activeOrganization?.name ?? "da organização"}
          </h1>
        </div>
        <Button
          onClick={() => void generateReport()}
          disabled={isGeneratingReport || (!latest && history.length === 0)}
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<CreditCard />}
          label="Cartões"
          value={latest?.cards ?? 0}
          loading={isLoading}
        />
        <SummaryCard
          icon={<Banknote />}
          label="Economia"
          value={latest?.moneySaved ?? 0}
          money
          loading={isLoading}
        />
        <SummaryCard
          icon={<Droplets />}
          label="Água"
          value={latest?.waterSaved ?? 0}
          suffix=" L"
          loading={isLoading}
        />
        <SummaryCard
          icon={<Leaf />}
          label="CO2"
          value={latest?.co2Impact ?? 0}
          suffix=" kg"
          loading={isLoading}
          decimals={2}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<ArrowLeftRight />}
          label="Transações"
          value={latestTransaction?.totalTransactions ?? 0}
          loading={isLoading}
        />
        <SummaryCard
          icon={<Smartphone />}
          label="% Digital"
          value={latestTransaction?.digitalPct ?? 0}
          suffix="%"
          loading={isLoading}
        />
        <SummaryCard
          icon={<Banknote />}
          label="Economia transações"
          value={latestTransaction?.moneySaved ?? 0}
          money
          loading={isLoading}
        />
        <SummaryCard
          icon={<ReceiptText />}
          label="Papel evitado"
          value={latestTransaction?.paperSaved ?? 0}
          suffix=" kg"
          decimals={2}
          loading={isLoading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
          <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-semibold text-slate-950">
                Histórico
              </h2>
              <p className="text-xs text-slate-500">
                {history.length + transactionHistory.length} registros
              </p>
            </div>
            <div className="h-56 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="homeCardsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#e11d48"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor="#e11d48"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="homeTransactionsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#059669"
                          stopOpacity={0.24}
                        />
                        <stop
                          offset="100%"
                          stopColor="#059669"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
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
                      yAxisId="cards"
                      width={48}
                      tick={{ fontSize: 11, fill: "#e11d48" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        numberFormatter.format(Number(value))
                      }
                    />
                    <YAxis
                      yAxisId="transacoes"
                      orientation="right"
                      width={48}
                      tick={{ fontSize: 11, fill: "#059669" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        numberFormatter.format(Number(value))
                      }
                    />
                    <Tooltip
                      cursor={{ stroke: "#e11d48", strokeDasharray: "4 4" }}
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 16px 38px -30px rgba(15,23,42,0.4)",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [
                        numberFormatter.format(Number(value)),
                        name,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area
                      yAxisId="cards"
                      type="monotone"
                      dataKey="cards"
                      name="Cartões"
                      stroke="#e11d48"
                      strokeWidth={3}
                      fill="url(#homeCardsGradient)"
                      dot={{ r: 3, fill: "#e11d48", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                    <Area
                      yAxisId="transacoes"
                      type="monotone"
                      dataKey="transacoes"
                      name="Transações digitais"
                      stroke="#059669"
                      strokeWidth={3}
                      fill="url(#homeTransactionsGradient)"
                      dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-500">
                  Sem tendência suficiente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
          <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
            <h2 className="font-heading text-xl font-semibold text-slate-950">
              Metas
            </h2>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-rose-500" />
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Cartões digitais
                  </span>
                </div>
                <span className="font-heading text-xl font-semibold text-slate-950">
                  {Math.round(state?.progressPct ?? 0)}%
                </span>
              </div>
              <Progress
                value={state?.progressPct ?? 0}
                className="h-3 bg-slate-100"
                indicatorClassName="bg-rose-500"
              />
              <p className="text-xs text-slate-500">
                {state?.goal.configured
                  ? `Meta: ${numberFormatter.format(state.goal.targetCards)} cartões`
                  : "Meta padrão ativa"}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-rose-500" />
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Transações digitais
                  </span>
                </div>
                <span className="font-heading text-xl font-semibold text-slate-950">
                  {Math.round(transactionState?.progressPct ?? 0)}%
                </span>
              </div>
              <Progress
                value={transactionState?.progressPct ?? 0}
                className="h-3 bg-slate-100"
                indicatorClassName="bg-emerald-500"
              />
              <p className="text-xs text-slate-500">
                {transactionState?.goal.configured
                  ? `Meta: ${transactionState.goal.targetDigitalPct}% das transações no digital (hoje ${Math.round(latestTransaction?.digitalPct ?? 0)}%)`
                  : "Meta de transações não configurada"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
        <CardContent className="space-y-4 p-6 sm:px-7 sm:py-1">
          <h2 className="font-heading text-xl font-semibold text-slate-950">
            Registros recentes
          </h2>
          <div className="divide-y divide-slate-100">
            {orderedHistory
              .slice()
              .reverse()
              .slice(0, 6)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <span className="text-slate-500">
                    {dateFormatter.format(new Date(entry.createdAt))}
                  </span>
                  <span className="font-medium text-slate-950">
                    {numberFormatter.format(entry.cards)} cartões
                  </span>
                  <span className="font-medium text-emerald-600">
                    {moneyFormatter.format(entry.moneySaved)}
                  </span>
                </div>
              ))}
            {orderedHistory.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Nenhum cálculo registrado ainda.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
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
