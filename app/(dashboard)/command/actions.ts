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

export async function addPriority(title: string) {
  const { supabase, user } = await requireUser();
  const t = title.trim();
  if (!t) throw new Error("Enter a priority");
  const { error } = await supabase
    .from("priorities")
    .insert({ user_id: user.id, title: t });
  if (error) throw new Error(error.message);
  revalidatePath("/command");
}

export async function togglePriority(id: string, done: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("priorities")
    .update({ done })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/command");
}

export async function deletePriority(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("priorities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/command");
}
