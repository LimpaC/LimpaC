import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
} from "react-router"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useTokenStore } from "./lib/store"
import { v4 as uuidv4 } from "uuid"
import { Button } from "~/components/ui/button"
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
import { cn } from "~/lib/utils"
import {
  CreditCard,
  House,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from "lucide-react"

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

const sidebarSections: SidebarSection[] = [
  {
    label: "Principal",
    items: [{ label: "Home", to: "/", icon: House }],
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 })

  const navItems = sidebarSections.flatMap((section) => section.items)
  const activeNavItem =
    navItems.find((item) =>
      item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
    ) ?? navItems[0]

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
              <p className="font-heading text-base font-semibold tracking-[-0.04em] text-slate-950">
                LimpaC
              </p>
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
                  <BreadcrumbLink asChild>
                    <Link to={currentSection.items[0]?.to ?? "/"}>
                      {currentSection.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeNavItem.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

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
          </div>
        </header>

        <div className="flex min-h-[100dvh] flex-col px-4 py-6 sm:px-6 lg:px-8">
          <main className="min-w-0 flex-1 pb-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { token, setToken } = useTokenStore()

  useEffect(() => {
    // Only generate a token if one doesn't exist and the store has hydrated
    if (useTokenStore.persist.hasHydrated() && !token) {
      setToken(uuidv4())
    }
  }, [token, setToken])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
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
