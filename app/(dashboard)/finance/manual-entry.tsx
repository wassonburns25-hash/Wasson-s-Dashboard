"use client";

import { useState, useTransition } from "react";
import { upsertDailyLog } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

// Manual daily-earnings entry. Writes to daily_logs (separate from the
// work-log derived income) so ad-hoc cash can be recorded.
export function ManualEntry() {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount");
      return;
    }
    startTransition(async () => {
      try {
        await upsertDailyLog({ log_date: date, earnings: value });
        toast.success("Earnings saved");
        setAmount("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="f-date">Date</Label>
        <Input
          id="f-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="f-amount">Amount ($)</Label>
        <Input
          id="f-amount"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add
          </>
        )}
      </Button>
    </form>
  );
}
