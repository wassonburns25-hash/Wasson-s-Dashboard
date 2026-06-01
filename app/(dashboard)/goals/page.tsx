import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GoalForm } from "./goal-form";
import { GoalCard } from "./goal-card";
import type { Goal, GoalCategory } from "@/lib/types";
import { Target } from "lucide-react";

export const dynamic = "force-dynamic";

const categoryOrder: GoalCategory[] = [
  "Athletic",
  "Academic",
  "Financial",
  "Personal",
];

export default async function GoalsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  const goals = (data ?? []) as Goal[];
  const grouped = categoryOrder
    .map((category) => ({
      category,
      items: goals.filter((g) => g.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Set targets, track progress, and check them off."
      >
        <GoalForm />
      </PageHeader>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Target className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No goals yet. Add your first one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.category}
                <span className="ml-2 text-xs font-normal">
                  {group.items.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
