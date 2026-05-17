import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { LockKeyhole, Mail } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useAuth } from "~/lib/auth"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      navigate(searchParams.get("next") || "/", { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Não foi possível entrar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[linear-gradient(180deg,#fff8f7_0%,#fffdfc_40%,#f8fafc_100%)] px-4 py-10 text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.15),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.10),transparent_30%)]" />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mb-8 space-y-2">
          <p className="font-heading text-2xl font-semibold text-slate-950">LimpaC</p>
          <h1 className="font-heading text-xl font-semibold text-slate-900">Entrar no dashboard</h1>
          <p className="text-sm leading-6 text-slate-500">Acesse suas organizações e indicadores.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 focus-visible:ring-rose-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Senha
            </Label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 focus-visible:ring-rose-500"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button className="h-12 w-full rounded-2xl bg-rose-500 text-white hover:bg-rose-600" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link className="font-medium text-rose-600 hover:text-rose-700" to="/register">
            Criar acesso
          </Link>
        </p>
      </section>
    </main>
  )
}
