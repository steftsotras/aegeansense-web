"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBuildingBroadcastTower,
  IconAlertTriangle,
  IconCircleFilled,
  IconExternalLink,
  IconReload,
  IconSearch,
  IconMapPin,
  IconMapPinOff,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getStationActivity, relativeTimeGreek, type ActivityStatus } from "@/lib/station-status"
import { api, type Station, type SyncProgress } from "@/lib/api"
import { useAdminAuth } from "@/lib/admin-auth"

const TYPE_LABELS: Record<string, string> = {
  WeatherStation: "Μετεωρολογικός",
  MicroclimateStation: "Μικροκλιματικός",
  IndoorAirQuality: "Ποιότητα Αέρα",
}

const ACTIVITY_CLS: Record<ActivityStatus, string> = {
  online: "text-emerald-500",
  idle: "text-amber-500",
  offline: "text-rose-500",
}

const ALL = "all"

interface StationRow {
  station: Station
  activity: ReturnType<typeof getStationActivity>
  progress: SyncProgress | null
}

export default function AdminStationsPage() {
  const { errorMessage } = useAdminAuth()

  const [stations, setStations] = React.useState<Station[] | null>(null)
  const [progress, setProgress] = React.useState<Map<string, SyncProgress>>(new Map())
  const [error, setError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState(ALL)
  const [statusFilter, setStatusFilter] = React.useState(ALL)

  const refresh = React.useCallback(async () => {
    try {
      const [stationList, prog] = await Promise.all([
        api.getStations(),
        api.getSyncProgress(),
      ])
      setStations(stationList)
      setProgress(new Map(prog.entities.map((p) => [p.entity_id, p])))
      setError(null)
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία φόρτωσης σταθμών"))
    }
  }, [errorMessage])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const rows: StationRow[] = React.useMemo(() => {
    if (!stations) return []
    return stations.map((station) => ({
      station,
      activity: getStationActivity(station),
      progress: progress.get(station.id) ?? null,
    }))
  }, [stations, progress])

  const types = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.station.type))).sort(),
    [rows]
  )

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(({ station, activity }) => {
      if (typeFilter !== ALL && station.type !== typeFilter) return false
      if (statusFilter !== ALL && activity.status !== statusFilter) return false
      if (!q) return true
      return [station.name, station.id, station.serial_number, station.product_id]
        .some((field) => field?.toLowerCase().includes(q))
    })
  }, [rows, search, typeFilter, statusFilter])

  const counts = React.useMemo(() => {
    const c = { online: 0, idle: 0, offline: 0 }
    rows.forEach((r) => c[r.activity.status]++)
    return c
  }, [rows])

  const summary = [
    { label: "Σύνολο", value: rows.length, cls: "" },
    { label: "Ενεργοί", value: counts.online, cls: "text-emerald-500" },
    { label: "Αδρανείς", value: counts.idle, cls: "text-amber-500" },
    { label: "Ανενεργοί", value: counts.offline, cls: "text-rose-500" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={<IconBuildingBroadcastTower className="size-5" />}
        title="Σταθμοί"
        subtitle="Εποπτεία σταθμών, δραστηριότητας και κατάστασης συγχρονισμού δεδομένων"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={refresh}>
            <IconReload className="size-4" />
            Ανανέωση
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={cn("mt-0.5 font-display text-2xl tabular-nums", s.cls || "text-foreground")}>
              {stations === null ? "-" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Αναζήτηση ονόματος, ID, σειριακού…"
            className="w-72 pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Όλοι οι τύποι</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Κάθε κατάσταση</SelectItem>
            <SelectItem value="online">Ενεργοί</SelectItem>
            <SelectItem value="idle">Αδρανείς</SelectItem>
            <SelectItem value="offline">Ανενεργοί</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {stations !== null && `${filtered.length} από ${rows.length} σταθμούς`}
        </span>
      </div>

      {/* Table */}
      <Card className="app-card border-border/50">
        <CardContent className="pt-6">
          {stations === null ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Δεν βρέθηκαν σταθμοί με τα τρέχοντα φίλτρα.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Σταθμός</TableHead>
                    <TableHead>Τύπος</TableHead>
                    <TableHead>Δραστηριότητα</TableHead>
                    <TableHead>Τελευταία μέτρηση</TableHead>
                    <TableHead>Συγχρονίστηκε</TableHead>
                    <TableHead className="text-right">Εγγραφές</TableHead>
                    <TableHead>Πρόοδος</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(({ station, activity, progress: prog }) => (
                    <TableRow key={station.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 font-medium">
                            {station.name || station.product_id || station.serial_number || "Άγνωστος"}
                            {station.latitude != null && station.longitude != null ? (
                              <IconMapPin className="size-3.5 text-muted-foreground" title="Έχει συντεταγμένες" />
                            ) : (
                              <IconMapPinOff className="size-3.5 text-amber-500" title="Χωρίς συντεταγμένες" />
                            )}
                          </span>
                          <span className="max-w-64 truncate font-mono text-[10px] text-muted-foreground" title={station.id}>
                            {station.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {TYPE_LABELS[station.type] ?? station.type}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs">
                          <IconCircleFilled className={cn("size-2", ACTIVITY_CLS[activity.status])} />
                          {activity.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {relativeTimeGreek(station.last_seen)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {relativeTimeGreek(station.synced_at)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {prog ? prog.total_records.toLocaleString("el-GR") : "-"}
                      </TableCell>
                      <TableCell>
                        {prog ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                              prog.error
                                ? "app-status-offline"
                                : prog.is_complete
                                  ? "app-status-online"
                                  : "app-status-idle"
                            )}
                            title={
                              prog.error ??
                              (prog.last_synced_to
                                ? `Συγχρονισμένο έως ${new Date(prog.last_synced_to).toLocaleString("el-GR")}`
                                : undefined)
                            }
                          >
                            {prog.error ? "Σφάλμα" : prog.is_complete ? "Πλήρης" : "Σε εξέλιξη"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                            <Link href={`/dashboard/${station.id}`}>
                              Προβολή
                              <IconExternalLink className="size-3" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
