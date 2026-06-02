import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MealForm } from "./meal-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteMeal } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { todayISO } from "@/lib/utils";
import {
  CALORIE_TARGET,
  MAINTENANCE_CALORIES,
  CURRENT_WEIGHT_LB,
  GOAL_WEIGHT_LB,
} from "@/lib/nutrition";
import { Flame, Target, Beef } from "lucide-react";

export const dynamic = "force-dynamic";

type Meal = {
  id: string;
  eaten_on: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export default async function NutritionPage() {
  const supabase = createClient();
  const today = todayISO();

  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("eaten_on", today)
    .order("created_at", { ascending: true });

  const meals = (data ?? []) as Meal[];
  const totals = meals.reduce(
    (a, m) => ({
      cal: a.cal + m.calories,
      p: a.p + m.protein_g,
      c: a.c + m.carbs_g,
      f: a.f + m.fat_g,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const remaining = CALORIE_TARGET - totals.cal;
  const pct = Math.min(100, Math.round((totals.cal / CALORIE_TARGET) * 100));

  return (
    <div>
      <PageHeader
        title="Nutrition"
        description={`Cutting from ${CURRENT_WEIGHT_LB} lb → ${GOAL_WEIGHT_LB} lb`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Eaten today"
          value={`${totals.cal.toLocaleString()} kcal`}
          icon={Flame}
          hint={`${totals.p}g protein`}
        />
        <StatCard
          label="Daily target"
          value={`${CALORIE_TARGET.toLocaleString()} kcal`}
          icon={Target}
          hint={`Maintenance ~${MAINTENANCE_CALORIES.toLocaleString()}`}
        />
        <StatCard
          label="Remaining"
          value={`${remaining.toLocaleString()} kcal`}
          icon={Beef}
          hint={remaining >= 0 ? "left for today" : "over target"}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Today&apos;s intake</span>
            <span className="text-muted-foreground">
              {totals.cal.toLocaleString()} / {CALORIE_TARGET.toLocaleString()} kcal
            </span>
          </div>
          <Progress
            value={pct}
            indicatorClassName={totals.cal > CALORIE_TARGET ? "bg-rose-500" : undefined}
          />
          <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
            <span>Protein {totals.p}g</span>
            <span>Carbs {totals.c}g</span>
            <span>Fat {totals.f}g</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log a meal</CardTitle>
          </CardHeader>
          <CardContent>
            <MealForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s meals</CardTitle>
          </CardHeader>
          <CardContent>
            {meals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing logged yet today.
              </p>
            ) : (
              <ul className="divide-y">
                {meals.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.calories} kcal · {m.protein_g}p / {m.carbs_g}c / {m.fat_g}f
                      </p>
                    </div>
                    <DeleteButton
                      confirmText="Delete this meal?"
                      action={async () => {
                        "use server";
                        await deleteMeal(m.id);
                      }}
                    />
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
