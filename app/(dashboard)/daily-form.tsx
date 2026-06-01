"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertDailyLog } from "./actions";
import type { DailyLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dumbbell, Apple, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const moods = ["😞", "😕", "😐", "🙂", "😄"];

export function DailyForm({ log }: { log: DailyLog | null }) {
  const [lifted, setLifted] = useState(log?.lifted ?? false);
  const [nutrition, setNutrition] = useState(log?.nutrition_on_track ?? false);
  const [school, setSchool] = useState(log?.schoolwork_done ?? false);
  const [mood, setMood] = useState<number | null>(log?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(log?.energy ?? null);
  const [earnings, setEarnings] = useState<string>(
    log?.earnings ? String(log.earnings) : ""
  );
  const [isPending, startTransition] = useTransition();

  function persist(patch: Parameters<typeof upsertDailyLog>[0]) {
    startTransition(async () => {
      try {
        await upsertDailyLog(patch);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  const checks = [
    {
      key: "lifted",
      label: "Lifted today",
      icon: Dumbbell,
      checked: lifted,
      set: (v: boolean) => {
        setLifted(v);
        persist({ lifted: v });
      },
    },
    {
      key: "nutrition",
      label: "On track with nutrition",
      icon: Apple,
      checked: nutrition,
      set: (v: boolean) => {
        setNutrition(v);
        persist({ nutrition_on_track: v });
      },
    },
    {
      key: "school",
      label: "Completed schoolwork",
      icon: BookOpen,
      checked: school,
      set: (v: boolean) => {
        setSchool(v);
        persist({ schoolwork_done: v });
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Daily Check-in</CardTitle>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {checks.map((c) => {
            const Icon = c.icon;
            return (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <Checkbox
                  checked={c.checked}
                  onCheckedChange={(v) => c.set(Boolean(v))}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{c.label}</span>
              </label>
            );
          })}
        </div>

        <Scale
          label="Mood"
          value={mood}
          render={(i) => moods[i - 1]}
          onChange={(v) => {
            setMood(v);
            persist({ mood: v });
          }}
        />
        <Scale
          label="Energy"
          value={energy}
          render={(i) => String(i)}
          onChange={(v) => {
            setEnergy(v);
            persist({ energy: v });
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="earnings">Today&apos;s earnings ($)</Label>
          <div className="flex gap-2">
            <Input
              id="earnings"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={earnings}
              onChange={(e) => setEarnings(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                persist({ earnings: parseFloat(earnings) || 0 })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Scale({
  label,
  value,
  onChange,
  render,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  render: (i: number) => string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-lg border text-lg transition-colors",
              value === i
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-accent"
            )}
          >
            {render(i)}
          </button>
        ))}
      </div>
    </div>
  );
}
