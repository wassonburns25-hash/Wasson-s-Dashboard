import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DailyForm } from "./daily-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyLog } from "@/lib/types";
import { formatCurrency, startOfWeek, todayISO } from "@/lib/utils";
import { CalendarDays, Wallet, Flame, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = createClient();
  const today = todayISO();
  const weekStart = startOfWeek(new Date()).toISOString().slice(0, 10);

  const [{ data: todayLog }, { data: weekLogs }] = await Promise.all([
    supabase.from("daily_logs").select("*").eq("log_date", today).maybeSingle(),
    supabase
      .from("daily_logs")
      .select("*")
      .gte("log_date", weekStart)
      .order("log_date", { ascending: true }),
  ]);

  const logs = (weekLogs ?? []) as DailyLog[];
  const weekEarnings = logs.reduce((sum, l) => sum + Number(l.earnings || 0), 0);
  const daysLogged = logs.length;
  const tasksDone = todayLog
    ? [
        todayLog.lifted,
        todayLog.nutrition_on_track,
        todayLog.schoolwork_done,
      ].filter(Boolean).length
    : 0;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader title="Daily Overview" description={dateLabel} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="This week's earnings"
          value={formatCurrency(weekEarnings)}
          icon={Wallet}
          hint={`${daysLogged} day${daysLogged === 1 ? "" : "s"} logged`}
        />
        <StatCard
          label="Today's tasks"
          value={`${tasksDone} / 3`}
          icon={CheckCircle2}
          hint="lifted · nutrition · schoolwork"
        />
        <StatCard
          label="Energy today"
          value={todayLog?.energy ? `${todayLog.energy} / 5` : "—"}
          icon={Flame}
          hint={todayLog?.mood ? `Mood ${todayLog.mood}/5` : "Not logged yet"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DailyForm log={(todayLog as DailyLog) ?? null} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No entries this week yet. Start with today&apos;s check-in.
              </p>
            ) : (
              <ul className="divide-y">
                {logs.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="font-medium">
                      {new Date(l.log_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="tabular-nums">
                        {formatCurrency(Number(l.earnings))}
                      </span>
                      <span className="flex gap-1">
                        {l.lifted && <Dot title="Lifted" />}
                        {l.nutrition_on_track && <Dot title="Nutrition" />}
                        {l.schoolwork_done && <Dot title="Schoolwork" />}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dot({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="inline-block h-2 w-2 rounded-full bg-emerald-500"
    />
  );
}
