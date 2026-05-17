import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import { BarChart3, Banknote, CreditCard, Droplets, Leaf } from "lucide-react"
import { Card, CardContent } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { apiFetch } from "~/lib/auth"

type CalculationResult = {
  cards: number
  co2Impact: number
  waterSaved: number
  moneySaved: number
}

type OrganizationOverview = {
  id: string
  name: string
  latestCalculation: CalculationResult | null
  progressPct: number
}

type OverallDashboard = {
  totalCards: number
  totalCo2Impact: number
  totalWaterSaved: number
  totalEnergySaved: number
  totalMoneySaved: number
  organizations: OrganizationOverview[]
}

const moneyFormat = { style: "currency", currency: "BRL" } as const
type NumberFlowFormat = NonNullable<ComponentProps<typeof NumberFlow>["format"]>

export default function Overall() {
  const [data, setData] = useState<OverallDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOverall() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiFetch("/organizations/overall")
        if (!response.ok) throw new Error()
        const nextData = (await response.json()) as OverallDashboard
        if (!cancelled) setData(nextData)
      } catch {
        if (!cancelled) setError("Não foi possível carregar a visão geral.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadOverall()
    return () => {
      cancelled = true
    }
  }, [])

  const maxCards = Math.max(1, ...(data?.organizations.map((org) => org.latestCalculation?.cards ?? 0) ?? [0]))

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Visão geral</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Dados Gerais</h1>
      </section>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CreditCard />} label="Cartões" value={data?.totalCards ?? 0} loading={isLoading} />
        <Metric icon={<Banknote />} label="Economia" value={data?.totalMoneySaved ?? 0} format={moneyFormat} loading={isLoading} />
        <Metric icon={<Droplets />} label="Água" value={data?.totalWaterSaved ?? 0} suffix=" L" loading={isLoading} />
        <Metric icon={<Leaf />} label="CO2" value={data?.totalCo2Impact ?? 0} suffix=" kg" decimals={2} loading={isLoading} />
      </section>

      <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.26)] backdrop-blur-xl">
        <CardContent className="space-y-5 p-6 sm:px-7 sm:py-1">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-rose-500" />
            <h2 className="font-heading text-xl font-semibold text-slate-950">Comparativo</h2>
          </div>
          <div className="space-y-3">
            {data?.organizations.map((organization) => {
              const cards = organization.latestCalculation?.cards ?? 0
              return (
                <div key={organization.id} className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.45fr)_auto] sm:items-center">
                  <span className="truncate font-medium text-slate-900">{organization.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${(cards / maxCards) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums text-slate-600">{cards.toLocaleString("pt-BR")} cartões</span>
                </div>
              )
            })}
            {data?.organizations.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">Nenhuma organização cadastrada.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  suffix,
  format,
  decimals = 0,
  loading,
}: {
  icon: ReactNode
  label: string
  value: number
  suffix?: string
  format?: NumberFlowFormat
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
            <NumberFlow value={value} locales="pt-BR" format={format ?? { maximumFractionDigits: decimals }} suffix={suffix} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
