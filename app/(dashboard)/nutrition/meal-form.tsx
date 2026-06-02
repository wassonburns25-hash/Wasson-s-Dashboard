"use client";

import { useState, useTransition } from "react";
import { estimateMeal, addMeal, type MealEstimate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/utils";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

export function MealForm() {
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [est, setEst] = useState<MealEstimate>({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });
  const [estimating, setEstimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function runEstimate() {
    if (!description.trim()) {
      toast.error("Describe your meal first");
      return;
    }
    setEstimating(true);
    try {
      const result = await estimateMeal(description);
      setEst(result);
      toast.success("Estimated — adjust if needed, then log it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Estimation failed");
    } finally {
      setEstimating(false);
    }
  }

  function log(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Describe your meal");
      return;
    }
    startTransition(async () => {
      try {
        await addMeal({ eaten_on: date, description: description.trim(), ...est });
        toast.success("Meal logged");
        setDescription("");
        setEst({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  const macro = (
    key: keyof MealEstimate,
    label: string,
    suffix: string
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`m-${key}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`m-${key}`}
        type="number"
        min="0"
        value={est[key] || ""}
        onChange={(e) =>
          setEst((s) => ({ ...s, [key]: parseInt(e.target.value) || 0 }))
        }
        className="h-8"
      />
      <span className="text-[10px] text-muted-foreground">{suffix}</span>
    </div>
  );

  return (
    <form onSubmit={log} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="m-date">Date</Label>
          <Input
            id="m-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="m-desc">What did you eat?</Label>
          <Textarea
            id="m-desc"
            placeholder="2 eggs, oatmeal with banana, black coffee"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[40px]"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={runEstimate}
        disabled={estimating}
      >
        {estimating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Estimate calories with AI
          </>
        )}
      </Button>

      <div className="grid grid-cols-4 gap-2">
        {macro("calories", "Calories", "kcal")}
        {macro("protein_g", "Protein", "g")}
        {macro("carbs_g", "Carbs", "g")}
        {macro("fat_g", "Fat", "g")}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Log meal
          </>
        )}
      </Button>
    </form>
  );
}
