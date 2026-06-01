"use client";

import { useState, useTransition } from "react";
import { updateGoal, deleteGoal } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Check, Trash2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function GoalCard({ goal }: { goal: Goal }) {
  const [progress, setProgress] = useState(goal.progress);
  const [isPending, startTransition] = useTransition();

  function save(value: number) {
    startTransition(async () => {
      try {
        await updateGoal(goal.id, { progress: value });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function toggleStatus() {
    const next = goal.status === "completed" ? "active" : "completed";
    startTransition(async () => {
      try {
        await updateGoal(goal.id, {
          status: next,
          progress: next === "completed" ? 100 : goal.progress,
        });
        if (next === "completed") setProgress(100);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function remove() {
    if (!window.confirm("Delete this goal?")) return;
    startTransition(async () => {
      try {
        await deleteGoal(goal.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const completed = goal.status === "completed";

  return (
    <Card className={completed ? "border-emerald-500/40" : ""}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium leading-snug">{goal.title}</h3>
            {goal.deadline && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Due {formatDate(goal.deadline)}
              </p>
            )}
          </div>
          {completed && <Badge variant="success">Done</Badge>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            indicatorClassName={completed ? "bg-emerald-500" : undefined}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            disabled={isPending}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={(e) => save(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) =>
              save(Number((e.target as HTMLInputElement).value))
            }
            className="w-full accent-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={toggleStatus}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : completed ? (
              <>
                <RotateCcw className="h-4 w-4" /> Reopen
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Complete
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={remove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
