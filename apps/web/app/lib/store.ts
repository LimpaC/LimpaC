import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"

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
          const nameEQ = name + "="
          const ca = document.cookie.split(";")
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i]
            while (c.charAt(0) === " ") c = c.substring(1, c.length)
            if (c.indexOf(nameEQ) === 0) {
              return decodeURIComponent(c.substring(nameEQ.length, c.length))
            }
          }
          return null
        },
        setItem: (name, value) => {
          const date = new Date()
          date.setFullYear(date.getFullYear() + 100)
          
          let tokenToStore = value
          try {
            const parsed = JSON.parse(value)
            if (parsed && parsed.state && parsed.state.token) {
              tokenToStore = parsed.state.token
            }
          } catch (e) {
          }

          document.cookie = `${name}=${encodeURIComponent(
            tokenToStore
          )}; expires=${date.toUTCString()}; path=/; SameSite=Lax`
        },
        removeItem: (name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        },
      })),
    }
  )
)
