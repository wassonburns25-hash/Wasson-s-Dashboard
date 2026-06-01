import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { TripForm } from "./trip-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteTrip } from "./actions";
import type { Trip } from "@/lib/types";
import { formatDate, todayISO } from "@/lib/utils";
import { MapPin, Plane } from "lucide-react";

export const dynamic = "force-dynamic";

function dateRange(t: Trip) {
  if (t.end_date && t.end_date !== t.start_date) {
    return `${formatDate(t.start_date)} – ${formatDate(t.end_date)}`;
  }
  return formatDate(t.start_date);
}

export default async function TripsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true });

  const trips = (data ?? []) as Trip[];
  const today = todayISO();
  const upcoming = trips.filter((t) => (t.end_date ?? t.start_date) >= today);
  const past = trips
    .filter((t) => (t.end_date ?? t.start_date) < today)
    .reverse();

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Upcoming travel, sorted by date."
      >
        <TripForm />
      </PageHeader>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Plane className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No trips planned yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <Timeline title="Upcoming" trips={upcoming} highlight />
          {past.length > 0 && <Timeline title="Past" trips={past} />}
        </div>
      )}
    </div>
  );
}

function Timeline({
  title,
  trips,
  highlight,
}: {
  title: string;
  trips: Trip[];
  highlight?: boolean;
}) {
  if (trips.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ol className="relative space-y-4 border-l pl-6">
        {trips.map((t) => (
          <li key={t.id} className="relative">
            <span
              className={`absolute -left-[1.65rem] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background ${
                highlight ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            />
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">{t.destination}</h3>
                    {t.purpose && (
                      <Badge variant="secondary">{t.purpose}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dateRange(t)}
                  </p>
                  {t.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.notes}
                    </p>
                  )}
                </div>
                <DeleteButton
                  confirmText="Delete this trip?"
                  action={async () => {
                    "use server";
                    await deleteTrip(t.id);
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
