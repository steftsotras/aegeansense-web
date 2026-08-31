"use client"

/**
 * Admin authentication context.
 *
 * The backend admin/control plane (/api/admin/*, /api/sync/*) requires a JWT
 * bearer token obtained from POST /api/admin/login. The token is kept in
 * localStorage (see lib/api/client.ts) and attached automatically by the API
 * client; this context tracks login state for the UI and handles expiry/401s.
 */

import * as React from "react"
import {
  api,
  ApiError,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  decodeAdminToken,
} from "@/lib/api"

interface AdminAuthContextValue {
  /** False until the token has been read from localStorage (avoids hydration flicker). */
  ready: boolean
  isAuthenticated: boolean
  /** Email of the logged-in admin, from the JWT payload. */
  email: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  /**
   * Turn a caught error into a display message. On 401 the session is also
   * cleared so the guard redirects to the login page.
   */
  errorMessage: (error: unknown, fallback: string) => string
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [email, setEmail] = React.useState<string | null>(null)

  // getAdminToken() drops expired tokens itself.
  React.useEffect(() => {
    const token = getAdminToken()
    setEmail(token ? decodeAdminToken(token)?.email ?? null : null)
    setReady(true)
  }, [])

  const login = React.useCallback(async (loginEmail: string, password: string) => {
    const res = await api.login(loginEmail, password)
    setAdminToken(res.access_token)
    setEmail(decodeAdminToken(res.access_token)?.email ?? loginEmail)
  }, [])

  const logout = React.useCallback(() => {
    clearAdminToken()
    setEmail(null)
  }, [])

  const errorMessage = React.useCallback(
    (error: unknown, fallback: string): string => {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return "Η συνεδρία έληξε. Συνδεθείτε ξανά."
      }
      if (error instanceof ApiError) {
        return error.detail || error.message
      }
      return error instanceof Error ? error.message : fallback
    },
    [logout]
  )

  const value = React.useMemo(
    () => ({ ready, isAuthenticated: email !== null, email, login, logout, errorMessage }),
    [ready, email, login, logout, errorMessage]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = React.useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return ctx
}
