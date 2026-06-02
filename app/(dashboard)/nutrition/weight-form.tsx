"use client";

import { useState, useTransition } from "react";
import { logWeight } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WeightForm({ defaultWeight }: { defaultWeight?: number }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState(defaultWeight ? String(defaultWeight) : "");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w) {
      toast.error("Enter your weight");
      return;
    }
    startTransition(async () => {
      try {
        await logWeight({ weigh_date: date, weight_lb: w });
        toast.success("Weight logged");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-auto"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Weight (lb)</label>
        <Input
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder="230"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-9 w-24"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Log
          </>
        )}
      </Button>
    </form>
  );
}
