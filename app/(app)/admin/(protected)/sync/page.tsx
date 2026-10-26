"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconRefresh,
  IconDatabase,
  IconPlugConnected,
  IconBolt,
  IconReload,
  IconCircleCheck,
  IconAlertTriangle,
  IconBuildingBroadcastTower,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { relativeTimeGreek } from "@/lib/station-status"
import { api, type SyncStatus, type SyncRunInfo, type FinotProfile } from "@/lib/api"
import { useAdminAuth } from "@/lib/admin-auth"

type RunStatus = "running" | "completed" | "failed"

const RUN_STATUS: Record<RunStatus, { label: string; cls: string }> = {
  running: { label: "Σε εξέλιξη", cls: "app-status-idle" },
  completed: { label: "Ολοκληρώθηκε", cls: "app-status-online" },
  failed: { label: "Απέτυχε", cls: "app-status-offline" },
}

const ALL_PROFILES = "all"

function fmtDateTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("el-GR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminSyncPage() {
  const { errorMessage } = useAdminAuth()

  const [profiles, setProfiles] = React.useState<FinotProfile[]>([])
  const [profilesLoaded, setProfilesLoaded] = React.useState(false)
  // Which profile the stats are scoped to; actions need a concrete profile.
  const [selectedId, setSelectedId] = React.useState<string>(ALL_PROFILES)

  const [status, setStatus] = React.useState<SyncStatus | null>(null)
  const [runs, setRuns] = React.useState<SyncRunInfo[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const [starting, setStarting] = React.useState(false)
  const [syncingStations, setSyncingStations] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [actionMsg, setActionMsg] = React.useState<string | null>(null)
  const [conn, setConn] = React.useState<{ configured: boolean; success?: boolean; error?: string } | null>(null)
  const scopeVersion = React.useRef(0)

  function selectProfile(value: string) {
    scopeVersion.current += 1
    setSelectedId(value)
    setStatus(null)
    setConn(null)
    setActionMsg(null)
    setError(null)
  }

  const isRunning = status?.sync_running ?? status?.latest_sync_run?.status === "running"
  const activeProfiles = profiles.filter((p) => p.is_active)
  const selectedProfile =
    selectedId === ALL_PROFILES ? null : activeProfiles.find((p) => String(p.id) === selectedId) ?? null

  // Load profiles once; preselect when there is exactly one active profile.
  React.useEffect(() => {
    let cancelled = false
    api
      .getProfiles()
      .then((list) => {
        if (cancelled) return
        setProfiles(list)
        const active = list.filter((p) => p.is_active)
        if (active.length === 1) setSelectedId(String(active[0].id))
      })
      .catch((e) => !cancelled && setError(errorMessage(e, "Αποτυχία φόρτωσης προφίλ")))
      .finally(() => !cancelled && setProfilesLoaded(true))
    return () => {
      cancelled = true
    }
  }, [errorMessage])

  const refresh = React.useCallback(async () => {
    const version = scopeVersion.current
    try {
      const profileId = selectedId === ALL_PROFILES ? undefined : Number(selectedId)
      const [s, r] = await Promise.all([api.getSyncStatus(profileId), api.getSyncRuns(8)])
      if (version !== scopeVersion.current) return
      setStatus(s)
      setRuns(r)
      setError(null)
    } catch (e) {
      if (version !== scopeVersion.current) return
      setError(errorMessage(e, "Αποτυχία ανάκτησης κατάστασης συγχρονισμού"))
    }
  }, [selectedId, errorMessage])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  // Poll while a sync is running
  React.useEffect(() => {
    if (!isRunning) return
    const id = setInterval(refresh, 4000)
    return () => clearInterval(id)
  }, [isRunning, refresh])

  async function handleStart(forceFull: boolean) {
    if (!selectedProfile) return
    if (forceFull && !window.confirm(
      `Ο πλήρης επανασυγχρονισμός του προφίλ «${selectedProfile.name}» θα ανακτήσει εκ νέου όλα τα ιστορικά δεδομένα και μπορεί να διαρκέσει αρκετή ώρα. Συνέχεια;`
    )) return

    setStarting(true)
    setActionMsg(null)
    try {
      const res = await api.startSync(selectedProfile.id, forceFull)
      setActionMsg(
        res.status === "already_running"
          ? "Υπάρχει ήδη συγχρονισμός σε εξέλιξη."
          : `Ο συγχρονισμός του προφίλ «${selectedProfile.name}» ξεκίνησε στο παρασκήνιο.`
      )
      await refresh()
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία έναρξης συγχρονισμού"))
    } finally {
      setStarting(false)
    }
  }

  async function handleStationsOnly() {
    if (!selectedProfile) return
    setSyncingStations(true)
    setActionMsg(null)
    try {
      const res = await api.syncStationsOnly(selectedProfile.id)
      setActionMsg(`Συγχρονίστηκαν ${res.stations_synced} σταθμοί.`)
      await refresh()
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία συγχρονισμού σταθμών"))
    } finally {
      setSyncingStations(false)
    }
  }

  async function handleTest() {
    if (!selectedProfile) return
    const version = scopeVersion.current
    setTesting(true)
    setConn(null)
    try {
      const result = await api.testConnection(selectedProfile.id)
      if (version === scopeVersion.current) setConn(result)
    } catch (e) {
      const message = errorMessage(e, "Αποτυχία ελέγχου")
      if (version === scopeVersion.current) setConn({ configured: false, error: message })
    } finally {
      setTesting(false)
    }
  }

  const stats = [
    { label: "Σταθμοί στη βάση", value: status?.stations_in_db },
    { label: "Μετρήσεις στη βάση", value: status?.readings_in_db },
    { label: "Πλήρως συγχρονισμένα", value: status?.entities_fully_synced },
    { label: "Σε εκκρεμότητα", value: status?.entities_pending },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={<IconRefresh className="size-5" />}
        title="Συγχρονισμός"
        subtitle="Εκκίνηση και παρακολούθηση συγχρονισμού δεδομένων από το FINoT ανά προφίλ"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={refresh}>
            <IconReload className="size-4" />
            Ανανέωση
          </Button>
        }
      />

      {/* Profile scope selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Προφίλ FINoT:</span>
        <Select value={selectedId} onValueChange={selectProfile}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROFILES}>Όλα τα προφίλ (μόνο προβολή)</SelectItem>
            {activeProfiles.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {profilesLoaded && activeProfiles.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Δεν υπάρχουν ενεργά προφίλ. {" "}
            <Link href="/admin/profiles" className="text-primary underline-offset-2 hover:underline">
              δημιουργήστε ένα
            </Link>{" "}
            για να εκτελέσετε συγχρονισμό.
          </span>
        )}
      </div>

      {/* Running banner */}
      {isRunning && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Spinner size="sm" className="text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Συγχρονισμός σε εξέλιξη…</span>
            <span className="text-xs text-muted-foreground">
              Έναρξη {relativeTimeGreek(status?.latest_sync_run?.started_at ?? null)} · η σελίδα ενημερώνεται αυτόματα
            </span>
          </div>
        </div>
      )}

      {/* Action result / errors */}
      {actionMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <IconCircleCheck className="size-4 text-primary" />
          {actionMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* Stats (scoped to the selected profile) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 font-display text-2xl tabular-nums text-foreground">
              {s.value === undefined ? "-" : s.value.toLocaleString("el-GR")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Actions */}
        <Card className="app-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconBolt className="size-4 text-primary" />
              Ενέργειες
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedProfile
                ? `Συγχρονισμός δεδομένων για το προφίλ «${selectedProfile.name}»`
                : "Επιλέξτε συγκεκριμένο προφίλ για να εκτελέσετε ενέργειες"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Button
              onClick={() => handleStart(false)}
              disabled={!selectedProfile || starting || isRunning}
              className="justify-start gap-2"
            >
              {starting ? <Spinner size="sm" /> : <IconRefresh className="size-4" />}
              Έναρξη συγχρονισμού
            </Button>
            <Button
              onClick={() => handleStart(true)}
              disabled={!selectedProfile || starting || isRunning}
              variant="outline"
              className="justify-start gap-2"
            >
              <IconReload className="size-4" />
              Πλήρης επανασυγχρονισμός
            </Button>
            <Button
              onClick={handleStationsOnly}
              disabled={!selectedProfile || syncingStations || isRunning}
              variant="ghost"
              className="justify-start gap-2"
            >
              {syncingStations ? <Spinner size="sm" /> : <IconBuildingBroadcastTower className="size-4" />}
              Συγχρονισμός μόνο σταθμών
            </Button>
          </CardContent>
        </Card>

        {/* Connection */}
        <Card className="app-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconPlugConnected className="size-4 text-primary" />
              Σύνδεση FINoT
            </CardTitle>
            <CardDescription className="text-xs">
              Έλεγχος διαθεσιμότητας της εξωτερικής υπηρεσίας για το επιλεγμένο προφίλ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={handleTest}
              disabled={!selectedProfile || testing}
              variant="outline"
              className="w-fit gap-2"
            >
              {testing ? <Spinner size="sm" /> : <IconPlugConnected className="size-4" />}
              Έλεγχος σύνδεσης
            </Button>
            {conn && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  conn.success && conn.configured
                    ? "border-primary/20 bg-primary/5 text-foreground"
                    : "border-destructive/30 bg-destructive/5 text-destructive"
                )}
              >
                {conn.success && conn.configured ? (
                  <IconCircleCheck className="size-4 text-primary" />
                ) : (
                  <IconAlertTriangle className="size-4" />
                )}
                {conn.error || (!conn.configured
                  ? "Δεν έχουν ρυθμιστεί τα διαπιστευτήρια FINoT."
                  : conn.success
                    ? "Επιτυχής σύνδεση με το FINoT."
                    : "Αποτυχία σύνδεσης.")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="app-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconDatabase className="size-4 text-primary" />
            Πρόσφατες εκτελέσεις
          </CardTitle>
          <CardDescription className="text-xs">Όλα τα προφίλ</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν καταγεγραμμένες εκτελέσεις.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-semibold">Κατάσταση</th>
                    <th className="pb-2 font-semibold">Έναρξη</th>
                    <th className="pb-2 font-semibold">Ολοκλήρωση</th>
                    <th className="pb-2 text-right font-semibold">Οντότητες</th>
                    <th className="pb-2 text-right font-semibold">Εγγραφές</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const meta = RUN_STATUS[run.status as RunStatus] ?? { label: run.status, cls: "app-status-idle" }
                    return (
                      <tr key={run.id} className="border-b border-border/30 last:border-0">
                        <td className="py-2">
                          <span className={cn("inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-medium", meta.cls)}>
                            {meta.label}
                          </span>
                          {run.error && (
                            <span className="ml-2 text-[10px] text-destructive" title={run.error}>!</span>
                          )}
                        </td>
                        <td className="py-2 text-xs tabular-nums text-muted-foreground">{fmtDateTime(run.started_at)}</td>
                        <td className="py-2 text-xs tabular-nums text-muted-foreground">{fmtDateTime(run.completed_at)}</td>
                        <td className="py-2 text-right tabular-nums">{run.entities_synced?.toLocaleString("el-GR") ?? "-"}</td>
                        <td className="py-2 text-right tabular-nums">{run.records_synced?.toLocaleString("el-GR") ?? "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
