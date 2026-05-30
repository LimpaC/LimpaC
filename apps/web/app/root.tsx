import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useNavigate,
} from "react-router"
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"
import {
  BarChart3,
  Building2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  House,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react"
import { AuthProvider, useAuth } from "~/lib/auth"

import type { Route } from "./+types/root"
import "./app.css"

type SidebarNavItem = {
  label: string
  to: string
  icon: LucideIcon
}

type SidebarSection = {
  label: string
  items: SidebarNavItem[]
}

const authRoutes = new Set(["/login", "/admin/login", "/register"])

const sidebarSections: SidebarSection[] = [
  {
    label: "Principal",
    items: [
      { label: "Dados", to: "/", icon: House },
      { label: "Dados Gerais", to: "/overall", icon: BarChart3 },
    ],
  },
  {
    label: "Calculadoras",
    items: [{ label: "Cartão Digital", to: "/cartao-digital", icon: CreditCard }],
  },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { activeOrganization, session, setActiveOrganizationId, createOrganization, logout } = useAuth()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isCreateOrganizationDialogOpen, setIsCreateOrganizationDialogOpen] = useState(false)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [organizationName, setOrganizationName] = useState("")
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false)
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 })

  const navItems = sidebarSections.flatMap((section) => section.items)
  const activeNavItem =
    navItems.find((item) =>
      item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
    ) ?? navItems[0]
  const activePageLabel =
    activeNavItem.to === "/" && activeOrganization
      ? `Dados ${activeOrganization.name}`
      : activeNavItem.label

  useEffect(() => {
    const updateIndicator = () => {
      const container = navContainerRef.current
      const activeItem = navItemRefs.current[activeNavItem.to]

      if (!container || !activeItem) {
        return
      }

      const containerRect = container.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      setIndicatorStyle({
        opacity: 1,
        width: "4px",
        height: "1rem",
        transform: `translate3d(0, ${itemRect.top - containerRect.top + (itemRect.height - 16) / 2}px, 0)`,
      })
    }

    updateIndicator()

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null

    if (resizeObserver) {
      if (navContainerRef.current) {
        resizeObserver.observe(navContainerRef.current)
      }

      const activeItem = navItemRefs.current[activeNavItem.to]
      if (activeItem) {
        resizeObserver.observe(activeItem)
      }
    }

    window.addEventListener("resize", updateIndicator)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [activeNavItem.to, isSidebarExpanded, location.pathname])

  const currentSection =
    sidebarSections.find((section) =>
      section.items.some((item) =>
        item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
      )
    ) ?? sidebarSections[0]

  const sidebarWidth = isSidebarExpanded ? "17.5rem" : "6rem"
  const isCalcRoute = activeNavItem.to === "/cartao-digital"

  const openCreateOrganizationDialog = () => {
    setOrganizationName("")
    setOrganizationError(null)
    setIsCreateOrganizationDialogOpen(true)
  }

  const handleCreateOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = organizationName.trim()

    if (!nextName) {
      setOrganizationError("Informe o nome da organização.")
      return
    }

    setIsCreatingOrganization(true)
    setOrganizationError(null)

    try {
      await createOrganization(nextName)
      setIsCreateOrganizationDialogOpen(false)
      setOrganizationName("")
    } catch (exception) {
      setOrganizationError(
        exception instanceof Error ? exception.message : "Não foi possível criar a organização."
      )
    } finally {
      setIsCreatingOrganization(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#fff8f7_0%,#fffdfc_38%,#f8fafc_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.15),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(15,23,42,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.7)_1px,transparent_1px)] [background-size:38px_38px]" />

      <aside
        className="fixed inset-y-0 left-0 z-20 flex min-h-screen shrink-0 flex-col overflow-hidden rounded-none border border-slate-200/70 border-l-0 bg-white/88 p-3 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.3)] backdrop-blur-xl transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-start justify-between gap-3 p-2">
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300 ease-out",
              isSidebarExpanded ? "max-w-[12rem] opacity-100" : "max-w-0 opacity-0"
            )}
          >
            <p className="font-heading text-base font-semibold text-slate-950">LimpaC</p>
            <p className="text-[11px] text-slate-500">Dashboard</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-slate-600"
            onClick={() => setIsSidebarExpanded((current) => !current)}
            aria-label={isSidebarExpanded ? "Recolher sidebar" : "Expandir sidebar"}
          >
            {isSidebarExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav ref={navContainerRef} className="relative mt-6 flex-1 space-y-5">
          {sidebarSections.map((section) => (
            <div key={section.label} className="space-y-2">
              <p
                className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 transition-opacity duration-300",
                  isSidebarExpanded ? "opacity-100" : "opacity-0"
                )}
              >
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon
                const active =
                  item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    ref={(node) => {
                      navItemRefs.current[item.to] = node
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-10 flex h-14 items-center rounded-2xl px-3 text-sm font-medium text-slate-600 transition-all duration-300 ease-out",
                      isSidebarExpanded ? "justify-start gap-3" : "justify-center"
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4 shrink-0 transition-colors", active && "text-slate-950")}
                    />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                        isSidebarExpanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}

          <div
            className="pointer-events-none absolute left-0 top-0 w-1 rounded-full bg-rose-500 transition-[transform,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={indicatorStyle}
          />
        </nav>
      </aside>

      <div
        className="relative min-h-[100dvh] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: sidebarWidth, width: `calc(100vw - ${sidebarWidth})` }}
      >
        <header className="flex h-16 items-center bg-white px-5 shadow-none">
          <div className="flex w-full items-center justify-between gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 gap-2 px-2 text-slate-700">
                        <Building2 className="h-4 w-4 text-rose-500" />
                        <span className="max-w-[12rem] truncate">
                          {activeOrganization?.name ?? "Sem organização"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-56">
                      {session?.organizations.map((organization) => (
                        <DropdownMenuItem
                          key={organization.id}
                          onSelect={() => setActiveOrganizationId(organization.id)}
                        >
                          {organization.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onSelect={openCreateOrganizationDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova organização
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={currentSection.items[0]?.to ?? "/"}>{currentSection.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activePageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isCalcRoute
                    ? "opacity-100 blur-0 translate-y-0 scale-100"
                    : "pointer-events-none opacity-0 blur-sm translate-y-1 scale-95"
                )}
                aria-hidden={!isCalcRoute}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-500"
                  aria-label="Ajuda"
                  onClick={() => setIsHelpDialogOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-600"
                      aria-label="Configurações"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem
                      onSelect={() => window.dispatchEvent(new CustomEvent("limpac:open-goal"))}
                    >
                      Ajustar meta
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => window.dispatchEvent(new CustomEvent("limpac:open-cards"))}
                    >
                      Editar cartões
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                className="text-slate-500"
                aria-label="Sair"
                onClick={() => void logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex min-h-[100dvh] flex-col px-4 py-6 sm:px-6 lg:px-8">
          <main className="min-w-0 flex-1 pb-6">{children}</main>
        </div>
      </div>

      <Dialog open={isCreateOrganizationDialogOpen} onOpenChange={setIsCreateOrganizationDialogOpen}>
        <DialogContent className="w-[92vw] max-w-lg rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <form onSubmit={handleCreateOrganization}>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-slate-950">
                Nova organização
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Crie uma organização para separar metas, cálculos e histórico no dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-2">
              <Label
                htmlFor="organization-name"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                Nome da organização
              </Label>
              <Input
                id="organization-name"
                autoFocus
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base font-medium text-slate-950 focus-visible:ring-rose-500"
              />
              {organizationError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {organizationError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl px-4 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsCreateOrganizationDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-2xl bg-rose-500 px-4 text-white hover:bg-rose-600"
                disabled={isCreatingOrganization}
              >
                {isCreatingOrganization ? "Criando..." : "Criar organização"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="w-[92vw] max-w-2xl rounded-[28px] border-white/70 bg-white/95 shadow-[0_30px_110px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-slate-950">
              Como funciona o Cartão Digital
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Os dados desta tela pertencem somente à organização selecionada no topo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              Registre a quantidade inicial de cartões digitais para gerar o primeiro cálculo de impacto.
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              Depois do primeiro registro, use “Editar cartões” para salvar a nova contagem final. O sistema guarda cada alteração no histórico.
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              A meta controla o progresso exibido no dashboard. O relatório usa o estado atual e os registros recentes da organização.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminShell({ children }: { children: ReactNode }) {
  const { logout, session } = useAuth()

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#fffdfc_42%,#fff8f7_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold text-slate-950">LimpaC Admin</p>
              <p className="truncate text-xs text-slate-500">{session?.user.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-500"
            aria-label="Sair"
            onClick={() => void logout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <main className="mx-auto min-w-0 max-w-[1500px] pb-6">{children}</main>
      </div>
    </div>
  )
}

function AuthGate({ children }: { children: ReactNode }) {
  const { session, isBootstrapping } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthRoute = authRoutes.has(location.pathname)
  const isProtectedAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login"

  useEffect(() => {
    if (isBootstrapping) return

    if (!session && !isAuthRoute) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true })
    }

    if (session && isAuthRoute) {
      navigate(session.user.role === "ADMIN" ? "/admin" : "/", { replace: true })
    }

    if (session?.user.role === "ADMIN" && !isAuthRoute && !isProtectedAdminRoute) {
      navigate("/admin", { replace: true })
    }

    if (session?.user.role === "USER" && isProtectedAdminRoute) {
      navigate("/", { replace: true })
    }
  }, [isAuthRoute, isBootstrapping, isProtectedAdminRoute, location.pathname, navigate, session])

  if (isBootstrapping) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[linear-gradient(180deg,#fff8f7_0%,#fffdfc_42%,#f8fafc_100%)] text-sm text-slate-500">
        Carregando
      </div>
    )
  }

  if (isAuthRoute) {
    return <>{children}</>
  }

  if (!session) {
    return null
  }

  if (session.user.role === "ADMIN") {
    return isProtectedAdminRoute ? <AdminShell>{children}</AdminShell> : null
  }

  if (isProtectedAdminRoute) {
    return null
  }

  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <Outlet />
      </AuthGate>
    </AuthProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
