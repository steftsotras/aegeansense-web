import { Button } from "@/components/ui/button"
import { StationMap } from "@/components/station-map"
import { api, type Station } from "@/lib/api"
import { getStationActivity, relativeTimeGreek } from "@/lib/station-status"
import Link from "next/link"
import Image from "next/image"
import {
  IconTemperature,
  IconCloudRain,
  IconBuildingFactory,
  IconSnowflake,
  IconVirus,
  IconDropletFilled,
  IconChartHistogram,
  IconArrowRight,
} from "@tabler/icons-react"

async function fetchStations(): Promise<Station[]> {
  try {
    return await api.getStations({}, { next: { revalidate: 60 } })
  } catch (error) {
    console.error("Error fetching stations:", error)
    return []
  }
}

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  MicroclimateStation: { label: "Μικροκλιματικοί", icon: IconTemperature },
  WeatherStation: { label: "Μετεωρολογικοί", icon: IconCloudRain },
  IndoorAirQuality: { label: "Ποιότητα Αέρα", icon: IconBuildingFactory },
}

// Platform capabilities, mapped to the agricultural scenarios of thesis ch. 5.
const capabilities = [
  {
    icon: IconChartHistogram,
    title: "Παρακολούθηση μικροκλίματος",
    description:
      "Χρονοσειρές θερμοκρασίας, υγρασίας, ανέμου και εδάφους ανά σταθμό, σε όλο το εύρος των τοποθεσιών του δικτύου.",
    status: "available" as const,
  },
  {
    icon: IconSnowflake,
    title: "Έγκαιρη προειδοποίηση παγετού",
    description:
      "Εντοπισμός επικίνδυνων συνδυασμών θερμοκρασίας και σημείου δρόσου για ευαίσθητες καλλιέργειες.",
    status: "planned" as const,
  },
  {
    icon: IconVirus,
    title: "Πρόβλεψη ασθενειών",
    description:
      "Δείκτες κινδύνου περονόσπορου & ωιδίου από θερμοκρασία, υγρασία και διαβροχή φύλλου (κανόνας 3–10).",
    status: "planned" as const,
  },
  {
    icon: IconDropletFilled,
    title: "Βελτιστοποίηση άρδευσης",
    description:
      "Υπολογισμός εξατμισοδιαπνοής αναφοράς (ET₀) για στοχευμένο πότισμα και εξοικονόμηση νερού.",
    status: "planned" as const,
  },
]

export default async function Home() {
  const stations = await fetchStations()
  const stationsWithLocation = stations.filter(
    (s) => s.latitude !== null && s.longitude !== null
  )

  const activeCount = stations.filter(
    (s) => getStationActivity(s).status === "online"
  ).length

  const typeCounts = stations.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const lastUpdate = stations.reduce<string | null>((latest, s) => {
    if (!s.last_seen) return latest
    if (!latest || new Date(s.last_seen) > new Date(latest)) return s.last_seen
    return latest
  }, null)

  return (
    <main className="relative min-h-screen bg-background">
      <div className="absolute inset-0 app-dots pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-aegean.png"
                alt="Πανεπιστήμιο Αιγαίου"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                ΠΑΝΕΠΙΣΤΗΜΙΟ ΑΙΓΑΙΟΥ
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Image
                src="/logo-aegeansense-symbol.png"
                alt="Λογότυπο AegeanSense"
                width={72}
                height={72}
                className="size-16 shrink-0 object-contain md:size-[4.5rem]"
                priority
              />
              <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
                AegeanSense
              </h1>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Δεδομένα σε πραγματικό χρόνο από κλιματικούς σταθμούς σε όλο
              το Αιγαίο, με διαδραστικά γραφήματα χρονοσειρών για την έρευνα
              και τη γεωργία ακριβείας.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-6">
                  Πίνακας Ελέγχου
                  <IconArrowRight className="ml-1.5 size-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="rounded-full px-6">
                  Σχετικά
                </Button>
              </Link>
            </div>
            <div className="pt-2">
              <Image
                src="/ellada-2.0-logo_gr.png"
                alt="Ελλάδα 2.0 - Εθνικό Σχέδιο Ανάκαμψης και Ανθεκτικότητας"
                width={240}
                height={89}
                className="h-auto w-44 md:w-52"
                priority
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Χάρτης Σταθμών</h2>
              <p className="text-xs text-muted-foreground">
                {stationsWithLocation.length} με τοποθεσία
              </p>
            </div>
            <StationMap stations={stations} showCard={false} height="420px" frameless />
          </div>
        </section>

        {/* ── Live network KPIs ────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="ΣΤΑΘΜΟΙ" value={String(stations.length)} />
          <StatCard
            label="ΕΝΕΡΓΟΙ ΤΩΡΑ"
            value={String(activeCount)}
            sub={`/ ${stations.length}`}
            accent
          />
          <StatCard label="ΚΑΤΗΓΟΡΙΕΣ" value={String(Object.keys(typeCounts).length)} />
          <StatCard
            label="ΤΕΛ. ΕΝΗΜΕΡΩΣΗ"
            value={lastUpdate ? relativeTimeGreek(lastUpdate) : "-"}
            small
          />
        </section>

        {/* ── Station categories ───────────────────────────────── */}
        {Object.keys(typeCounts).length > 0 && (
          <section className="mt-4 flex flex-wrap gap-3">
            {Object.entries(typeCounts).map(([type, count]) => {
              const cfg = typeConfig[type] || { label: type, icon: IconCloudRain }
              const Icon = cfg.icon
              return (
                <Link
                  key={type}
                  href="/dashboard"
                  className="app-card group flex items-center gap-2.5 rounded-full border border-border/50 bg-card/60 px-4 py-2 backdrop-blur-sm"
                >
                  <Icon className="size-4 text-primary" />
                  <span className="text-sm text-foreground">{cfg.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                </Link>
              )
            })}
          </section>
        )}

        {/* ── Capabilities / scenarios ─────────────────────────── */}
        <section className="mt-16">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-display text-2xl tracking-tight text-foreground">
              Από την παρατήρηση στην υποστήριξη αποφάσεων
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Οι ίδιες χρονοσειρές που συλλέγει το δίκτυο τροφοδοτούν σενάρια
              γεωργίας ακριβείας, από την παρακολούθηση του μικροκλίματος έως
              μελλοντικά εργαλεία πρόληψης και βελτιστοποίησης.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div
                  key={cap.title}
                  className="app-card flex flex-col gap-3 rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{cap.title}</h3>
                  <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                    {cap.description}
                  </p>
                  <span
                    className={
                      cap.status === "available"
                        ? "app-status-online inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
                        : "app-status-idle inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
                    }
                  >
                    {cap.status === "available" ? "Διαθέσιμο" : "Σχεδιαζόμενο"}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-aegean.png"
              alt="Πανεπιστήμιο Αιγαίου"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                Πανεπιστήμιο Αιγαίου
              </p>
              <p className="text-xs text-muted-foreground">
                AegeanSense
              </p>
            </div>
          </div>
          <Image
            src="/ellada-2.0-logo_gr.png"
            alt="Ελλάδα 2.0"
            width={160}
            height={59}
            className="h-auto w-28 opacity-70"
          />
        </footer>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
  small,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className="app-card rounded-xl border border-border/50 bg-card/60 px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 flex items-baseline gap-1.5 font-display tabular-nums ${
          small ? "text-base" : "text-3xl"
        } ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
        {sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}
      </p>
    </div>
  )
}
