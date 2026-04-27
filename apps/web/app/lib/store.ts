import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { createTokenCookie, normalizePersistedTokenValue, readTokenFromCookie } from "./token-cookie"

interface TokenState {
  token: string | null
  setToken: (token: string) => void
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: "device_token",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof document === "undefined") return null
          return readTokenFromCookie(document.cookie, name)
        },
        setItem: (name, value) => {
          const tokenToStore = normalizePersistedTokenValue(value)
          document.cookie = createTokenCookie(name, tokenToStore)
        },
        removeItem: (name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        },
      })),
    }
  )
)
