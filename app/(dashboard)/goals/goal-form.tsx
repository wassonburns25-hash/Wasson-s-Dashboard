"use client";

import { useState, useTransition } from "react";
import { addGoal } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GoalCategory } from "@/lib/types";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const categories: GoalCategory[] = [
  "Athletic",
  "Academic",
  "Financial",
  "Personal",
];

export function GoalForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Athletic");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState("0");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Enter a goal title");
      return;
    }
    const pct = Math.max(0, Math.min(100, parseInt(progress) || 0));
    startTransition(async () => {
      try {
        await addGoal({
          title: title.trim(),
          category,
          deadline: deadline || null,
          progress: pct,
          status: pct >= 100 ? "completed" : "active",
        });
        toast.success("Goal added");
        setTitle("");
        setDeadline("");
        setProgress("0");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New goal
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-4 rounded-xl border bg-card p-5 sm:w-auto sm:min-w-[420px]"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">New goal</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-title">Title</Label>
        <Input
          id="g-title"
          placeholder="Save $2,000 for summer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as GoalCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-deadline">Deadline</Label>
          <Input
            id="g-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-progress">Progress ({progress}%)</Label>
        <Input
          id="g-progress"
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Add goal"
        )}
      </Button>
    </form>
  );
}
