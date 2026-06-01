"use client";

import { useState, useTransition } from "react";
import { addTrip } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export function TripForm() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim() || !start) {
      toast.error("Destination and start date are required");
      return;
    }
    startTransition(async () => {
      try {
        await addTrip({
          destination: destination.trim(),
          start_date: start,
          end_date: end || null,
          purpose: purpose.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success("Trip added");
        setDestination("");
        setStart("");
        setEnd("");
        setPurpose("");
        setNotes("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add trip
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-4 rounded-xl border bg-card p-5 sm:min-w-[420px]"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">New trip</h3>
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
        <Label htmlFor="t-dest">Destination</Label>
        <Input
          id="t-dest"
          placeholder="Denver, CO"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="t-start">Start date</Label>
          <Input
            id="t-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-end">End date</Label>
          <Input
            id="t-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-purpose">Purpose</Label>
        <Input
          id="t-purpose"
          placeholder="Track meet, family visit, etc."
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-notes">Notes</Label>
        <Textarea
          id="t-notes"
          placeholder="Packing list, reservations, contacts…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save trip"}
      </Button>
    </form>
  );
}
