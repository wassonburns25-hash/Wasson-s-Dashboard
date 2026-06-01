"use client";

import { useState, useTransition } from "react";
import { addWorkout } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function WorkoutForm() {
  const [date, setDate] = useState(todayISO());
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) {
      toast.error("Enter an exercise name");
      return;
    }
    startTransition(async () => {
      try {
        await addWorkout({
          workout_date: date,
          exercise: exercise.trim(),
          sets: parseInt(sets) || 0,
          reps: parseInt(reps) || 0,
          weight: parseFloat(weight) || 0,
          notes: notes.trim() || null,
        });
        toast.success("Workout logged");
        setExercise("");
        setWeight("");
        setNotes("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to log");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="w-date">Date</Label>
          <Input
            id="w-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-ex">Exercise</Label>
          <Input
            id="w-ex"
            placeholder="Bench press"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="w-sets">Sets</Label>
          <Input
            id="w-sets"
            type="number"
            min="0"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-reps">Reps</Label>
          <Input
            id="w-reps"
            type="number"
            min="0"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-weight">Weight (lb)</Label>
          <Input
            id="w-weight"
            type="number"
            min="0"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="w-notes">Injury / recovery notes</Label>
        <Textarea
          id="w-notes"
          placeholder="How did it feel? Any tweaks or soreness?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Log workout
          </>
        )}
      </Button>
    </form>
  );
}
