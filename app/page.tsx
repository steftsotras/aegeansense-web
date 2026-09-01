import Link from "next/link"
import Image from "next/image"
import {
  IconArrowRight,
  IconBuildingFactory,
  IconChartHistogram,
  IconCloudRain,
  IconDropletFilled,
  IconSnowflake,
  IconTemperature,
  IconVirus,
} from "@tabler/icons-react"

import { BrandWordmark } from "@/components/brand-wordmark"
import { StationMap } from "@/components/station-map"
import { Button } from "@/components/ui/button"
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

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  MicroclimateStation: { label: "Μικροκλιματικοί", icon: IconTemperature },
  WeatherStation: { label: "Μετεωρολογικοί", icon: IconCloudRain },
  IndoorAirQuality: { label: "Ποιότητα Αέρα", icon: IconBuildingFactory },
}

const capabilities = [
  {
    icon: IconChartHistogram,
    title: "Παρακολούθηση μικροκλίματος",
    description:
      "Χρονοσειρές θερμοκρασίας, υγρασίας, ανέμου και εδάφους ανά σταθμό και τοποθεσία.",
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
      "Δείκτες κινδύνου περονόσπορου και ωιδίου από θερμοκρασία, υγρασία και διαβροχή φύλλου.",
    status: "planned" as const,
  },
  {
    icon: IconDropletFilled,
    title: "Βελτιστοποίηση άρδευσης",
    description:
      "Υπολογισμός εξατμισοδιαπνοής αναφοράς για στοχευμένο πότισμα και εξοικονόμηση νερού.",
    status: "planned" as const,
  },
]

export default async function Home() {
  const stations = await fetchStations()
  const activeCount = stations.filter(
    (station) => getStationActivity(station).status === "online"
  ).length
  const typeCounts = stations.reduce(
    (counts, station) => {
      counts[station.type] = (counts[station.type] || 0) + 1
      return counts
    },
    {} as Record<string, number>
  )
  const lastUpdate = stations.reduce<string | null>((latest, station) => {
    if (!station.last_seen) return latest
    if (!latest || new Date(station.last_seen) > new Date(latest)) {
      return station.last_seen
    }
    return latest
  }, null)
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 md:pt-8 lg:px-8">
        <section className="grid gap-10 pb-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:items-center lg:gap-12 lg:pb-10">
          <div className="py-2 lg:py-6">
            <div className="flex max-w-xl flex-wrap items-center justify-between gap-x-7 gap-y-5">
              <div className="flex items-center gap-3.5">
                <Image
                  src="/logo-aegean.png"
                  alt=""
                  aria-hidden="true"
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
                  Πανεπιστήμιο Αιγαίου
                </span>
              </div>
              <Image
                src="/ellada-2.0-logo_gr.png"
                alt="Ελλάδα 2.0"
                width={154}
                height={66}
                className="h-auto w-[132px] sm:w-[154px]"
                priority
              />
            </div>

            <h1 className="mt-9">
              <BrandWordmark className="w-full max-w-[430px]" />
            </h1>

            <div className="mt-8 max-w-xl">
              <p className="text-base leading-8 text-muted-foreground md:text-xl md:leading-9">
                Δεδομένα σε πραγματικό χρόνο από κλιματικούς σταθμούς σε όλο το
                Αιγαίο, με διαδραστικά γραφήματα χρονοσειρών για την έρευνα και
                τη γεωργία ακριβείας.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-sm bg-primary px-6 text-primary-foreground shadow-none hover:bg-primary/90">
                  <Link href="/dashboard">
                    Πίνακας Ελέγχου
                    <IconArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-sm px-6 shadow-none">
                  <Link href="/about">Σχετικά</Link>
                </Button>
              </div>
            </div>
          </div>

          <figure className="min-w-0">
            <div className="relative h-[clamp(380px,38vw,520px)] overflow-hidden rounded-lg bg-muted shadow-sm">
              <StationMap
                stations={stations}
                showCard={false}
                height="100%"
                frameless
                variant="newsprint"
              />
              <div className="pointer-events-none absolute right-4 top-4 z-[500] inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-primary" />
                Χάρτης σταθμών
              </div>
            </div>
          </figure>
        </section>

        <section className="rounded-lg bg-muted/55 px-2 sm:px-4" aria-label="Κατάσταση δικτύου">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <StatItem label="Σταθμοί" value={String(stations.length)} />
            <StatItem
              label="Ενεργοί τώρα"
              value={String(activeCount)}
              sub={`/ ${stations.length}`}
              accent
            />
            <StatItem label="Κατηγορίες" value={String(Object.keys(typeCounts).length)} />
            <StatItem
              label="Τελ. ενημέρωση"
              value={lastUpdate ? relativeTimeGreek(lastUpdate) : "—"}
              compact
            />
          </div>

          {Object.keys(typeCounts).length > 0 && (
            <div className="flex flex-wrap gap-x-8 gap-y-3 px-2 pb-5 pt-1 md:px-5">
              {Object.entries(typeCounts).map(([type, count]) => {
                const config = typeConfig[type] || {
                  label: type,
                  icon: IconCloudRain,
                }
                const Icon = config.icon
                return (
                  <Link
                    key={type}
                    href="/dashboard"
                    className="group flex items-center gap-2.5 text-xs uppercase tracking-[0.09em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    <span>{config.label}</span>
                    <strong className="font-display text-sm font-semibold text-foreground">
                      {count}
                    </strong>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-16 md:mt-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Ερευνητικές εφαρμογές
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">
                Από την παρατήρηση στην υποστήριξη αποφάσεων
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Συγκεντρώνουμε και οπτικοποιούμε μετρήσεις θερμοκρασίας,
                υγρασίας, ανέμου, βροχόπτωσης και εδάφους ανά σταθμό. Πάνω σε
                αυτές τις χρονοσειρές αναπτύσσουμε ειδοποιήσεις παγετού,
                δείκτες κινδύνου ασθενειών και υποστήριξη άρδευσης για
                ερευνητές και παραγωγούς.
              </p>
            </div>

            <div className="divide-y divide-border/60">
              {capabilities.map((capability) => {
                const Icon = capability.icon
                return (
                  <article
                    key={capability.title}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 py-5 first:pt-0 lg:first:pt-1"
                  >
                    <Icon
                      className={`mt-0.5 size-5 ${
                        capability.status === "available" ? "text-primary" : "text-foreground/50"
                      }`}
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {capability.title}
                      </h3>
                      <p className="mt-1 max-w-xl text-xs leading-6 text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                    <span
                      className={`pt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        capability.status === "available" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {capability.status === "available" ? "Διαθέσιμο" : "Υπό ανάπτυξη"}
                    </span>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* <footer className="mt-16 flex flex-col gap-2 py-6 text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>AegeanSense · Πανεπιστήμιο Αιγαίου</span>
        </footer> */}
      </div>
    </main>
  )
}

function StatItem({
  label,
  value,
  sub,
  compact,
  accent,
}: {
  label: string
  value: string
  sub?: string
  compact?: boolean
  accent?: boolean
}) {
  return (
    <div className="min-w-0 px-3 py-5 md:px-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 flex items-baseline gap-1.5 font-display tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        } ${
          compact ? "text-sm md:text-base" : "text-2xl"
        }`}
      >
        {value}
        {sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}
      </p>
    </div>
  )
}
