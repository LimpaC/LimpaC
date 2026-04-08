import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Progress } from "~/components/ui/progress"
import {
  CreditCard,
  Recycle,
  TreeDeciduous,
  Droplets,
  Zap,
  HelpCircle,
} from "lucide-react"

export default function Calcular() {
  const [cards, setCards] = useState<number>(350)
  const [displayCards, setDisplayCards] = useState<number>(350)

  const CO2_PER_CARD = 0.044
  const PLASTIC_PER_CARD = 0.00714
  const TREES_PER_CARD = 0.0342
  const WATER_PER_CARD = 12.857
  const ENERGY_PER_CARD = 0.514

  const co2Impact = (displayCards * CO2_PER_CARD).toFixed(1)
  const plasticSaved = (displayCards * PLASTIC_PER_CARD).toFixed(1)
  const treesPreserved = Math.round(displayCards * TREES_PER_CARD)
  const waterSaved = Math.round(displayCards * WATER_PER_CARD).toLocaleString(
    "pt-BR"
  )
  const energySaved = Math.round(displayCards * ENERGY_PER_CARD)

  const sustainabilityGoal = -8450
  const maxGoal = -13000
  const progress = (Math.abs(sustainabilityGoal) / Math.abs(maxGoal)) * 100

  const handleUpdate = () => {
    setDisplayCards(cards)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-[#0f172a]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-8">
        <div className="flex items-center gap-1 text-2xl font-bold text-rose-500">
          Limpa
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-500 text-[10px]">
            ©
          </span>
        </div>
        <nav className="hidden items-center gap-6 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-3 text-sm font-semibold text-slate-600"
          >
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-3 text-sm font-semibold text-slate-600"
          >
            Relatórios
          </Button>
          <Button className="h-9 bg-slate-200 px-6 text-sm font-bold text-slate-600 hover:bg-slate-300">
            ENTRAR
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-[44px] leading-[1.05] font-black tracking-tight text-[#0f172a]">
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
                <div className="space-y-2">
                  <Label
                    htmlFor="cards"
                    className="text-[11px] font-bold tracking-[0.05em] text-slate-500 uppercase"
                  >
                    Quantidade de cartões físicos utilizados
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="cards"
                      type="number"
                      value={cards}
                      onChange={(e) => setCards(Number(e.target.value))}
                      className="no-spinner h-12 border-slate-100 bg-slate-50/50 pl-12 text-lg font-bold focus-visible:ring-rose-500"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleUpdate}
                  className="h-12 w-full bg-rose-500 text-[11px] font-bold tracking-[0.05em] text-white uppercase shadow-none hover:bg-rose-600"
                >
                  Atualizar Economia
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid-row-2 grid gap-4 lg:grid-cols-2">
              {/* CO2 Card */}
              <Card className="border-slate-100 bg-white py-2! shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                      CO₂
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.05em] text-[#1e293b] uppercase">
                      Impacto de CO2
                    </span>
                  </div>
                  <div className="mt-4 space-y-0.5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase">
                      Redução Total
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[32px] font-black text-[#0f172a]">
                        {co2Impact}
                      </span>
                      <span className="text-xl font-bold text-[#0f172a]">
                        kg
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plastic Card */}
              <Card className="border-slate-100 bg-white shadow-none">
                <CardContent className="p-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50">
                      <Recycle className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.05em] text-[#1e293b] uppercase">
                      Economia de Plástico
                    </span>
                  </div>
                  <div className="mt-4 space-y-0.5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase">
                      Material Salvo
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[32px] font-black text-[#0f172a]">
                        {plasticSaved}
                      </span>
                      <span className="text-xl font-bold text-[#0f172a]">
                        kg
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environmental Equalities */}
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
                    <div className="space-y-0">
                      <p className="text-[32px] leading-none font-black text-[#0f172a]">
                        {treesPreserved}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Árvores preservadas
                      </p>
                    </div>
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
                    <div className="space-y-0">
                      <p className="text-[32px] leading-none font-black text-[#0f172a]">
                        {waterSaved}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        L economizados
                      </p>
                    </div>
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
                    <div className="space-y-0">
                      <p className="text-[32px] leading-none font-black text-[#0f172a]">
                        {energySaved}
                      </p>
                      <p className="text-[11px] text-slate-400">kWh poupados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Goal */}
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
                      <span className="text-[32px] font-black text-[#0f172a]">
                        {sustainabilityGoal.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[11px] font-bold text-[#0f172a]">
                        CO2e
                      </span>
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
                    <span>Meta: {maxGoal.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="h-12 w-full bg-rose-500 text-[11px] font-bold tracking-[0.05em] text-white uppercase shadow-none hover:bg-rose-600">
              Ver Relatório
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
