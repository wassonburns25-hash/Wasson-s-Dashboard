"use client";

import { useState, useTransition } from "react";
import { addAssignment } from "./actions";
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
import type { AssignmentPriority, AssignmentStatus } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function AssignmentForm() {
  const [course, setCourse] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(todayISO());
  const [priority, setPriority] = useState<AssignmentPriority>("medium");
  const [status, setStatus] = useState<AssignmentStatus>("not_started");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !course.trim()) {
      toast.error("Course and title are required");
      return;
    }
    startTransition(async () => {
      try {
        await addAssignment({
          course: course.trim(),
          title: title.trim(),
          due_date: due,
          priority,
          status,
        });
        toast.success("Assignment added");
        setTitle("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="a-course">Course</Label>
          <Input
            id="a-course"
            placeholder="Biology 201"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-due">Due date</Label>
          <Input
            id="a-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="a-title">Assignment</Label>
        <Input
          id="a-title"
          placeholder="Chapter 4 problem set"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as AssignmentPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as AssignmentStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add assignment
          </>
        )}
      </Button>
    </form>
  );
}
