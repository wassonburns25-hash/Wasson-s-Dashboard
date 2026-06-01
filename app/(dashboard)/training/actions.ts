"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function addWorkout(input: {
  workout_date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    workout_date: input.workout_date,
    exercise: input.exercise,
    sets: input.sets,
    reps: input.reps,
    weight: input.weight,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training");
}

export async function deleteWorkout(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/training");
}
