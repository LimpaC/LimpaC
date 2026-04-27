import { expect, test } from "bun:test"
import {
  createTokenCookie,
  normalizePersistedTokenValue,
  readTokenFromCookie,
} from "./token-cookie"

test("readTokenFromCookie extrai o token de um cookie JSON", () => {
  const cookieValue = encodeURIComponent(JSON.stringify({ state: { token: "abc-123" } }))
  const cookie = `other=dark; device_token=${cookieValue}; theme=light`

  expect(readTokenFromCookie(cookie)).toBe("abc-123")
})

test("normalizePersistedTokenValue mantem o valor quando nao e JSON", () => {
  expect(normalizePersistedTokenValue("plain-token")).toBe("plain-token")
})

test("createTokenCookie gera um cookie para a sessao do usuario", () => {
  const cookie = createTokenCookie("device_token", "abc-123", 2, new Date("2026-04-27T00:00:00Z"))

  expect(cookie).toContain("device_token=abc-123")
  expect(cookie).toContain("path=/")
  expect(cookie).toContain("SameSite=Lax")
  expect(cookie).toContain("expires=")
})
