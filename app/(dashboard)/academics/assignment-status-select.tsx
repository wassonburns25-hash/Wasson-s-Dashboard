"use client";

import { useTransition } from "react";
import { updateAssignmentStatus } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssignmentStatus } from "@/lib/types";
import { toast } from "sonner";

export function AssignmentStatusSelect({
  id,
  status,
}: {
  id: string;
  status: AssignmentStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(v) =>
        startTransition(async () => {
          try {
            await updateAssignmentStatus(id, v as AssignmentStatus);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        })
      }
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="not_started">Not started</SelectItem>
        <SelectItem value="in_progress">In progress</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}
