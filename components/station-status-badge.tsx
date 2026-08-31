import { cn } from "@/lib/utils"
import { getStationActivity, type ActivityStatus } from "@/lib/station-status"
import type { Station } from "@/lib/api"

const STATUS_STYLES: Record<ActivityStatus, string> = {
  online: "app-status-online",
  idle: "app-status-idle",
  offline: "app-status-offline",
}

interface StationStatusBadgeProps {
  station: Pick<Station, "last_seen">
  className?: string
}

/**
 * Pill badge showing a station's derived activity status with a colored dot.
 * Server-safe (no hooks) so it can render inside server components.
 */
export function StationStatusBadge({ station, className }: StationStatusBadgeProps) {
  const { status, label } = getStationActivity(station)

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          status === "online" && "app-pulse",
          status === "offline" && "opacity-60"
        )}
      />
      {label}
    </span>
  )
}
