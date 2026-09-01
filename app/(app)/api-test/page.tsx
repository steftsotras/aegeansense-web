import { redirect } from "next/navigation"

/** The API tester is admin-only - it now lives under /admin/api-test. */
export default function ApiTestRedirect() {
  redirect("/admin/api-test")
}
