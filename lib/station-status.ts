/**
 * Station activity status - derived from data recency, not the upstream flag.
 *
 * The FINoT `connectionStatus` attribute is unreliable: it can keep reporting
 * "CONNECTED" for stations that have been silent for months. Instead we infer
 * status from `last_seen` (the timestamp of the most recent reading).
 *
 * Because the platform's sync cycle is daily (~24h, see thesis ch. 5), a
 * perfectly healthy station's `last_seen` can legitimately trail "now" by up to
 * a full cycle. We therefore allow two cycles before downgrading from active.
 */

import type { Station } from "@/lib/api"

export type ActivityStatus = "online" | "idle" | "offline"

/** Within this age a station is considered active (2 sync cycles). */
export const ONLINE_MAX_AGE_MS = 48 * 60 * 60 * 1000 // 48 hours
/** Within this age a station is idle/stale; beyond it, offline. */
export const IDLE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const LABELS: Record<ActivityStatus, string> = {
  online: "Ενεργός",
  idle: "Αδρανής",
  offline: "Ανενεργός",
}

export interface StationActivity {
  status: ActivityStatus
  label: string
  /** Milliseconds since last reading, or null if never seen. */
  ageMs: number | null
}

/**
 * Derive a station's activity status from its `last_seen` timestamp.
 *
 * @param station - any object carrying a `last_seen` field
 * @param now - reference time (injectable for testing); defaults to Date.now()
 */
export function getStationActivity(
  station: Pick<Station, "last_seen">,
  now: number = Date.now()
): StationActivity {
  if (!station.last_seen) {
    return { status: "offline", label: LABELS.offline, ageMs: null }
  }

  const ageMs = now - new Date(station.last_seen).getTime()

  let status: ActivityStatus
  if (ageMs <= ONLINE_MAX_AGE_MS) status = "online"
  else if (ageMs <= IDLE_MAX_AGE_MS) status = "idle"
  else status = "offline"

  return { status, label: LABELS[status], ageMs }
}

/** Greek relative-time string, e.g. "πριν 3 ώρες", "πριν 5 ημέρες". */
export function relativeTimeGreek(
  dateString: string | null,
  now: number = Date.now()
): string {
  if (!dateString) return "Ποτέ"

  const ageMs = now - new Date(dateString).getTime()
  const minutes = Math.floor(ageMs / 60000)

  if (minutes < 1) return "μόλις τώρα"
  if (minutes < 60) return `πριν ${minutes} λεπτά`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `πριν ${hours} ${hours === 1 ? "ώρα" : "ώρες"}`

  const days = Math.floor(hours / 24)
  if (days < 30) return `πριν ${days} ${days === 1 ? "ημέρα" : "ημέρες"}`

  const months = Math.floor(days / 30)
  return `πριν ${months} ${months === 1 ? "μήνα" : "μήνες"}`
}
