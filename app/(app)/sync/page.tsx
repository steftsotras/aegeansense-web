import { redirect } from "next/navigation"

/** Sync management is admin-only - it now lives under /admin/sync. */
export default function SyncRedirect() {
  redirect("/admin/sync")
}
