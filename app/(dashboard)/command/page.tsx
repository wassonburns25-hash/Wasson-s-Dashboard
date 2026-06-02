import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Priorities, type Priority } from "./priorities";
import { TodayTraining } from "../today-training";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Assignment } from "@/lib/types";
import { formatDate, todayISO } from "@/lib/utils";
import {
  Target,
  CalendarClock,
  Mail,
  GraduationCap,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function CommandPage() {
  const supabase = createClient();
  const today = todayISO();

  const [
    { data: prioritiesData },
    { data: programChecks },
    { data: assignmentsData },
  ] = await Promise.all([
    supabase
      .from("priorities")
      .select("*")
      .order("done", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("program_checks").select("item_key").like("item_key", `${today}::%`),
    supabase
      .from("assignments")
      .select("*")
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(5),
  ]);

  const priorities = (prioritiesData ?? []) as Priority[];
  const todayChecks = (programChecks ?? []).map((r) => r.item_key as string);
  const assignments = (assignmentsData ?? []) as Assignment[];

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader title={`${greeting()}, Wasson`} description={dateLabel} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Top Priorities
            </CardTitle>
            <CardDescription>What moves the needle today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Priorities items={priorities} />
          </CardContent>
        </Card>

        <TodayTraining today={today} initialChecks={todayChecks} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Due soon
            </CardTitle>
            <CardDescription>Next assignments on deck.</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing due — nice.{" "}
                <Link href="/academics" className="text-primary hover:underline">
                  Add assignments
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.course}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(a.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>From Google Calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectPrompt
              what="Google Calendar"
              note="Once connected, your events for today show up here. Perfect for when London and the school year get scheduled."
            />
          </CardContent>
        </Card>

        <Card className="border-dashed lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              Inbox
            </CardTitle>
            <CardDescription>Recent and important email from Gmail.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectPrompt
              what="Gmail"
              note="Once connected, your latest unread and starred emails surface here so you can triage in one place."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConnectPrompt({ what, note }: { what: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <Badge variant="secondary">Connect {what}</Badge>
      <p className="max-w-sm text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
