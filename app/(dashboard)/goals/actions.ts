"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GoalCategory, GoalStatus } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function addGoal(input: {
  title: string;
  category: GoalCategory;
  deadline: string | null;
  progress: number;
  status: GoalStatus;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: input.title,
    category: input.category,
    deadline: input.deadline,
    progress: input.progress,
    status: input.status,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function updateGoal(
  id: string,
  patch: Partial<{
    title: string;
    category: GoalCategory;
    deadline: string | null;
    progress: number;
    status: GoalStatus;
  }>
) {
  const { supabase } = await requireUser();
  // Keep status in sync when progress hits 100.
  if (patch.progress !== undefined && patch.status === undefined) {
    patch.status = patch.progress >= 100 ? "completed" : "active";
  }
  const { error } = await supabase.from("goals").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}
