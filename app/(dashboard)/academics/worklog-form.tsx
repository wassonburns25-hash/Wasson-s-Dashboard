"use client";

import { useState, useTransition } from "react";
import { addWorkLog } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO, formatCurrency } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function WorkLogForm() {
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("15");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const earnings = (parseFloat(hours) || 0) * (parseFloat(rate) || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      toast.error("Enter hours worked");
      return;
    }
    startTransition(async () => {
      try {
        await addWorkLog({
          work_date: date,
          hours: parseFloat(hours),
          pay_rate: parseFloat(rate) || 0,
          note: note.trim() || null,
        });
        toast.success("Work logged");
        setHours("");
        setNote("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="wl-date">Date</Label>
          <Input
            id="wl-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-hours">Hours</Label>
          <Input
            id="wl-hours"
            type="number"
            min="0"
            step="0.25"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-rate">Pay rate ($/hr)</Label>
          <Input
            id="wl-rate"
            type="number"
            min="0"
            step="0.25"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wl-note">Note (optional)</Label>
        <Input
          id="wl-note"
          placeholder="Shift, role, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Calculated earnings</span>
        <span className="font-semibold tabular-nums">
          {formatCurrency(earnings)}
        </span>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Log work
          </>
        )}
      </Button>
    </form>
  );
}
