"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  program,
  SECTION_ORDER,
  checkKey,
  type ProgramSection,
} from "@/lib/program";
import { toggleProgramCheck } from "./program/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Dumbbell, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const LABEL: Record<ProgramSection, string> = {
  LIFT: "Lift",
  FIELD: "Field",
  MOBILITY: "Mobility",
  RUNNING: "Running",
};

export function TodayTraining({
  today,
  initialChecks,
}: {
  today: string;
  initialChecks: string[];
}) {
  const [checks, setChecks] = useState<Set<string>>(new Set(initialChecks));
  const [, startTransition] = useTransition();

  const day = program.weeks
    .flatMap((w) => w.days)
    .find((d) => d.date === today);

  const sections = day
    ? SECTION_ORDER.filter((s) => day.sections[s])
    : [];

  function toggle(key: string, checked: boolean) {
    const next = new Set(checks);
    if (checked) next.add(key);
    else next.delete(key);
    setChecks(next);
    startTransition(async () => {
      try {
        await toggleProgramCheck(key, checked);
      } catch (e) {
        setChecks((cur) => {
          const r = new Set(cur);
          if (checked) r.delete(key);
          else r.add(key);
          return r;
        });
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Today&apos;s Training
        </CardTitle>
        <Link
          href="/program"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Full program <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No program session scheduled for today.{" "}
            <Link href="/program" className="text-primary hover:underline">
              View the calendar
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {sections.map((sec) => {
              const key = checkKey(today, sec);
              const done = checks.has(key);
              return (
                <li key={sec}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
                      done && "bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={done}
                      onCheckedChange={(v) => toggle(key, Boolean(v))}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {LABEL[sec]}
                      </span>
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-sm leading-snug",
                          done && "text-muted-foreground line-through"
                        )}
                      >
                        {day!.sections[sec]}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
