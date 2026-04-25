import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Progress } from "~/components/ui/progress"
import {
  CreditCard,
  Banknote,
  Wallet,
  TreeDeciduous,
  Droplets,
  Zap,
  Factory,
  Truck,
  HelpCircle,
  Settings,
} from "lucide-react"
import { useTokenStore } from "~/lib/store"
import { Skeleton } from "~/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
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
  treesPreserved: number
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
}

type DashboardState = {
  goal: GoalResult
  latestCalculation: CalculationResult | null
  metrics: MetricsResult
  hasHistory: boolean
  progressPct: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
const DEFAULT_CARDS = 350
const GOAL_MIN = 1
const GOAL_MAX = 5_000_000

export default function Calcular() {
  const token = useTokenStore((state) => state.token)
  const [cards, setCards] = useState<number>(DEFAULT_CARDS)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [goal, setGoal] = useState<number>(GOAL_MAX)
  const [progress, setProgress] = useState<number>(0)
  const [metrics, setMetrics] = useState<MetricsResult | null>(null)
  const [hasHistory, setHasHistory] = useState(false)
  const [goalDraft, setGoalDraft] = useState<number>(GOAL_MAX)
  const [incrementAmount, setIncrementAmount] = useState<number>(1)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false)
  const [isDecrementModalOpen, setIsDecrementModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)
  const [isIncrementing, setIsIncrementing] = useState(false)
  const [isDecrementing, setIsDecrementing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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
    if (data.latestCalculation) {
      setCards(data.latestCalculation.cards)
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

  const incrementCards = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    const amount = Math.floor(incrementAmount)
    if (amount < 1) {
      setError("Informe uma quantidade valida para adicionar.")
      return
    }

    setIsIncrementing(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/calculation/increment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, addCards: amount }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel atualizar os cartoes utilizados.")
      }

      await refreshState()
      setIncrementAmount(1)
      setIsIncrementModalOpen(false)
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsIncrementing(false)
    }
  }

  const decrementCards = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    const amount = Math.floor(incrementAmount)
    if (amount < 1) {
      setError("Informe uma quantidade valida para remover.")
      return
    }

    if (displayedCards - amount < 1) {
      setError("A quantidade final de cartoes nao pode ser menor que 1.")
      return
    }

    setIsDecrementing(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/calculation/decrement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, removeCards: amount }),
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel remover os cartoes utilizados.")
      }

      await refreshState()
      setIncrementAmount(1)
      setIsDecrementModalOpen(false)
    } catch {
      setError("Nao foi possivel conectar o front ao backend no momento.")
    } finally {
      setIsDecrementing(false)
    }
  }

  const updateGoal = async () => {
    const currentToken = resolveToken()

    if (!currentToken) {
      setError("Token do dispositivo ainda nao foi inicializado.")
      return
    }

    const normalized = Math.max(GOAL_MIN, Math.min(GOAL_MAX, Math.floor(goalDraft)))

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

  if (!isClient) return null

  const displayedCards = result?.cards ?? cards
  const calculatedCards = result?.cards ?? 0
  const moneySaved = result?.moneySaved ?? 0
  const treesPreserved = result?.treesPreserved ?? 0
  const waterSaved = Math.round(result?.waterSaved ?? 0).toLocaleString("pt-BR")
  const energySaved = Math.round(result?.energySaved ?? 0)
  const materialCostPerCard = metrics?.materialCostPerCardBrl ?? 0
  const manufacturingCostPerCard = metrics?.manufacturingCostPerCardBrl ?? 0
  const shippingCostPerCard = metrics?.shippingCostPerCardBrl ?? 0
  const monetaryEquivalentMaterial = calculatedCards * materialCostPerCard
  const monetaryEquivalentManufacturing = calculatedCards * manufacturingCostPerCard
  const monetaryEquivalentShipping = calculatedCards * shippingCostPerCard

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(value)

  const EquivalenceValue = ({
    value,
    label,
    isLoading,
    valueClassName,
  }: {
    value: string | number
    label: string
    isLoading: boolean
    valueClassName?: string
  }) => {
    return (
      <div className="space-y-0">
        {isLoading ? (
          <Skeleton className="my-1 h-[32px] w-[60px] bg-slate-100" />
        ) : (
          <p className={`text-[28px] leading-none font-black text-[#0f172a] ${valueClassName ?? ""}`}>
            {value}
          </p>
        )}
        <p className="text-[11px] text-slate-400">{label}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-[#0f172a]">
      <header className="flex h-16 items-center justify-between border-b bg-white px-8">
        <div className="flex items-center gap-1 text-2xl font-bold text-rose-500">
          Limpa
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-500 text-[10px]">
            ©
          </span>
        </div>
        <nav className="hidden items-center gap-6 lg:flex">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="h-9 px-3 text-sm font-semibold text-slate-600">
            Dashboard
          </Button>
          <Button variant="ghost" className="h-9 px-3 text-sm font-semibold text-slate-600">
            Relatórios
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsGoalModalOpen(true)}>
                Ajustar Meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-[40px] leading-[1.05] font-black tracking-tight text-[#0f172a]">
                Calcular impacto ambiental da transação física vs digital
              </h1>
              <p className="max-w-md text-[16px] leading-relaxed text-slate-500">
                Avalie como a migração para o digital reduz a emissão de
                poluentes e o consumo de recursos naturais em suas operações
                diárias.
              </p>
            </div>

            <Card className="max-w-md border-slate-100 bg-white shadow-none">
              <CardContent className="space-y-5 p-6 py-4">
                {!hasHistory ? (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="cards"
                        className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase"
                      >
                        Quantidade de cartões digitais utilizados
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="cards"
                          type="number"
                          min={1}
                          value={cards}
                          onChange={(e) => setCards(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
                          className="no-spinner h-12 border-slate-100 bg-slate-50/50 pl-12 text-lg font-bold focus-visible:ring-rose-500"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => void calculateImpact(cards)}
                      disabled={isLoading}
                      className="h-12 w-full bg-rose-500 text-[11px] font-bold tracking-[0.05em] text-white uppercase shadow-none hover:bg-rose-600"
                    >
                      {isLoading ? "Calculando..." : "Atualizar Economia"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase">
                        Quantidade de cartões digitais utilizados
                      </Label>
                      <p className="text-[28px] font-black text-[#0f172a]">
                        {displayedCards.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsIncrementModalOpen(true)}
                      disabled={isIncrementing || isDecrementing}
                      className="h-12 w-full bg-rose-500 text-[11px] font-bold tracking-[0.05em] text-white uppercase shadow-none hover:bg-rose-600"
                    >
                      {isIncrementing ? "Atualizando..." : "Adicionar cartões"}
                    </Button>
                    <Button
                      onClick={() => setIsDecrementModalOpen(true)}
                      disabled={isIncrementing || isDecrementing}
                      className="h-12 w-full bg-slate-200 text-[11px] font-bold tracking-[0.05em] text-slate-700 uppercase shadow-none hover:bg-slate-300"
                    >
                      {isDecrementing ? "Atualizando..." : "Remover cartões"}
                    </Button>
                  </>
                )}
                {error ? <p className="text-sm text-rose-500">{error}</p> : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="grid-row-2 grid gap-4 lg:grid-cols-1">
              <Card className="border-slate-100 bg-white py-2! shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                      <Banknote className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.05em] text-[#1e293b] uppercase">
                      Economia em Dinheiro
                    </span>
                  </div>
                  <div className="mt-4 space-y-0.5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase">
                      Economia Total
                    </p>
                    {isLoading ? (
                      <Skeleton className="h-[40px] w-[150px] bg-slate-100" />
                    ) : (
                      <p className="text-[28px] font-black text-[#0f172a]">{formatCurrency(moneySaved)}</p>
                    )}
                    <p className="text-[11px] text-slate-400">Material + Manufatura + Envio</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-100 bg-white shadow-none">
              <CardContent className="p-6 py-4">
                <h3 className="text-[12px] font-bold tracking-[0.05em] text-[#1e293b] uppercase">
                  Equivalências Ambientais
                </h3>
                <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <TreeDeciduous className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Árvores
                      </span>
                    </div>
                    <EquivalenceValue
                      value={treesPreserved}
                      label="Árvores preservadas"
                      isLoading={isLoading}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <Droplets className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Água
                      </span>
                    </div>
                    <EquivalenceValue value={waterSaved} label="L economizados" isLoading={isLoading} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <Zap className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Energia
                      </span>
                    </div>
                    <EquivalenceValue value={energySaved} label="kWh poupados" isLoading={isLoading} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white shadow-none">
              <CardContent className="p-6 py-4">
                <h3 className="text-[12px] font-bold tracking-[0.05em] text-[#1e293b] uppercase">
                  Equivalências Financeiras
                </h3>
                <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-4">
                  <div className="min-w-0 space-y-4 lg:w-[32%]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Material</span>
                    </div>
                    <EquivalenceValue
                      value={formatCurrency(monetaryEquivalentMaterial)}
                      label={`R$ ${materialCostPerCard.toFixed(2)} por cartão`}
                      isLoading={isLoading}
                      valueClassName="text-[22px] leading-tight lg:text-[24px]"
                    />
                  </div>
                  <div className="min-w-0 space-y-4 lg:w-[32%]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <Factory className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Manufatura</span>
                    </div>
                    <EquivalenceValue
                      value={formatCurrency(monetaryEquivalentManufacturing)}
                      label={`R$ ${manufacturingCostPerCard.toFixed(2)} por cartão`}
                      isLoading={isLoading}
                      valueClassName="text-[22px] leading-tight lg:text-[24px]"
                    />
                  </div>
                  <div className="min-w-0 space-y-4 lg:w-[32%]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                        <Truck className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Envio</span>
                    </div>
                    <EquivalenceValue
                      value={formatCurrency(monetaryEquivalentShipping)}
                      label={`R$ ${shippingCostPerCard.toFixed(2)} por cartão`}
                      isLoading={isLoading}
                      valueClassName="text-[22px] leading-tight lg:text-[24px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white shadow-none">
              <CardContent className="p-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl leading-tight font-black text-[#0f172a]">
                      Meta
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-[28px] font-black text-[#0f172a]">
                        {Math.round(goal).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[11px] font-bold text-[#0f172a]">cartões</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Progress
                    value={progress}
                    className="h-6 rounded-md bg-slate-100"
                    indicatorClassName="bg-red-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                    <span>Início do Ano</span>
                    <span>Meta: {Math.round(goal).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="h-12 w-full bg-rose-500 text-[11px] font-bold tracking-[0.05em] text-white uppercase shadow-none hover:bg-rose-600">
              Ver Relatório
            </Button>
            <p className="text-right text-[11px] text-slate-400">
              Baseado em {calculatedCards.toLocaleString("pt-BR")} cartoes.
            </p>
          </div>
        </div>
      </main>

      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Definir Meta</DialogTitle>
              <DialogDescription>
                Ajuste sua meta de cartões digitais para refletir o objetivo do período.
              </DialogDescription>
            </DialogHeader>

          <div className="mt-6 space-y-4">
            <Label
              htmlFor="goal-cards"
              className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase"
            >
              Meta de cartões
            </Label>
            <Input
              id="goal-cards"
              type="number"
              min={GOAL_MIN}
              max={GOAL_MAX}
              value={goalDraft}
              onChange={(e) => setGoalDraft(Math.max(GOAL_MIN, Math.floor(Number(e.target.value) || 0)))}
              className="no-spinner h-12 border-slate-100 bg-slate-50/50 text-lg font-bold focus-visible:ring-rose-500"
            />
            <p className="text-right text-sm font-semibold text-slate-500">
              {Math.round(goalDraft).toLocaleString("pt-BR")} cartões
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-slate-600"
              onClick={() => {
                setGoalDraft(goal)
                setIsGoalModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => void updateGoal()} disabled={isUpdatingGoal}>
              {isUpdatingGoal ? "Salvando..." : "Salvar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isIncrementModalOpen} onOpenChange={setIsIncrementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cartões</DialogTitle>
            <DialogDescription>
               Informe quantos cartões digitais foram utilizados desde a última atualização.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor="increment-cards" className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase">
              Quantidade a adicionar
            </Label>
            <Input
              id="increment-cards"
              type="number"
              min={1}
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
              className="no-spinner h-12 border-slate-100 bg-slate-50/50 text-lg font-bold focus-visible:ring-rose-500"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-slate-600"
              onClick={() => {
                setIncrementAmount(1)
                setIsIncrementModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => void incrementCards()} disabled={isIncrementing}>
              {isIncrementing ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDecrementModalOpen} onOpenChange={setIsDecrementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover cartões</DialogTitle>
            <DialogDescription>
              Informe quantos cartões precisam ser removidos da contagem atual.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor="decrement-cards" className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase">
              Quantidade a remover
            </Label>
            <Input
              id="decrement-cards"
              type="number"
              min={1}
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
              className="no-spinner h-12 border-slate-100 bg-slate-50/50 text-lg font-bold focus-visible:ring-rose-500"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-slate-600"
              onClick={() => {
                setIncrementAmount(1)
                setIsDecrementModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => void decrementCards()} disabled={isDecrementing}>
              {isDecrementing ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
