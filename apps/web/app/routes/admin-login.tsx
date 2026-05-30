import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { LockKeyhole, Mail, Shield } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useAuth } from "~/lib/auth"

export default function AdminLogin() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("admin@edenred.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const session = await login(email, password)
      if (session.user.role !== "ADMIN") {
        await logout()
        throw new Error("Esta conta não possui acesso administrativo.")
      }
      navigate("/admin", { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Não foi possível entrar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#fffdfc_44%,#fff8f7_100%)] px-4 py-10 text-slate-950">
      <section className="relative w-full max-w-md rounded-[28px] border border-white/70 bg-white/92 p-7 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mb-8 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <p className="font-heading text-2xl font-semibold text-slate-950">LimpaC Admin</p>
          <h1 className="font-heading text-xl font-semibold text-slate-900">Entrar no painel Edenred</h1>
          <p className="text-sm leading-6 text-slate-500">Acesso somente para visualização dos dados consolidados.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 focus-visible:ring-slate-950"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Senha
            </Label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 focus-visible:ring-slate-950"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar como admin"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Conta de organização?{" "}
          <Link className="font-medium text-rose-600 hover:text-rose-700" to="/login">
            Voltar ao login
          </Link>
        </p>
      </section>
    </main>
  )
}
