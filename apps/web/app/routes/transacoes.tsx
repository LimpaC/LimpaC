import { useEffect, useState, type ComponentProps } from "react"
import NumberFlow from "@number-flow/react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Slider } from "~/components/ui/slider"
import {
  ArrowLeftRight,
  Banknote,
  CirclePlus,
  Droplets,
  Leaf,
  ReceiptText,
  Clock3,
  FileDown,
  LoaderCircle,
  Smartphone,
} from "lucide-react"
import { Progress } from "~/components/ui/progress"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { apiFetch, useAuth } from "~/lib/auth"
import {
  drawBarChart,
  drawLineChart,
  drawMetricCards,
  drawReportHeader,
  drawReportPage,
  drawSectionTitle,
} from "~/lib/report-pdf"

type TransactionCalculationResult = {
  id: string
  totalTransactions: number
  digitalPct: number
  digitalTransactions: number
  physicalTransactions: number
  co2Avoided: number
  paperSaved: number
  waterSaved: number
  treesPreserved: number
  moneySaved: number
  createdAt: string
}

type TransactionMetricsResult = {
  co2PerTransaction: number
  paperPerTransaction: number
  waterPerTransaction: number
  treesPerTransaction: number
  paperCostPerTransactionBrl: number
  cashHandlingCostPerTransactionBrl: number
  moneySavedPerTransactionBrl: number
}

type TransactionGoalResult = {
  targetDigitalPct: number
  updatedAt: string | null
  configured: boolean
}

type TransactionDashboardState = {
  goal: TransactionGoalResult
  latestCalculation: TransactionCalculationResult | null
  metrics: TransactionMetricsResult
  hasHistory: boolean
  progressPct: number
}

const DEFAULT_TRANSACTIONS = 1_000
const DEFAULT_DIGITAL_PCT = 60
const TRANSACTIONS_MAX = 100_000_000
const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})
const historyDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})
type NumberFlowFormat = NonNullable<ComponentProps<typeof NumberFlow>["format"]>

const moneyFlowFormat = {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
} as const satisfies NumberFlowFormat
const integerFlowFormat = {
  maximumFractionDigits: 0,
} as const satisfies NumberFlowFormat

