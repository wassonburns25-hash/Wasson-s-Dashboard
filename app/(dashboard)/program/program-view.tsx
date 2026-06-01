"use client";

import { useMemo, useState, useTransition } from "react";
import {
  program,
  SECTION_ORDER,
  checkKey,
  type ProgramSection,
  type ProgramWeek,
} from "@/lib/program";
import { toggleProgramCheck } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dumbbell,
  Target,
  Activity,
  Footprints,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SECTION_META: Record<
  ProgramSection,
  { icon: LucideIcon; label: string; color: string }
> = {
  LIFT: { icon: Dumbbell, label: "Lift", color: "text-blue-400" },
  FIELD: { icon: Target, label: "Field", color: "text-emerald-400" },
  MOBILITY: { icon: Activity, label: "Mobility", color: "text-amber-400" },
  RUNNING: { icon: Footprints, label: "Running", color: "text-rose-400" },
};

function weekRange(week: ProgramWeek): { start?: string; end?: string } {
  const dates = week.days.map((d) => d.date).filter(Boolean) as string[];
  return { start: dates[0], end: dates[dates.length - 1] };
}

function fmt(date: string | null) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProgramView({
  initialChecks,
  today,
}: {
  initialChecks: string[];
  today: string;
}) {
  const [checks, setChecks] = useState<Set<string>>(new Set(initialChecks));
  const [, startTransition] = useTransition();

  const startWeek = useMemo(() => {
    const idx = program.weeks.findIndex((w) => {
      const { start, end } = weekRange(w);
      return start && end && today >= start && today <= end;
    });
    return idx >= 0 ? idx : 0;
  }, [today]);

  const [weekIndex, setWeekIndex] = useState(startWeek);
  const week = program.weeks[weekIndex];
  const { start, end } = weekRange(week);

  function toggle(key: string) {
    const next = new Set(checks);
    const isChecked = !next.has(key);
    if (isChecked) next.add(key);
    else next.delete(key);
    setChecks(next);
    startTransition(async () => {
      try {
        await toggleProgramCheck(key, isChecked);
      } catch (e) {
        // revert on failure
        setChecks((cur) => {
          const r = new Set(cur);
          if (isChecked) r.delete(key);
          else r.add(key);
          return r;
        });
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  // Week completion stats
  const weekTotals = week.days.reduce(
    (acc, d) => {
      if (!d.date) return acc;
      for (const sec of SECTION_ORDER) {
        if (d.sections[sec]) {
          acc.total += 1;
          if (checks.has(checkKey(d.date, sec))) acc.done += 1;
        }
      }
      return acc;
    },
    { done: 0, total: 0 }
  );
  const weekPct =
    weekTotals.total > 0
      ? Math.round((weekTotals.done / weekTotals.total) * 100)
      : 0;

  return (
    <Tabs defaultValue="calendar">
      <TabsList className="mb-4">
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="reference">Reference</TabsTrigger>
      </TabsList>

      {/* ---------------- Calendar ---------------- */}
      <TabsContent value="calendar" className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <Button
              variant="outline"
              size="icon"
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">
                {fmt(start ?? null)} – {fmt(end ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                Week {weekIndex + 1} of {program.weeks.length} ·{" "}
                {weekTotals.done}/{weekTotals.total} done
              </p>
              <Progress value={weekPct} className="mt-2 h-1.5" />
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={weekIndex === program.weeks.length - 1}
              onClick={() =>
                setWeekIndex((i) =>
                  Math.min(program.weeks.length - 1, i + 1)
                )
              }
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {week.days.map((day) => {
            if (!day.date) return null;
            const isToday = day.date === today;
            const sections = SECTION_ORDER.filter((s) => day.sections[s]);
            const doneCount = sections.filter((s) =>
              checks.has(checkKey(day.date!, s))
            ).length;

            return (
              <Card
                key={day.date}
                className={cn(isToday && "border-primary ring-1 ring-primary")}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">
                    {day.label}
                    {isToday && (
                      <Badge className="ml-2 align-middle" variant="default">
                        Today
                      </Badge>
                    )}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{sections.length}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {sections.map((sec) => {
                    const key = checkKey(day.date!, sec);
                    const done = checks.has(key);
                    const meta = SECTION_META[sec];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={sec}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          done && "bg-muted/40"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={done}
                            onCheckedChange={() => toggle(key)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {meta.label}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-1 whitespace-pre-wrap text-sm leading-snug",
                                done && "text-muted-foreground line-through"
                              )}
                            >
                              {day.sections[sec]}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* ---------------- Reference ---------------- */}
      <TabsContent value="reference" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Wall Ball routine</CardTitle>
            <p className="text-sm text-muted-foreground">
              Do every day as part of field work.
            </p>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {program.wallBall.map((w) => (
                <li
                  key={w.n}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span>
                    <span className="mr-2 text-muted-foreground">{w.n}.</span>
                    {w.exercise}
                  </span>
                  <span className="shrink-0 font-medium text-muted-foreground">
                    {w.reps}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {program.mobility
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <Card key={g.group}>
              <CardHeader>
                <CardTitle className="text-base">{g.group}</CardTitle>
                {g.source && (
                  <p className="break-all text-xs text-muted-foreground">
                    {g.source}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {g.items.map((it) => (
                  <div key={it.name}>
                    <p className="text-sm font-medium">{it.name}</p>
                    <p className="text-sm text-muted-foreground">{it.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

        <Card>
          <CardHeader>
            <CardTitle>Track / conditioning details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {program.track.map((row, i) =>
              row.a && row.b ? (
                <div key={i} className="grid gap-0.5">
                  <p className="text-sm font-medium">{row.a}</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {row.b}
                  </p>
                </div>
              ) : row.a ? (
                <p
                  key={i}
                  className="pt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {row.a}
                </p>
              ) : null
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
