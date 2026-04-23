import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Progress } from "~/components/ui/progress"
import {
  CreditCard,
  Banknote,
  Droplets,
  Zap,
  CirclePlus,
} from "lucide-react"
import { useTokenStore } from "~/lib/store"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"

type CalculationResult = {
  id: string
  cards: number
  co2Impact: number
  waterSaved: number
  energySaved: number
  moneySaved: number
  createdAt: string
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

type GoalResult = {
  targetCards: number
  updatedAt: string
  configured: boolean
}

type DashboardState = {
  goal: GoalResult
  latestCalculation: CalculationResult | null
  metrics: MetricsResult
  hasHistory: boolean
  progressPct: number
}

type MetricCardProps = {
  icon: ReactNode
  eyebrow: string
  title: string
  value: number
  isLoading: boolean
  format: NumberFlowFormat
  suffix?: string
  helper: string
  valueClassName?: string
  loadingWidth?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
const DEFAULT_CARDS = 350
const GOAL_MIN = 1
const GOAL_MAX = 5_000_000
const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
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

function AnimatedMetricValue({
  value,
  isLoading,
  format,
  suffix,
  valueClassName,
  loadingWidth = "w-28",
}: {
  value: number
  isLoading: boolean
  format: NumberFlowFormat
  suffix?: string
  valueClassName?: string
  loadingWidth?: string
}) {
  if (isLoading) {
    return <Skeleton className={cn("h-12 rounded-xl bg-slate-100/80", loadingWidth)} />
  }

  return (
    <div className={cn("font-heading tabular-nums tracking-[-0.04em] text-slate-950", valueClassName)}>
      <NumberFlow value={value} format={format} locales="pt-BR" suffix={suffix} />
    </div>
  )
}

function MetricCard({
  icon,
  eyebrow,
  title,
  value,
  isLoading,
  format,
  suffix,
  helper,
  valueClassName,
  loadingWidth,
}: MetricCardProps) {
  return (
    <Card className="border-white/70 bg-white/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100/80">
              {icon}
            </div>
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {eyebrow}
                </p>
              ) : null}
            <h3 className="mt-1 text-xs font-medium text-slate-700">{title}</h3>
          </div>
        </div>

        <AnimatedMetricValue
          value={value}
          isLoading={isLoading}
          format={format}
          suffix={suffix}
          valueClassName={valueClassName ?? "text-2xl sm:text-[2rem] leading-none"}
          loadingWidth={loadingWidth}
        />

        {helper ? <p className="text-xs leading-relaxed text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function Calcular() {
  const token = useTokenStore((state) => state.token)
  const [cards, setCards] = useState<number>(DEFAULT_CARDS)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [goal, setGoal] = useState<number>(GOAL_MAX)
  const [progress, setProgress] = useState<number>(0)
  const [metrics, setMetrics] = useState<MetricsResult | null>(null)
  const [hasHistory, setHasHistory] = useState(false)
  const [goalDraft, setGoalDraft] = useState<number>(GOAL_MAX)
  const [goalConfigured, setGoalConfigured] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isEditCardsModalOpen, setIsEditCardsModalOpen] = useState(false)
  const [editedCards, setEditedCards] = useState<number>(DEFAULT_CARDS)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)
  const [isSavingCards, setIsSavingCards] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const raf = requestAnimationFrame(() => setIsReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const resolveToken = () => {
    let currentToken = token

    if (!currentToken) {
      const name = "device_token="
      const decodedCookie = decodeURIComponent(document.cookie)
      const ca = decodedCookie.split(";")
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === " ") c = c.substring(1)
        if (c.indexOf(name) === 0) {
          try {
            const cookieValue = c.substring(name.length)
            const parsed = JSON.parse(cookieValue)
            currentToken = parsed.state?.token || cookieValue
          } catch {
            currentToken = c.substring(name.length)
          }
          break
        }
      }
    }

    return currentToken
  }

  const applyState = (data: DashboardState) => {
    setGoal(data.goal.targetCards)
    setGoalDraft(data.goal.targetCards)
    setMetrics(data.metrics)
    setResult(data.latestCalculation)
    setHasHistory(data.hasHistory)
    setProgress(data.progressPct)
    setGoalConfigured(data.goal.configured)
    if (data.latestCalculation) {
      setCards(data.latestCalculation.cards)
      setEditedCards(data.latestCalculation.cards)
    }
  }

  const loadState = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/calculation/state?token=${encodeURIComponent(currentToken)}`
      )

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar os dados atuais.")
      }

      const data = (await response.json()) as DashboardState
      applyState(data)
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshState = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      throw new Error("Token do dispositivo ainda nao foi inicializado.")
    }

    const response = await fetch(
      `${API_BASE_URL}/calculation/state?token=${encodeURIComponent(currentToken)}`
    )

    if (!response.ok) {
      throw new Error("Nao foi possivel sincronizar os dados mais recentes.")
    }

    const data = (await response.json()) as DashboardState
    applyState(data)
  }

  const calculateImpact = async (cardAmount: number) => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/calculation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cards: Math.max(1, Math.floor(cardAmount)), token: currentToken }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel calcular o impacto ambiental.")
      }

      await refreshState()
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsLoading(false)
    }
  }

  const incrementCards = async (amount: number) => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return false
    }

    const normalized = clampInteger(amount, 1, GOAL_MAX)
    if (normalized < 1) {
      setError("Informe uma quantidade valida para adicionar.")
      return false
    }

    setIsSavingCards(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/calculation/increment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, addCards: normalized }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel atualizar os cartoes utilizados.")
      }

      await refreshState()
      return true
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
      return false
    } finally {
      setIsSavingCards(false)
    }
  }

  const decrementCards = async (amount: number) => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return false
    }

    const normalized = clampInteger(amount, 1, GOAL_MAX)
    if (normalized < 1) {
      setError("Informe uma quantidade valida para remover.")
      return false
    }

    if (displayedCards - normalized < 1) {
      setError("A quantidade final de cartoes nao pode ser menor que 1.")
      return false
    }

    setIsSavingCards(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/calculation/decrement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, removeCards: normalized }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel remover os cartoes utilizados.")
      }

      await refreshState()
      return true
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
      return false
    } finally {
      setIsSavingCards(false)
    }
  }

  const openEditCardsModal = () => {
    setEditedCards(displayedCards)
    setIsEditCardsModalOpen(true)
  }

  const saveEditedCards = async () => {
    const normalized = clampInteger(editedCards, 1, GOAL_MAX)
    const delta = normalized - displayedCards

    if (delta === 0) {
      setIsEditCardsModalOpen(false)
      return
    }

    const success =
      delta > 0 ? await incrementCards(delta) : await decrementCards(Math.abs(delta))

    if (success) {
      setIsEditCardsModalOpen(false)
    }
  }

  const updateGoal = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    const normalized = clampInteger(goalDraft, GOAL_MIN, GOAL_MAX)

    setIsUpdatingGoal(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/goal`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, targetCards: normalized }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar a meta.")
      }

      await refreshState()
      setIsGoalModalOpen(false)
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  useEffect(() => {
    if (!isClient) {
      return
    }

    void loadState()
  }, [isClient, token])

  useEffect(() => {
    const openGoal = () => setIsGoalModalOpen(true)
    const openCards = () => setIsEditCardsModalOpen(true)

    window.addEventListener("limpac:open-goal", openGoal as EventListener)
    window.addEventListener("limpac:open-cards", openCards as EventListener)

    return () => {
      window.removeEventListener("limpac:open-goal", openGoal as EventListener)
      window.removeEventListener("limpac:open-cards", openCards as EventListener)
    }
  }, [])

  if (!isClient) return null

  const displayedCards = result?.cards ?? cards
  const moneySaved = result?.moneySaved ?? 0
  const waterSaved = result?.waterSaved ?? 0
  const pollutionAvoided = result?.co2Impact ?? 0
  const pollutionPerCard = metrics?.co2PerCard ?? 0

  const shellClass = cn(
    "border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl",
    "transition-[border-color,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
  )
  const enterClass = isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
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
                    Cartões digitais utilizados
                  </h2>
                </div>
              </div>

              {!hasHistory ? (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="cards"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Quantidade
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="cards"
                        type="number"
                        min={1}
                        value={cards}
                        onChange={(e) =>
                          setCards(clampInteger(Number(e.target.value) || 0, 1, GOAL_MAX))
                        }
                        className="no-spinner h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-12 text-base font-medium text-slate-950 shadow-none focus-visible:ring-rose-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => void calculateImpact(cards)}
                    disabled={isLoading}
                    className="h-12 w-full rounded-2xl bg-rose-500 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_45px_-22px_rgba(244,63,94,0.95)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-rose-600"
                  >
                    {isLoading ? "Calculando..." : "Atualizar economia"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Contagem atual
                      </Label>
                      <div className="font-heading text-[2.2rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[2.4rem]">
                        <NumberFlow value={displayedCards} format={integerFlowFormat} locales="pt-BR" />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={openEditCardsModal}
                    disabled={isSavingCards}
                    className="h-11 w-full rounded-2xl bg-rose-500 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-rose-600"
                  >
                    {isSavingCards ? "Atualizando..." : "Editar cartões"}
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
        </section>

        <section
          className={cn("fade-rise space-y-6", enterClass)}
          style={{ transitionDelay: "150ms" }}
        >
          <MetricCard
            icon={<Banknote className="h-5 w-5" />}
            eyebrow=""
            title="Economia total"
            value={moneySaved}
            isLoading={isLoading}
            format={moneyFlowFormat}
            helper=""
            valueClassName="text-[2rem] sm:text-[2.4rem] leading-none"
            loadingWidth="w-44"
          />

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    Impacto preservado
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Água
                    </p>
                  </div>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow value={waterSaved} format={integerFlowFormat} locales="pt-BR" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">Litros economizados</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Poluição
                    </p>
                  </div>
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow
                      value={pollutionAvoided}
                      format={{ maximumFractionDigits: 2 }}
                      locales="pt-BR"
                    />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">CO2e evitado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(shellClass, "rounded-[28px]")}>
            <CardContent className="space-y-6 p-6 sm:px-7 sm:py-1">
              {goalConfigured ? (
                <div className="mx-auto flex max-w-md flex-col items-center space-y-3 text-center">
                  <div className="font-heading text-[1.55rem] font-semibold tracking-[-0.05em] text-slate-950">
                    <NumberFlow value={goal} format={integerFlowFormat} locales="pt-BR" /> cartões
                  </div>

                  <div className="relative w-full pt-6">
                    <div
                      className="absolute top-0 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                      style={{ left: `${Math.min(100, Math.max(0, progress))}%` }}
                    >
                      {Math.round(progress).toLocaleString("pt-BR")}%
                    </div>

                    <Progress
                      value={progress}
                      className="h-4 rounded-full bg-slate-100"
                      indicatorClassName="bg-rose-500"
                    />
                  </div>
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
                      Defina uma meta para ter mais controle sobre o período.
                    </p>
                  </div>
                  <Button
                    className="h-10 rounded-2xl bg-rose-500 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-rose-600"
                    onClick={() => setIsGoalModalOpen(true)}
                  >
                    Adicionar meta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="w-[92vw] max-w-2xl rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.04em] text-slate-950">
              Definir meta
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Ajuste sua meta de cartões digitais para refletir o objetivo do período.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <Label
              htmlFor="goal-cards"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Meta de cartões
            </Label>
            <Input
              id="goal-cards"
              type="number"
              min={GOAL_MIN}
              max={GOAL_MAX}
              value={goalDraft}
              onChange={(e) =>
                setGoalDraft(clampInteger(Number(e.target.value) || 0, GOAL_MIN, GOAL_MAX))
              }
              className="no-spinner h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base font-medium text-slate-950 focus-visible:ring-rose-500"
            />
            <p className="text-right text-xs font-medium text-slate-500">
              {integerFormatter.format(goalDraft)} cartões
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-2xl px-4 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setGoalDraft(goal)
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

      <Dialog open={isEditCardsModalOpen} onOpenChange={setIsEditCardsModalOpen}>
        <DialogContent className="w-[92vw] max-w-4xl rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.04em] text-slate-950">
              Editar cartões
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Escreva a quantidade final de cartões digitais que deseja registrar.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label
              htmlFor="edit-cards"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Quantidade final
            </Label>
            <Input
              id="edit-cards"
              type="number"
              min={1}
              value={editedCards}
              onChange={(e) => setEditedCards(clampInteger(Number(e.target.value) || 0, 1, GOAL_MAX))}
              className="no-spinner h-12 w-full rounded-2xl border-slate-200 bg-slate-50/80 text-base font-medium text-slate-950 focus-visible:ring-rose-500"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-2xl px-4 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setEditedCards(displayedCards)
                setIsEditCardsModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-2xl bg-rose-500 px-4 text-white transition-all duration-300 ease-out hover:bg-rose-600"
              onClick={() => void saveEditedCards()}
              disabled={isSavingCards}
            >
              {isSavingCards ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
