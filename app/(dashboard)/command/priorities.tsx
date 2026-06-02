"use client";

import { useState, useTransition } from "react";
import { addPriority, togglePriority, deletePriority } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type Priority = { id: string; title: string; done: boolean };

export function Priorities({ items }: { items: Priority[] }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await addPriority(title);
        setTitle("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="flex gap-2">
        <Input
          placeholder="Add a top priority…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button type="submit" size="icon" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No priorities set. What are the 3 things that matter most today?
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((p) => (
            <PriorityRow key={p.id} priority={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PriorityRow({ priority }: { priority: Priority }) {
  const [done, setDone] = useState(priority.done);
  const [isPending, startTransition] = useTransition();

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        done && "bg-muted/40"
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={(v) => {
          const next = Boolean(v);
          setDone(next);
          startTransition(async () => {
            try {
              await togglePriority(priority.id, next);
            } catch (e) {
              setDone(!next);
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          });
        }}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          done && "text-muted-foreground line-through"
        )}
      >
        {priority.title}
      </span>
      <button
        type="button"
        aria-label="Delete priority"
        disabled={isPending}
        className="text-muted-foreground hover:text-destructive"
        onClick={() =>
          startTransition(async () => {
            try {
              await deletePriority(priority.id);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          })
        }
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
