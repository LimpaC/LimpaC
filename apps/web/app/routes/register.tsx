import { useState, type FormEvent, type ReactElement } from "react"
import { Link, useNavigate } from "react-router"
import { Building2, IdCard, LockKeyhole, Mail, UserRound } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useAuth } from "~/lib/auth"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    cnpj: "",
    password: "",
    organizationName: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await register(form)
      navigate("/", { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Não foi possível criar a conta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[linear-gradient(180deg,#fff8f7_0%,#fffdfc_40%,#f8fafc_100%)] px-4 py-10 text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.15),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.10),transparent_30%)]" />
      <section className="relative w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mb-8 space-y-2">
          <p className="font-heading text-2xl font-semibold text-slate-950">LimpaC</p>
          <h1 className="font-heading text-xl font-semibold text-slate-900">Criar conta</h1>
          <p className="text-sm leading-6 text-slate-500">Seu primeiro acesso já cria a organização inicial.</p>
        </div>

        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <AuthField icon={<UserRound />} label="Nome" value={form.name} onChange={(value) => updateField("name", value)} />
          <AuthField icon={<Mail />} label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
          <AuthField icon={<IdCard />} label="CNPJ" value={form.cnpj} onChange={(value) => updateField("cnpj", value)} />
          <AuthField icon={<Building2 />} label="Organização" value={form.organizationName} onChange={(value) => updateField("organizationName", value)} />
          <AuthField icon={<LockKeyhole />} label="Senha" type="password" value={form.password} onChange={(value) => updateField("password", value)} className="sm:col-span-2" />

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
              {error}
            </p>
          ) : null}

          <Button className="h-12 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 sm:col-span-2" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem acesso?{" "}
          <Link className="font-medium text-rose-600 hover:text-rose-700" to="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  )
}

function AuthField({
  icon,
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  icon: ReactElement
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  className?: string
}) {
  const id = label.toLowerCase()

  return (
    <div className={className}>
      <Label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Label>
      <div className="relative mt-2">
        <span className="absolute left-4 top-1/2 flex h-4 w-4 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          required
          minLength={type === "password" ? 8 : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 focus-visible:ring-rose-500"
        />
      </div>
    </div>
  )
}
