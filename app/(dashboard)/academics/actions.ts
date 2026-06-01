"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  AssignmentPriority,
  AssignmentStatus,
} from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function addAssignment(input: {
  course: string;
  title: string;
  due_date: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("assignments").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/academics");
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus
) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("assignments")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/academics");
}

export async function deleteAssignment(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/academics");
}

export async function addWorkLog(input: {
  work_date: string;
  hours: number;
  pay_rate: number;
  note?: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("work_logs").insert({
    user_id: user.id,
    work_date: input.work_date,
    hours: input.hours,
    pay_rate: input.pay_rate,
    note: input.note || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/academics");
  revalidatePath("/finance");
}

export async function deleteWorkLog(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("work_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/academics");
  revalidatePath("/finance");
}
