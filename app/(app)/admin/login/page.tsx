"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconShieldLock, IconAlertTriangle } from "@tabler/icons-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ApiError } from "@/lib/api"
import { useAdminAuth } from "@/lib/admin-auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const { ready, isAuthenticated, login } = useAdminAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Already logged in - go straight to the admin overview.
  React.useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace("/admin")
    }
  }, [ready, isAuthenticated, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      router.replace("/admin")
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Λανθασμένο email ή κωδικός πρόσβασης.")
      } else if (err instanceof ApiError) {
        setError(err.detail || err.message)
      } else {
        setError("Αποτυχία σύνδεσης με τον διακομιστή.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className="flex min-h-[70vh] items-center justify-center">
      <Card className="app-card w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconShieldLock className="size-6" />
          </div>
          <CardTitle className="font-display text-xl">Σύνδεση Διαχειριστή</CardTitle>
          <CardDescription>
            Πρόσβαση στη διαχείριση προφίλ FINoT, συγχρονισμού και σταθμών
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Κωδικός πρόσβασης</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <IconAlertTriangle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting || !email || !password} className="gap-2">
              {submitting && <Spinner size="sm" />}
              Σύνδεση
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
