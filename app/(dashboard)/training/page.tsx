import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { VolumeLineChart } from "@/components/charts/line-chart";
import { WorkoutForm } from "./workout-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteWorkout } from "./actions";
import type { Workout } from "@/lib/types";
import { formatDate, startOfWeek, weekLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Hardcoded starting goals — editable targets for progress tracking.
const trainingGoals = [
  { label: "Bench press 225 lb", current: 0, target: 225, unit: "lb", key: "bench" },
  { label: "1.5 mi run under 9:00", current: 0, target: 100, unit: "%", key: "run" },
  { label: "Bodyweight target 185 lb", current: 0, target: 185, unit: "lb", key: "bw" },
];

function computeWeeklyVolume(workouts: Workout[]) {
  const map = new Map<string, { date: Date; volume: number }>();
  for (const w of workouts) {
    const start = startOfWeek(new Date(w.workout_date));
    const key = start.toISOString().slice(0, 10);
    const vol = Number(w.sets) * Number(w.reps) * Number(w.weight);
    const existing = map.get(key);
    if (existing) existing.volume += vol;
    else map.set(key, { date: start, volume: vol });
  }
  return [...map.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((e) => ({ label: weekLabel(e.date), volume: Math.round(e.volume) }));
}

export default async function TrainingPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("workouts")
    .select("*")
    .order("workout_date", { ascending: false })
    .limit(200);

  const workouts = (data ?? []) as Workout[];
  const chartData = computeWeeklyVolume(workouts);

  // Best bench (max weight on a bench exercise) feeds the bench goal.
  const benchMax = workouts
    .filter((w) => /bench/i.test(w.exercise))
    .reduce((m, w) => Math.max(m, Number(w.weight)), 0);
  trainingGoals[0].current = benchMax;

  return (
    <div>
      <PageHeader
        title="Training"
        description="Log sessions, track volume, and chase your goals."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log a workout</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutForm />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly volume</CardTitle>
              <CardDescription>
                Sets × reps × weight, totaled per week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VolumeLineChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainingGoals.map((g) => {
                const pct = Math.min(
                  100,
                  Math.round((g.current / g.target) * 100)
                );
                return (
                  <div key={g.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.label}</span>
                      <span className="text-muted-foreground">
                        {g.current > 0
                          ? `${g.current}/${g.target} ${g.unit}`
                          : `target ${g.target} ${g.unit}`}
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No workouts logged yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead className="text-right">Sets</TableHead>
                  <TableHead className="text-right">Reps</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.slice(0, 50).map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(w.workout_date)}
                    </TableCell>
                    <TableCell className="font-medium">{w.exercise}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {w.sets}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {w.reps}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {w.weight} lb
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {w.notes}
                    </TableCell>
                    <TableCell>
                      <DeleteButton
                        confirmText="Delete this workout?"
                        action={async () => {
                          "use server";
                          await deleteWorkout(w.id);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
