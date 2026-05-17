import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type OrganizationSummary = {
  id: string
  name: string
}

type AuthUser = {
  id: string
  name: string
  email: string
  cnpj: string
}

type AuthSession = {
  user: AuthUser
  organizations: OrganizationSummary[]
}

type RegisterPayload = {
  name: string
  email: string
  cnpj: string
  password: string
  organizationName: string
}

type AuthContextValue = {
  session: AuthSession | null
  isBootstrapping: boolean
  activeOrganizationId: string | null
  activeOrganization: OrganizationSummary | null
  setActiveOrganizationId: (organizationId: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  createOrganization: (name: string) => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
const ACTIVE_ORGANIZATION_KEY = "limpac_active_organization_id"
const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useAuth deve ser usado dentro do AuthContext.")
  }
  return value
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null)

  const resolveActiveOrganization = useCallback((organizations: OrganizationSummary[]) => {
    const stored =
      typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY)
    const next = organizations.some((organization) => organization.id === stored)
      ? stored
      : organizations[0]?.id ?? null

    setActiveOrganizationIdState(next)
    if (typeof window !== "undefined") {
      if (next) {
        window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, next)
      } else {
        window.localStorage.removeItem(ACTIVE_ORGANIZATION_KEY)
      }
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const response = await apiFetch("/auth/me")
    if (!response.ok) {
      setSession(null)
      resolveActiveOrganization([])
      return null
    }

    const data = (await response.json()) as AuthSession
    setSession(data)
    resolveActiveOrganization(data.organizations)
    return data
  }, [resolveActiveOrganization])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const response = await apiFetch("/auth/me")
        if (cancelled) return

        if (response.ok) {
          const data = (await response.json()) as AuthSession
          setSession(data)
          resolveActiveOrganization(data.organizations)
        } else {
          setSession(null)
          resolveActiveOrganization([])
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [resolveActiveOrganization])

  const setActiveOrganizationId = useCallback((organizationId: string) => {
    setActiveOrganizationIdState(organizationId)
    window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        throw new Error("Email ou senha inválidos.")
      }

      const data = (await response.json()) as AuthSession
      setSession(data)
      resolveActiveOrganization(data.organizations)
    },
    [resolveActiveOrganization]
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error("Não foi possível criar a conta.")
      }

      const data = (await response.json()) as AuthSession
      setSession(data)
      resolveActiveOrganization(data.organizations)
    },
    [resolveActiveOrganization]
  )

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" })
    setSession(null)
    resolveActiveOrganization([])
  }, [resolveActiveOrganization])

  const createOrganization = useCallback(
    async (name: string) => {
      const response = await apiFetch("/organizations", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        throw new Error("Não foi possível criar a organização.")
      }

      const created = (await response.json()) as OrganizationSummary
      const nextSession = await refreshSession()
      if (nextSession?.organizations.some((organization) => organization.id === created.id)) {
        setActiveOrganizationId(created.id)
      }
    },
    [refreshSession, setActiveOrganizationId]
  )

  const activeOrganization = useMemo(
    () =>
      session?.organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
    [activeOrganizationId, session?.organizations]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      activeOrganizationId,
      activeOrganization,
      setActiveOrganizationId,
      login,
      register,
      logout,
      createOrganization,
      refreshSession,
    }),
    [
      activeOrganization,
      activeOrganizationId,
      createOrganization,
      isBootstrapping,
      login,
      logout,
      refreshSession,
      register,
      session,
      setActiveOrganizationId,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
