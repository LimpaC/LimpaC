const DEFAULT_COOKIE_NAME = "device_token"

export function normalizePersistedTokenValue(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object" && parsed.state?.token) {
      return parsed.state.token
    }
  } catch {
    // Keep the original cookie payload when it is not a persisted JSON blob.
  }

  return value
}

export function readTokenFromCookie(cookie: string, name = DEFAULT_COOKIE_NAME) {
  const cookieName = `${name}=`

  for (const entry of cookie.split(";")) {
    const trimmed = entry.trim()
    if (!trimmed.startsWith(cookieName)) continue

    const rawValue = trimmed.slice(cookieName.length)
    return normalizePersistedTokenValue(decodeURIComponent(rawValue))
  }

  return null
}

export function createTokenCookie(
  name: string,
  tokenValue: string,
  yearsToExpire = 100,
  now = new Date()
) {
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + yearsToExpire)

  return `${name}=${encodeURIComponent(tokenValue)}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax`
}
