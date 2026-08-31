"use client"

import * as React from "react"
import {
  IconUsersGroup,
  IconPlus,
  IconPencil,
  IconTrash,
  IconPlugConnected,
  IconAlertTriangle,
  IconCircleCheck,
  IconX,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { api, type FinotProfile } from "@/lib/api"
import { useAdminAuth } from "@/lib/admin-auth"

interface ProfileFormState {
  name: string
  finot_url: string
  finot_username: string
  finot_password: string
  is_active: boolean
}

const EMPTY_FORM: ProfileFormState = {
  name: "",
  finot_url: "",
  finot_username: "",
  finot_password: "",
  is_active: true,
}

export default function AdminProfilesPage() {
  const { errorMessage } = useAdminAuth()

  const [profiles, setProfiles] = React.useState<FinotProfile[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  // Form state: null = closed, "new" = create, number = edit that profile
  const [formTarget, setFormTarget] = React.useState<null | "new" | number>(null)
  const [form, setForm] = React.useState<ProfileFormState>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  // Per-row busy indicators
  const [testingId, setTestingId] = React.useState<number | null>(null)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [testResult, setTestResult] = React.useState<{ id: number; ok: boolean; text: string } | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      setProfiles(await api.getProfiles())
      setError(null)
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία φόρτωσης προφίλ"))
    }
  }, [errorMessage])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  function openCreate() {
    setFormTarget("new")
    setForm(EMPTY_FORM)
    setNotice(null)
  }

  function openEdit(profile: FinotProfile) {
    setFormTarget(profile.id)
    setForm({
      name: profile.name,
      finot_url: profile.finot_url,
      finot_username: profile.finot_username,
      finot_password: "",
      is_active: profile.is_active,
    })
    setNotice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (formTarget === "new") {
        await api.createProfile({ ...form })
        setNotice(`Το προφίλ «${form.name}» δημιουργήθηκε.`)
      } else if (typeof formTarget === "number") {
        await api.updateProfile(formTarget, {
          name: form.name,
          finot_url: form.finot_url,
          finot_username: form.finot_username,
          is_active: form.is_active,
          // Empty password field on edit means "keep the existing one"
          ...(form.finot_password ? { finot_password: form.finot_password } : {}),
        })
        setNotice(`Το προφίλ «${form.name}» ενημερώθηκε.`)
      }
      setFormTarget(null)
      await refresh()
    } catch (err) {
      setError(errorMessage(err, "Αποτυχία αποθήκευσης προφίλ"))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(profile: FinotProfile) {
    setBusyId(profile.id)
    setError(null)
    try {
      await api.updateProfile(profile.id, { is_active: !profile.is_active })
      await refresh()
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία ενημέρωσης προφίλ"))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(profile: FinotProfile) {
    if (!window.confirm(
      `Διαγραφή του προφίλ «${profile.name}»; Οι σταθμοί του διατηρούνται αλλά αποσυνδέονται από το προφίλ.`
    )) return

    setBusyId(profile.id)
    setError(null)
    try {
      await api.deleteProfile(profile.id)
      setNotice(`Το προφίλ «${profile.name}» διαγράφηκε.`)
      await refresh()
    } catch (e) {
      setError(errorMessage(e, "Αποτυχία διαγραφής προφίλ"))
    } finally {
      setBusyId(null)
    }
  }

  async function handleTest(profile: FinotProfile) {
    setTestingId(profile.id)
    setTestResult(null)
    try {
      const res = await api.testConnection(profile.id)
      setTestResult({
        id: profile.id,
        ok: Boolean(res.success),
        text: res.success
          ? "Επιτυχής σύνδεση με το FINoT."
          : res.error || "Αποτυχία σύνδεσης.",
      })
    } catch (e) {
      setTestResult({ id: profile.id, ok: false, text: errorMessage(e, "Αποτυχία ελέγχου σύνδεσης") })
    } finally {
      setTestingId(null)
    }
  }

  const editingProfile =
    typeof formTarget === "number" ? profiles?.find((p) => p.id === formTarget) : undefined

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={<IconUsersGroup className="size-5" />}
        title="Προφίλ FINoT"
        subtitle="Λογαριασμοί FINoT από τους οποίους συγχρονίζονται σταθμοί και μετρήσεις"
        actions={
          <Button size="sm" className="gap-1.5 rounded-full" onClick={openCreate}>
            <IconPlus className="size-4" />
            Νέο προφίλ
          </Button>
        }
      />

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <IconCircleCheck className="size-4 text-primary" />
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* Create / edit form */}
      {formTarget !== null && (
        <Card className="app-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>
                {formTarget === "new"
                  ? "Νέο προφίλ FINoT"
                  : `Επεξεργασία «${editingProfile?.name ?? ""}»`}
              </span>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setFormTarget(null)}>
                <IconX className="size-4" />
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              Τα διαπιστευτήρια αποθηκεύονται κρυπτογραφημένα στον διακομιστή και δεν εμφανίζονται ξανά.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Όνομα</Label>
                <Input
                  id="profile-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="π.χ. aegean-main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-url">FINoT URL</Label>
                <Input
                  id="profile-url"
                  required
                  type="url"
                  value={form.finot_url}
                  onChange={(e) => setForm({ ...form, finot_url: e.target.value })}
                  placeholder="https://finot.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">Όνομα χρήστη FINoT</Label>
                <Input
                  id="profile-username"
                  required
                  value={form.finot_username}
                  onChange={(e) => setForm({ ...form, finot_username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-password">
                  Κωδικός FINoT
                  {formTarget !== "new" && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      (κενό = χωρίς αλλαγή)
                    </span>
                  )}
                </Label>
                <Input
                  id="profile-password"
                  type="password"
                  autoComplete="new-password"
                  required={formTarget === "new"}
                  value={form.finot_password}
                  onChange={(e) => setForm({ ...form, finot_password: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked === true })}
                />
                Ενεργό (διαθέσιμο για συγχρονισμό)
              </label>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setFormTarget(null)}>
                  Ακύρωση
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Spinner size="sm" />}
                  {formTarget === "new" ? "Δημιουργία" : "Αποθήκευση"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Profiles table */}
      <Card className="app-card border-border/50">
        <CardContent className="pt-6">
          {profiles === null ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν προφίλ FINoT. Δημιουργήστε το πρώτο για να ξεκινήσει ο συγχρονισμός δεδομένων.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Όνομα</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Χρήστης</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <React.Fragment key={profile.id}>
                    <TableRow>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="max-w-52 truncate font-mono text-xs text-muted-foreground">
                        {profile.finot_url}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{profile.finot_username}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(profile)}
                          disabled={busyId === profile.id}
                          title="Εναλλαγή ενεργού/ανενεργού"
                          className={cn(
                            "inline-flex cursor-pointer rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                            profile.is_active ? "app-status-online" : "app-status-offline"
                          )}
                        >
                          {profile.is_active ? "Ενεργό" : "Ανενεργό"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Έλεγχος σύνδεσης FINoT"
                            disabled={testingId === profile.id || !profile.is_active}
                            onClick={() => handleTest(profile)}
                          >
                            {testingId === profile.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <IconPlugConnected className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Επεξεργασία"
                            onClick={() => openEdit(profile)}
                          >
                            <IconPencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            title="Διαγραφή"
                            disabled={busyId === profile.id}
                            onClick={() => handleDelete(profile)}
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {testResult?.id === profile.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-2">
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                              testResult.ok
                                ? "border-primary/20 bg-primary/5 text-foreground"
                                : "border-destructive/30 bg-destructive/5 text-destructive"
                            )}
                          >
                            {testResult.ok ? (
                              <IconCircleCheck className="size-3.5 text-primary" />
                            ) : (
                              <IconAlertTriangle className="size-3.5" />
                            )}
                            {testResult.text}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
