"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconLayoutDashboard,
  IconUsersGroup,
  IconRefresh,
  IconBuildingBroadcastTower,
  IconDatabase,
  IconAlertTriangle,
  IconArrowRight,
  IconHeartbeat,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { relativeTimeGreek } from "@/lib/station-status"
import { api, type SyncStatus, type FinotProfile, type HealthStatus } from "@/lib/api"
import { useAdminAuth } from "@/lib/admin-auth"

const RUN_STATUS: Record<string, { label: string; cls: string }> = {
  running: { label: "Σε εξέλιξη", cls: "app-status-idle" },
  completed: { label: "Ολοκληρώθηκε", cls: "app-status-online" },
  failed: { label: "Απέτυχε", cls: "app-status-offline" },
}

export default function AdminOverviewPage() {
  const { errorMessage } = useAdminAuth()

  const [status, setStatus] = React.useState<SyncStatus | null>(null)
  const [profiles, setProfiles] = React.useState<FinotProfile[] | null>(null)
  const [health, setHealth] = React.useState<HealthStatus | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [s, p, h] = await Promise.all([
          api.getSyncStatus(),
          api.getProfiles(),
          api.health(),
        ])
        if (cancelled) return
        setStatus(s)
        setProfiles(p)
        setHealth(h)
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "Αποτυχία φόρτωσης δεδομένων"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [errorMessage])

  const latestRun = status?.latest_sync_run ?? null
  const runMeta = latestRun ? RUN_STATUS[latestRun.status] ?? { label: latestRun.status, cls: "app-status-idle" } : null
  const activeProfiles = profiles?.filter((p) => p.is_active).length ?? 0

  const stats = [
    { label: "Σταθμοί στη βάση", value: status?.stations_in_db },
    { label: "Μετρήσεις στη βάση", value: status?.readings_in_db },
    { label: "Πλήρως συγχρονισμένα", value: status?.entities_fully_synced },
    { label: "Σε εκκρεμότητα", value: status?.entities_pending },
  ]

  const sections = [
    {
      title: "Προφίλ FINoT",
      description: "Διαχείριση λογαριασμών FINoT: δημιουργία, επεξεργασία, έλεγχος σύνδεσης",
      href: "/admin/profiles",
      icon: IconUsersGroup,
      meta: profiles ? `${profiles.length} προφίλ · ${activeProfiles} ενεργά` : null,
    },
    {
      title: "Συγχρονισμός",
      description: "Εκκίνηση και παρακολούθηση συγχρονισμού δεδομένων ανά προφίλ",
      href: "/admin/sync",
      icon: IconRefresh,
      meta: latestRun
        ? `Τελευταία εκτέλεση ${relativeTimeGreek(latestRun.started_at)}`
        : "Καμία εκτέλεση ακόμη",
    },
    {
      title: "Σταθμοί",
      description: "Εποπτεία σταθμών, κατάστασης δεδομένων και προόδου συγχρονισμού",
      href: "/admin/stations",
      icon: IconBuildingBroadcastTower,
      meta: status ? `${status.stations_in_db} σταθμοί` : null,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={<IconLayoutDashboard className="size-5" />}
        title="Διαχείριση"
        subtitle="Επισκόπηση συστήματος: προφίλ FINoT, συγχρονισμός και σταθμοί"
        actions={
          health && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                health.status === "healthy" ? "app-status-online" : "app-status-offline"
              )}
            >
              <IconHeartbeat className="size-3.5" />
              {health.status === "healthy" ? "API λειτουργικό" : health.status}
            </span>
          )
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* DB stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            {loading ? (
              <Skeleton className="mt-1.5 h-7 w-20" />
            ) : (
              <p className="mt-0.5 font-display text-2xl tabular-nums text-foreground">
                {s.value === undefined ? "-" : s.value.toLocaleString("el-GR")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Latest run */}
      <Card className="app-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconDatabase className="size-4 text-primary" />
            Τελευταίος συγχρονισμός
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-6 w-64" />
          ) : latestRun && runMeta ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium", runMeta.cls)}>
                {runMeta.label}
              </span>
              <span className="text-muted-foreground">
                Έναρξη {relativeTimeGreek(latestRun.started_at)}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {latestRun.entities_synced?.toLocaleString("el-GR") ?? "-"} οντότητες ·{" "}
                {latestRun.records_synced?.toLocaleString("el-GR") ?? "-"} εγγραφές
              </span>
              {latestRun.error && (
                <span className="text-xs text-destructive" title={latestRun.error}>
                  Σφάλμα: {latestRun.error}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Δεν έχει εκτελεστεί συγχρονισμός ακόμη.</p>
          )}
        </CardContent>
      </Card>

      {/* Section links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.href} className="app-card flex flex-col border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <section.icon className="size-4 text-primary" />
                {section.title}
              </CardTitle>
              <CardDescription className="text-xs">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {loading ? <Skeleton className="h-4 w-24" /> : section.meta}
              </span>
              <Button asChild variant="outline" size="sm" className="gap-1 rounded-full">
                <Link href={section.href}>
                  Άνοιγμα
                  <IconArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