function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function Transacoes() {
  const { activeOrganizationId, activeOrganization } = useAuth()
  const [totalTransactions, setTotalTransactions] =
    useState<number>(DEFAULT_TRANSACTIONS)
  const [digitalPct, setDigitalPct] = useState<number>(DEFAULT_DIGITAL_PCT)
  const [result, setResult] = useState<TransactionCalculationResult | null>(
    null
  )
  const [metrics, setMetrics] = useState<TransactionMetricsResult | null>(null)
  const [hasHistory, setHasHistory] = useState(false)
  const [history, setHistory] = useState<TransactionCalculationResult[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedTotal, setEditedTotal] = useState<number>(DEFAULT_TRANSACTIONS)
  const [editedPct, setEditedPct] = useState<number>(DEFAULT_DIGITAL_PCT)
  const [goalPct, setGoalPct] = useState<number>(100)
  const [goalDraft, setGoalDraft] = useState<number>(100)
  const [goalConfigured, setGoalConfigured] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const raf = requestAnimationFrame(() => setIsReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const resetState = () => {
    setTotalTransactions(DEFAULT_TRANSACTIONS)
    setDigitalPct(DEFAULT_DIGITAL_PCT)
    setResult(null)
    setMetrics(null)
    setHasHistory(false)
    setHistory([])
    setEditedTotal(DEFAULT_TRANSACTIONS)
    setEditedPct(DEFAULT_DIGITAL_PCT)
    setGoalPct(100)
    setGoalDraft(100)
    setGoalConfigured(false)
    setProgress(0)
  }

  const applyState = (data: TransactionDashboardState) => {
    setMetrics(data.metrics)
    setResult(data.latestCalculation)
    setHasHistory(data.hasHistory)
    setGoalPct(data.goal.targetDigitalPct)
    setGoalDraft(data.goal.targetDigitalPct)
    setGoalConfigured(data.goal.configured)
    setProgress(data.progressPct)
    if (data.latestCalculation) {
      setTotalTransactions(data.latestCalculation.totalTransactions)
      setDigitalPct(data.latestCalculation.digitalPct)
      setEditedTotal(data.latestCalculation.totalTransactions)
      setEditedPct(data.latestCalculation.digitalPct)
    }
  }

  const fetchState = async () => {
    if (!activeOrganizationId) {
      throw new Error("Selecione uma organização para carregar os dados.")
    }

    const [stateResult, historyResult] = await Promise.allSettled([
      apiFetch(
        `/transaction/state?organizationId=${encodeURIComponent(activeOrganizationId)}`
      ),
      apiFetch(
        `/transaction/history?organizationId=${encodeURIComponent(activeOrganizationId)}`
      ),
    ])

    if (stateResult.status !== "fulfilled" || !stateResult.value.ok) {
      throw new Error("Nao foi possivel carregar os dados atuais.")
    }

    const data = (await stateResult.value.json()) as TransactionDashboardState
    applyState(data)

    if (historyResult.status === "fulfilled") {
      const historyResponse = historyResult.value

      if (historyResponse.status === 204) {
        setHistory([])
      } else if (historyResponse.ok) {
        const historyData =
          (await historyResponse.json()) as TransactionCalculationResult[]
        setHistory([...historyData].reverse())
      } else {
        setHistory([])
      }
    }
  }

  const loadState = async () => {
    if (!activeOrganizationId) {
      resetState()
      setError("Selecione uma organização para carregar os dados.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await fetchState()
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsLoading(false)
    }
  }

  const saveCalculation = async (total: number, pct: number) => {
    if (!activeOrganizationId) {
      setError("Selecione uma organização para calcular o impacto.")
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await apiFetch("/transaction", {
        method: "POST",
        body: JSON.stringify({
          totalTransactions: clampInteger(total, 1, TRANSACTIONS_MAX),
          digitalPct: clampPct(pct),
          organizationId: activeOrganizationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel calcular o impacto das transacoes.")
      }

      await fetchState()
      return true
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const updateGoal = async () => {
    if (!activeOrganizationId) {
      setError("Selecione uma organização para salvar a meta.")
      return
    }

    setIsUpdatingGoal(true)
    setError(null)

    try {
      const response = await apiFetch("/transaction/goal", {
        method: "PUT",
        body: JSON.stringify({
          organizationId: activeOrganizationId,
          targetDigitalPct: Math.max(1, clampPct(goalDraft)),
        }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar a meta.")
      }

      await fetchState()
      setIsGoalModalOpen(false)
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  const openEditModal = () => {
    setEditedTotal(result?.totalTransactions ?? totalTransactions)
    setEditedPct(result?.digitalPct ?? digitalPct)
    setError(null)
    setIsEditModalOpen(true)
  }

  const saveEdited = async () => {
    const success = await saveCalculation(editedTotal, editedPct)
    if (success) {
      setIsEditModalOpen(false)
    }
  }

  const generateReport = async () => {
    if (!result && history.length === 0 && !hasHistory) {
      setError("Nao ha dados suficientes para gerar o relatorio.")
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
      const marginX = 16
      const contentWidth = pageWidth - marginX * 2
      const generatedAt = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
      const orderedHistory = [...history].reverse()
      const trendData = orderedHistory.map((entry) => ({
        label: formatDateTime(entry.createdAt),
        value: entry.digitalTransactions,
      }))
      const impactChartData = [
        {
          name: "Papel",
          value: paperSaved,
          label: `${paperSaved.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
        },
        {
          name: "Água",
          value: waterSaved,
          label: `${integerFormatter.format(waterSaved)} L`,
        },
        {
          name: "CO2",
          value: co2Avoided,
          label: `${co2Avoided.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`,
        },
      ].filter((entry) => entry.value > 0)

      drawReportPage(doc)
      drawReportHeader(doc, {
        title: "LimpaC",
        subtitle: `Relatório de transações - ${activeOrganization?.name ?? "Organização"}`,
        meta: `Gerado em ${generatedAt}`,
        x: marginX,
        y: 14,
        width: contentWidth,
      })

      const summaryEndY = drawMetricCards(
        doc,
        [
          {
            label: "Transações totais",
            value: integerFormatter.format(displayedTotal),
            note: `${Math.round(displayedPct)}% em meios digitais`,
          },
          {
            label: "Transações digitais",
            value: integerFormatter.format(digitalTransactions),
            note: `${integerFormatter.format(physicalTransactions)} em meios físicos`,
          },
          {
            label: "Poluição evitada",
            value: `${co2Avoided.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg CO2`,
            note: metrics
              ? `${(metrics.co2PerTransaction * 1000).toFixed(1)} g por transação digital`
              : "Em CO2e",
          },
          {
            label: "Papel evitado",
            value: `${paperSaved.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`,
            note: `${integerFormatter.format(waterSaved)} L de água preservados`,
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
            label: "Meta de transações digitais",
            value: goalConfigured ? `${goalPct}%` : "Não configurada",
            note: goalConfigured
              ? `Hoje: ${Math.round(displayedPct)}% digitais`
              : "Defina uma meta de redução",
          },
          {
            label: "Progresso da meta",
            value: goalConfigured ? `${Math.round(progress)}%` : "-",
            note: goalConfigured
              ? `${Math.max(0, goalPct - Math.round(displayedPct))} pontos percentuais restantes`
              : "Sem meta ativa",
          },
        ],
        marginX,
        summaryEndY + 7,
        contentWidth,
        { columns: 2, cardHeight: 24 }
      )

      const chartY = goalEndY + 10
      drawLineChart(
        doc,
        "Evolução das transações digitais",
        trendData,
        marginX,
        chartY,
        (contentWidth - 6) / 2,
        52
      )
      drawBarChart(
        doc,
        "Impacto consolidado",
        impactChartData,
        marginX + (contentWidth + 6) / 2,
        chartY,
        (contentWidth - 6) / 2,
        52
      )

      drawSectionTitle(
        doc,
        "Preservação e economia por transação",
        marginX,
        chartY + 62
      )
      autoTable(doc, {
        startY: chartY + 68,
        head: [["Indicador", "Valor"]],
        body: [
          ["Economia total", formatCurrency(moneySaved)],
          [
            "Custo do recibo em papel",
            metrics ? formatCurrency(metrics.paperCostPerTransactionBrl) : "-",
          ],
          [
            "Custo de manuseio de dinheiro físico",
            metrics
              ? formatCurrency(metrics.cashHandlingCostPerTransactionBrl)
              : "-",
          ],
          [
            "Economia por transação digital",
            metrics ? formatCurrency(metrics.moneySavedPerTransactionBrl) : "-",
          ],
          [
            "CO2 por transação",
            metrics ? `${(metrics.co2PerTransaction * 1000).toFixed(1)} g` : "-",
          ],
          [
            "Papel por transação",
            metrics
              ? `${(metrics.paperPerTransaction * 1000).toFixed(1)} g`
              : "-",
          ],
          [
            "Água por transação",
            metrics ? `${metrics.waterPerTransaction.toFixed(2)} L` : "-",
          ],
        ],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          textColor: [15, 23, 42],
          fillColor: [255, 255, 255],
          lineColor: [226, 232, 240],
        },
        headStyles: {
          fillColor: [190, 18, 60],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: marginX, right: marginX },
      })

      doc.addPage()
      drawReportPage(doc)
      drawSectionTitle(doc, "Histórico de registros", marginX, 22)

      autoTable(doc, {
        startY: 28,
        head: [["Data", "Transações", "% Digital", "Digitais", "Economia"]],
        body:
          history.length > 0
            ? history.map((entry) => [
                formatDateTime(entry.createdAt),
                integerFormatter.format(entry.totalTransactions),
                `${Math.round(entry.digitalPct)}%`,
                integerFormatter.format(entry.digitalTransactions),
                formatCurrency(entry.moneySaved),
              ])
            : [["Sem histórico", "-", "-", "-", "-"]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          textColor: [15, 23, 42],
          fillColor: [255, 255, 255],
          lineColor: [226, 232, 240],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: marginX, right: marginX },
      })

      doc.save("limpac-relatorio-transacoes.pdf")
    } catch {
      setError("Nao foi possivel gerar o relatorio em PDF.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  useEffect(() => {
    if (!isClient) {
      return
    }

    resetState()
    void loadState()
  }, [activeOrganizationId, isClient])

  if (!isClient) return null

  const displayedTotal = result?.totalTransactions ?? totalTransactions
  const displayedPct = result?.digitalPct ?? digitalPct
  const digitalTransactions =
    result?.digitalTransactions ?? displayedTotal * (displayedPct / 100)
  const physicalTransactions =
    result?.physicalTransactions ?? displayedTotal - digitalTransactions
  const moneySaved = result?.moneySaved ?? 0
  const co2Avoided = result?.co2Avoided ?? 0
  const paperSaved = result?.paperSaved ?? 0
  const waterSaved = result?.waterSaved ?? 0
  const isInitialLoading = isLoading && !result && history.length === 0

  const shellClass = cn(
    "border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl",
    "transition-[border-color,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
  )
  const enterClass = isReady
    ? "translate-y-0 opacity-100"
    : "translate-y-3 opacity-0"

  return (
    <>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
        <section
          className={cn("fade-rise space-y-6", enterClass)}
          style={{ transitionDelay: "90ms" }}
        >
          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Transações da empresa
                  </h2>
                </div>
              </div>

              {isInitialLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-28 rounded-full bg-slate-100/80" />
                  <Skeleton className="h-12 w-full rounded-2xl bg-slate-100/80" />
                  <Skeleton className="h-12 w-full rounded-2xl bg-slate-100/80" />
                </div>
              ) : !hasHistory ? (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="transactions"
                      className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase"
                    >
                      Quantidade de transações
                    </Label>
                    <div className="relative">
                      <ArrowLeftRight className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="transactions"
                        type="number"
                        min={1}
                        value={totalTransactions}
                        onChange={(e) =>
                          setTotalTransactions(
                            clampInteger(
                              Number(e.target.value) || 0,
                              1,
                              TRANSACTIONS_MAX
                            )
                          )
                        }
                        className="no-spinner h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-12 text-base font-medium text-slate-950 shadow-none focus-visible:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                        Transações no meio digital
                      </Label>
                      <span className="text-sm font-semibold text-slate-950 tabular-nums">
                        {digitalPct}%
                      </span>
                    </div>
                    <Slider
                      value={[digitalPct]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) =>
                        setDigitalPct(clampPct(value[0] ?? 0))
                      }
                    />
                    <p className="text-xs leading-5 text-slate-500">
                      {integerFormatter.format(
                        Math.round(totalTransactions * (digitalPct / 100))
                      )}{" "}
                      transações digitais e{" "}
                      {integerFormatter.format(
                        Math.round(totalTransactions * (1 - digitalPct / 100))
                      )}{" "}
                      em meios físicos.
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      void saveCalculation(totalTransactions, digitalPct)
                    }
                    disabled={isSaving}
                    className="h-12 w-full rounded-2xl bg-rose-500 text-[11px] font-semibold tracking-[0.22em] text-white uppercase shadow-[0_18px_45px_-22px_rgba(244,63,94,0.95)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-rose-600"
                  >
                    {isSaving ? "Salvando..." : "Salvar contagem inicial"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                        Transações atuais
                      </Label>
                      <div className="font-heading text-[2.2rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[2.4rem]">
                        <NumberFlow
                          value={displayedTotal}
                          format={integerFlowFormat}
                          locales="pt-BR"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                        Meio digital
                      </Label>
                      <div className="font-heading text-[2.2rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[2.4rem]">
                        <NumberFlow
                          value={displayedPct}
                          format={integerFlowFormat}
                          locales="pt-BR"
                          suffix="%"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={openEditModal}
                    disabled={isSaving || isLoading}
                    className="h-11 w-full rounded-2xl bg-rose-500 text-[10px] font-semibold tracking-[0.22em] text-white uppercase shadow-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-rose-600"
                  >
                    {isSaving ? "Atualizando..." : "Editar transações"}
                  </Button>
                </>
              )}

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              {goalConfigured ? (
                <div className="mx-auto flex max-w-md flex-col items-center space-y-3 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    Meta de transações digitais
                  </p>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={goalPct}
                      format={integerFlowFormat}
                      locales="pt-BR"
                      suffix="%"
                    />{" "}
                    do total
                  </div>

                  <div className="relative w-full pt-6">
                    <div
                      className="absolute top-0 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold tracking-[0.18em] text-slate-500 uppercase shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                      style={{
                        left: `${Math.min(100, Math.max(0, progress))}%`,
                      }}
                    >
                      {Math.round(progress).toLocaleString("pt-BR")}%
                    </div>

                    <Progress
                      value={progress}
                      className="h-4 rounded-full bg-slate-100"
                      indicatorClassName="bg-rose-500"
                    />
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Hoje {Math.round(displayedPct)}% das transações são
                    digitais.
                  </p>
                  <Button
                    variant="ghost"
                    className="h-9 rounded-2xl px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600 uppercase hover:bg-slate-50"
                    onClick={() => {
                      setGoalDraft(goalPct)
                      setIsGoalModalOpen(true)
                    }}
                  >
                    Ajustar meta
                  </Button>
                </div>
              ) : (
                <div className="mx-auto flex min-h-[10rem] max-w-md flex-col items-center justify-center gap-4 py-2 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100/80">
                    <CirclePlus className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-semibold tracking-[-0.04em] text-slate-950">
                      Nenhuma meta definida
                    </h3>
                    <p className="max-w-sm text-sm leading-6 text-slate-600">
                      Defina um alvo de transações digitais para acompanhar a
                      redução da poluição.
                    </p>
                  </div>
                  <Button
                    className="h-10 rounded-2xl bg-rose-500 px-4 text-[10px] font-semibold tracking-[0.2em] text-white uppercase hover:bg-rose-600"
                    onClick={() => {
                      setGoalDraft(goalPct)
                      setIsGoalModalOpen(true)
                    }}
                  >
                    Adicionar meta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Histórico
                    </p>
                  </div>
                  <h2 className="font-heading text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    Registros recentes
                  </h2>
                </div>
                <p className="text-right text-xs leading-5 text-slate-500">
                  {history.length > 0
                    ? `${history.length} registros`
                    : "Sem registros ainda"}
                </p>
              </div>

              {isInitialLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <Skeleton
                      key={item}
                      className="h-[66px] rounded-2xl bg-slate-100/80"
                    />
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {integerFormatter.format(entry.totalTransactions)}{" "}
                            transações
                          </p>
                          <p className="text-xs text-slate-500">
                            {historyDateFormatter.format(
                              new Date(entry.createdAt)
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950 tabular-nums">
                          {Math.round(entry.digitalPct)}% digital
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.co2Avoided.toLocaleString("pt-BR", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          kg de CO2 evitados
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      Nenhum lançamento registrado
                    </p>
                    <p className="text-xs leading-5 text-slate-500">
                      Assim que você salvar as transações, o histórico aparece
                      aqui.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section
          className={cn("fade-rise space-y-6", enterClass)}
          style={{ transitionDelay: "150ms" }}
        >
          <Card className="border-white/70 bg-white/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100/80">
                  <Leaf className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-medium text-slate-700">
                  Poluição evitada
                </h3>
              </div>
              {isLoading ? (
                <Skeleton className="h-12 w-44 rounded-xl bg-slate-100/80" />
              ) : (
                <div className="font-heading text-[2rem] leading-none tracking-[-0.04em] text-slate-950 tabular-nums sm:text-[2.4rem]">
                  <NumberFlow
                    value={co2Avoided}
                    format={{ maximumFractionDigits: 2 }}
                    locales="pt-BR"
                    suffix=" kg"
                  />
                </div>
              )}
              <p className="text-xs leading-relaxed text-slate-500">
                {metrics
                  ? `CO2e que deixou de ser emitido: cada transação digital evita ${(metrics.co2PerTransaction * 1000).toFixed(1)} g de CO2 de recibos e manuseio de dinheiro físico.`
                  : ""}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    Impacto preservado
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Papel
                    </p>
                  </div>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={paperSaved}
                      format={{ maximumFractionDigits: 2 }}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Kg de recibos evitados
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Água
                    </p>
                  </div>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={waterSaved}
                      format={integerFlowFormat}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Litros economizados
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Economia
                    </p>
                  </div>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={moneySaved}
                      format={moneyFlowFormat}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Em recibos e manuseio evitados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              <h2 className="font-heading text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Digital vs físico
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                      Digitais
                    </p>
                  </div>
                  <div className="mt-2 font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={digitalTransactions}
                      format={integerFlowFormat}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {Math.round(displayedPct)}% do total
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-slate-500" />
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      Físicas
                    </p>
                  </div>
                  <div className="mt-2 font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={physicalTransactions}
                      format={integerFlowFormat}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {Math.max(0, 100 - Math.round(displayedPct))}% do total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => void generateReport()}
            disabled={
              isGeneratingReport ||
              (!result && history.length === 0 && !hasHistory)
            }
            className="h-11 w-full rounded-2xl bg-slate-950 text-[10px] font-semibold tracking-[0.22em] text-white uppercase shadow-[0_18px_45px_-22px_rgba(15,23,42,0.8)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {isGeneratingReport ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar relatório
              </>
            )}
          </Button>
        </section>
      </div>

      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="w-[92vw] max-w-2xl rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.04em] text-slate-950">
              Definir meta de redução
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Escolha o percentual de transações digitais que a empresa quer
              atingir para reduzir a poluição das transações físicas.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Meta de transações digitais
              </Label>
              <span className="text-sm font-semibold text-slate-950 tabular-nums">
                {goalDraft}%
              </span>
            </div>
            <Slider
              value={[goalDraft]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) =>
                setGoalDraft(Math.max(1, clampPct(value[0] ?? 1)))
              }
            />
            <p className="text-xs leading-5 text-slate-500">
              Hoje {Math.round(displayedPct)}% das transações são digitais.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-2xl px-4 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setGoalDraft(goalPct)
                setIsGoalModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-2xl bg-rose-500 px-4 text-white transition-all duration-300 ease-out hover:bg-rose-600"
              onClick={() => void updateGoal()}
              disabled={isUpdatingGoal}
            >
              {isUpdatingGoal ? "Salvando..." : "Salvar meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[92vw] max-w-2xl rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.04em] text-slate-950">
              Editar transações
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Atualize a quantidade de transações e o percentual realizado em
              meios digitais.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="edit-transactions"
                className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase"
              >
                Quantidade de transações
              </Label>
              <Input
                id="edit-transactions"
                type="number"
                min={1}
                value={editedTotal}
                onChange={(e) =>
                  setEditedTotal(
                    clampInteger(Number(e.target.value) || 0, 1, TRANSACTIONS_MAX)
                  )
                }
                className="no-spinner h-12 w-full rounded-2xl border-slate-200 bg-slate-50/80 text-base font-medium text-slate-950 focus-visible:ring-rose-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Transações no meio digital
                </Label>
                <span className="text-sm font-semibold text-slate-950 tabular-nums">
                  {editedPct}%
                </span>
              </div>
              <Slider
                value={[editedPct]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setEditedPct(clampPct(value[0] ?? 0))}
              />
              <p className="text-xs leading-5 text-slate-500">
                {integerFormatter.format(
                  Math.round(editedTotal * (editedPct / 100))
                )}{" "}
                transações digitais e{" "}
                {integerFormatter.format(
                  Math.round(editedTotal * (1 - editedPct / 100))
                )}{" "}
                em meios físicos.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-2xl px-4 text-slate-600 hover:bg-slate-50"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-2xl bg-rose-500 px-4 text-white transition-all duration-300 ease-out hover:bg-rose-600"
              onClick={() => void saveEdited()}
              disabled={isSaving}
            >
              {isSaving ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
