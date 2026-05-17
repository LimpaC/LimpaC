import { useEffect, useMemo, useState, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Banknote, CreditCard, Droplets, FileDown, Leaf, LoaderCircle } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Skeleton } from "~/components/ui/skeleton"
import { apiFetch, useAuth } from "~/lib/auth"

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

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
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
  const [history, setHistory] = useState<CalculationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrganizationId) {
      setState(null)
      setHistory([])
      return
    }

    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const [stateResponse, historyResponse] = await Promise.all([
          apiFetch(`/calculation/state?organizationId=${activeOrganizationId}`),
          apiFetch(`/calculation/history?organizationId=${activeOrganizationId}`),
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

        if (!cancelled) {
          setState(nextState)
          setHistory(nextHistory)
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
  const orderedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [history]
  )
  const maxCards = Math.max(1, ...orderedHistory.map((entry) => entry.cards))
  const trendPoints = orderedHistory
    .map((entry, index) => {
      const x = orderedHistory.length <= 1 ? 0 : (index / (orderedHistory.length - 1)) * 100
      const y = 100 - (entry.cards / maxCards) * 100
      return `${x},${y}`
    })
    .join(" ")

  const generateReport = async () => {
    if (!latest && history.length === 0) {
      setError("Não há dados suficientes para gerar o relatório.")
      return
    }

    setIsGeneratingReport(true)
    setError(null)

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const marginX = 16
      const contentWidth = pageWidth - marginX * 2

      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F")
      doc.setFillColor(190, 18, 60)
      doc.roundedRect(marginX, 14, contentWidth, 28, 6, 6, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text("LimpaC", marginX + 8, 26)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(activeOrganization?.name ?? "Organização", marginX + 8, 34)

      autoTable(doc, {
        startY: 54,
        head: [["Indicador", "Valor"]],
        body: [
          ["Cartões digitais", latest ? numberFormatter.format(latest.cards) : "-"],
          ["Economia", latest ? moneyFormatter.format(latest.moneySaved) : "-"],
          ["Água preservada", latest ? `${numberFormatter.format(latest.waterSaved)} L` : "-"],
          ["CO2 evitado", latest ? latest.co2Impact.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "-"],
          ["Progresso da meta", `${Math.round(state?.progressPct ?? 0)}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [190, 18, 60], textColor: [255, 255, 255] },
        styles: { font: "helvetica", fontSize: 9, textColor: [15, 23, 42] },
        margin: { left: marginX, right: marginX },
      })

      autoTable(doc, {
        startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 100,
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
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { font: "helvetica", fontSize: 8.5, textColor: [15, 23, 42] },
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Organização</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-950">
            Dados {activeOrganization?.name ?? "da organização"}
          </h1>
        </div>
        <Button
          onClick={() => void generateReport()}
          disabled={isGeneratingReport || (!latest && history.length === 0)}
          className="h-11 rounded-2xl bg-slate-950 px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white hover:bg-slate-800"
        >
          {isGeneratingReport ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Relatório
        </Button>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<CreditCard />} label="Cartões" value={latest?.cards ?? 0} loading={isLoading} />
        <SummaryCard icon={<Banknote />} label="Economia" value={latest?.moneySaved ?? 0} money loading={isLoading} />
        <SummaryCard icon={<Droplets />} label="Água" value={latest?.waterSaved ?? 0} suffix=" L" loading={isLoading} />
        <SummaryCard icon={<Leaf />} label="CO2" value={latest?.co2Impact ?? 0} suffix=" kg" loading={isLoading} decimals={2} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
          <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-semibold text-slate-950">Histórico</h2>
              <p className="text-xs text-slate-500">{history.length} registros</p>
            </div>
            <div className="h-56 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
              {orderedHistory.length > 1 ? (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <polyline fill="none" stroke="#e11d48" strokeWidth="3" points={trendPoints} vectorEffect="non-scaling-stroke" />
                </svg>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-500">Sem tendência suficiente</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
          <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
            <h2 className="font-heading text-xl font-semibold text-slate-950">Meta</h2>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-500">Progresso</span>
                <span className="font-heading text-2xl font-semibold text-slate-950">
                  {Math.round(state?.progressPct ?? 0)}%
                </span>
              </div>
              <Progress value={state?.progressPct ?? 0} className="h-4 bg-slate-100" indicatorClassName="bg-rose-500" />
              <p className="text-sm text-slate-500">
                {state?.goal.configured
                  ? `${numberFormatter.format(state.goal.targetCards)} cartões de meta`
                  : "Meta padrão ativa"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
        <CardContent className="space-y-4 p-6 sm:px-7 sm:py-1">
          <h2 className="font-heading text-xl font-semibold text-slate-950">Registros recentes</h2>
          <div className="divide-y divide-slate-100">
            {orderedHistory.slice().reverse().slice(0, 6).map((entry) => (
              <div key={entry.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <span className="text-slate-500">{dateFormatter.format(new Date(entry.createdAt))}</span>
                <span className="font-medium text-slate-950">{numberFormatter.format(entry.cards)} cartões</span>
                <span className="font-medium text-emerald-600">{moneyFormatter.format(entry.moneySaved)}</span>
              </div>
            ))}
            {orderedHistory.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">Nenhum cálculo registrado ainda.</div>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
        </div>
        {loading ? (
          <Skeleton className="h-10 w-32 rounded-xl bg-slate-100" />
        ) : (
          <div className="font-heading text-3xl font-semibold text-slate-950">
            <NumberFlow
              value={value}
              locales="pt-BR"
              format={money ? { style: "currency", currency: "BRL" } : { maximumFractionDigits: decimals }}
              suffix={suffix}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
