import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StationStatusBadge } from "@/components/station-status-badge"
import { PageShell, PageHeader } from "@/components/page-shell"
import { api, type Station } from "@/lib/api"
import { getStationActivity, relativeTimeGreek } from "@/lib/station-status"

async function fetchStations(): Promise<Station[]> {
  try {
    return await api.getStations({}, { next: { revalidate: 60 } })
  } catch (error) {
    console.error("Error fetching stations:", error)
    return []
  }
}

const typeLabels: Record<string, string> = {
  MicroclimateStation: "Μικροκλιματικός",
  WeatherStation: "Μετεωρολογικός",
  IndoorAirQuality: "Ποιότητα Αέρα",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stations = await fetchStations()

  const stationsByType = stations.reduce(
    (acc, station) => {
      if (!acc[station.type]) acc[station.type] = []
      acc[station.type].push(station)
      return acc
    },
    {} as Record<string, Station[]>
  )

  const activeCount = stations.filter(
    (s) => getStationActivity(s).status === "online"
  ).length

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        {/* Page Header */}
        <PageHeader
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          title="Πίνακας Ελέγχου"
          subtitle="Επισκόπηση σταθμών και δεδομένων δικτύου"
        />

        {/* Network summary */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Σταθμοί" value={stations.length} />
          <StatTile label="Ενεργοί" value={activeCount} total={stations.length} accent />
          {Object.entries(stationsByType).slice(0, 2).map(([type, list]) => (
            <StatTile
              key={type}
              label={typeLabels[type] || type.replace("Station", "").trim()}
              value={list.length}
            />
          ))}
        </div>

        {/* Stations Table */}
        <div>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 bg-muted/50 rounded-full p-1">
                <TabsTrigger value="all" className="rounded-full text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Όλοι ({stations.length})
                </TabsTrigger>
                {Object.keys(stationsByType).map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="rounded-full text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {typeLabels[type] || type.replace("Station", "").trim()} ({stationsByType[type].length})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <StationTable stations={stations} />
              </TabsContent>

              {Object.entries(stationsByType).map(([type, typeStations]) => (
                <TabsContent key={type} value={type} className="mt-0">
                  <StationTable stations={typeStations} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
      </div>
    </PageShell>
  )
}

function StatTile({
  label,
  value,
  total,
  accent,
}: {
  label: string
  value: number
  total?: number
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 flex items-baseline gap-1.5 font-display text-2xl tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
        {total !== undefined && (
          <span className="text-xs font-normal text-muted-foreground">/ {total}</span>
        )}
      </p>
    </div>
  )
}

function StationTable({ stations }: { stations: Station[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Σταθμός</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Τύπος</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Κατάσταση</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Τελ. Ενημέρωση</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station) => (
            <TableRow key={station.id} className="border-border/30 hover:bg-primary/[0.03] transition-colors">
              <TableCell>
                <Link href={`/dashboard/${station.id}`} className="flex flex-col group">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {station.name || station.product_id || station.serial_number || "Άγνωστος"}
                  </div>
                  {station.serial_number && (
                    <div className="text-[11px] text-muted-foreground font-mono">
                      SN: {station.serial_number}
                    </div>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-full text-[10px] border-primary/15 px-2.5">
                  {typeLabels[station.type] || station.type.replace("Station", "").trim()}
                </Badge>
              </TableCell>
              <TableCell>
                <StationStatusBadge station={station} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-foreground tabular-nums">
                    {station.last_seen
                      ? new Date(station.last_seen).toLocaleString("el-GR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                  {station.last_seen && (
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTimeGreek(station.last_seen)}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
