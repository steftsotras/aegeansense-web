import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-shell"
import {
  IconCloudRain,
  IconTemperature,
  IconBuildingFactory,
  IconDownload,
  IconZoomIn,
  IconCalendar,
  IconArrowsLeftRight,
  IconInfoCircle,
} from "@tabler/icons-react"

export default function AboutPage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none fixed inset-0 app-topo opacity-30" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ──────────────────────────────────────────────── */}
        <PageHeader
          icon={<IconInfoCircle className="size-5" />}
          title="Πληροφορίες"
         />

      {/* ── About the Project ─────────────────────────────────────── */}
      <Card className="relative overflow-hidden border-border/50 app-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
  
        <CardContent className="relative prose prose-sm max-w-none text-foreground/80">
          <p>
            Η εφαρμογή αυτή αναπτύχθηκε στα πλαίσια διπλωματικής εργασίας και επιτρέπει
            την οπτικοποίηση δεδομένων από κλιματικούς σταθμούς που είναι συνδεδεμένοι
            στην πλατφόρμα FINoT (Future Intelligence IoT).
          </p>
          <p>
            Τα δεδομένα συλλέγονται σε πραγματικό χρόνο από διάφορους τύπους αισθητήρων
            και παρουσιάζονται με τη μορφή διαδραστικών γραφημάτων χρονοσειρών.
          </p>
        </CardContent>
      </Card>

      {/* ── Station Types ─────────────────────────────────────────── */}
      <Card className="relative overflow-hidden border-border/50 app-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-xl">
            Τύποι Σταθμών
          </CardTitle>
          <CardDescription>Κατηγορίες αισθητήρων στο δίκτυο</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: IconTemperature,
                title: "Μικροκλιματικός",
                desc: "Θερμοκρασία αέρα & εδάφους, υγρασία, βροχόπτωση, υγρασία φύλλων",
                color: "text-primary",
                bg: "bg-primary/8",
              },
              {
                icon: IconCloudRain,
                title: "Μετεωρολογικός",
                desc: "Πλήρη μετεωρολογικά δεδομένα, άνεμος, ηλιακή ακτινοβολία",
                color: "text-chart-2",
                bg: "bg-chart-2/8",
              },
              {
                icon: IconBuildingFactory,
                title: "Ποιότητα Αέρα",
                desc: "CO₂, πτητικές οργανικές ενώσεις, θόρυβος, φωτεινότητα",
                color: "text-chart-5",
                bg: "bg-chart-5/8",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group flex flex-col gap-3 p-5 rounded-xl border border-border/30 bg-card/50 hover:bg-card transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`size-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── How to Use ────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden border-border/50 app-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-xl">
            Οδηγίες Χρήσης
          </CardTitle>
          <CardDescription>Πώς να χρησιμοποιήσετε τα γραφήματα</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Επιλογή Σταθμού",
                desc: "Χρησιμοποιήστε τη sidebar ή την αναπτυσσόμενη λίστα στο Dashboard για να επιλέξετε σταθμό.",
              },
              {
                step: 2,
                title: "Επιλογή Χρονικού Εύρους",
                desc: 'Χρησιμοποιήστε τα κουμπιά "Ημέρα", "Εβδομάδα", "Μήνας" ή "Έτος" για να ορίσετε το χρονικό εύρος.',
              },
              {
                step: 3,
                title: "Εξερεύνηση Δεδομένων",
                desc: "Hover πάνω στα γραφήματα για λεπτομερείς τιμές. Zoom και Pan για εστίαση σε συγκεκριμένα σημεία.",
              },
              {
                step: 4,
                title: "Εξαγωγή Δεδομένων",
                desc: 'Κάντε κλικ στο κουμπί "Εξαγωγή" για να κατεβάσετε τα δεδομένα σε μορφή CSV, PNG, ή SVG.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  {item.step}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Chart Features ────────────────────────────────────────── */}
      <Card className="relative overflow-hidden border-border/50 app-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-xl">
            Δυνατότητες Γραφημάτων
          </CardTitle>
          <CardDescription>Διαδραστικές λειτουργίες</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                icon: IconZoomIn,
                title: "Zoom",
                desc: "Σύρετε για επιλογή περιοχής zoom",
              },
              {
                icon: IconArrowsLeftRight,
                title: "Pan",
                desc: "Shift + σύρσιμο για μετακίνηση",
              },
              {
                icon: IconCalendar,
                title: "Χρονική Πλοήγηση",
                desc: "Πλοήγηση ανά ημέρα, εβδομάδα ή μήνα",
              },
              {
                icon: IconDownload,
                title: "Εξαγωγή",
                desc: "Λήψη σε CSV, PNG ή SVG",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3.5 p-4 rounded-xl border border-border/30 bg-card/50 hover:bg-card transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="size-4 text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* ── Footer spacer ───────────────────────────────────────── */}
        <div className="pb-4" />
      </div>
    </div>
  )
}
