"use client";

import { useRef, useState, useTransition } from "react";
import {
  extractWorkoutFromPhoto,
  addWorkoutsBulk,
  type ExtractedExercise,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO } from "@/lib/utils";
import { Camera, Loader2, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoImport() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<ExtractedExercise[]>([]);
  const [reading, setReading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB)");
      return;
    }
    setReading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const extracted = await extractWorkoutFromPhoto(base64, mediaType);
      if (extracted.length === 0) {
        toast.error("No exercises found — try a clearer photo");
      } else {
        setRows(extracted);
        toast.success(`Found ${extracted.length} exercise${extracted.length > 1 ? "s" : ""} — review and save.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the photo");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function update(i: number, field: keyof ExtractedExercise, value: string) {
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === i
          ? {
              ...r,
              [field]:
                field === "exercise" ? value : Number(value) || 0,
            }
          : r
      )
    );
  }

  function save() {
    startTransition(async () => {
      try {
        await addWorkoutsBulk(date, rows);
        toast.success("Workouts logged");
        setRows([]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="pi-date">Date</Label>
          <Input
            id="pi-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => inputRef.current?.click()}
          disabled={reading}
        >
          {reading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Reading photo…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Take / upload photo
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Snap your journal or a Bridge Athletic screen — the lifts get read in
        automatically. Review them below before saving.
      </p>

      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_3rem_3rem_4rem_1.5rem] gap-2 px-1 text-[10px] font-medium uppercase text-muted-foreground">
            <span>Exercise</span>
            <span className="text-right">Sets</span>
            <span className="text-right">Reps</span>
            <span className="text-right">Lb</span>
            <span />
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_3rem_3rem_4rem_1.5rem] items-center gap-2"
            >
              <Input
                value={r.exercise}
                onChange={(e) => update(i, "exercise", e.target.value)}
                className="h-8"
              />
              <Input
                type="number"
                value={r.sets || ""}
                onChange={(e) => update(i, "sets", e.target.value)}
                className="h-8 px-1 text-right"
              />
              <Input
                type="number"
                value={r.reps || ""}
                onChange={(e) => update(i, "reps", e.target.value)}
                className="h-8 px-1 text-right"
              />
              <Input
                type="number"
                value={r.weight || ""}
                onChange={(e) => update(i, "weight", e.target.value)}
                className="h-8 px-1 text-right"
              />
              <button
                type="button"
                aria-label="Remove row"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button type="button" className="w-full" onClick={save} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" /> Save {rows.length} workout
                {rows.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
