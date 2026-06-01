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

export async function addTrip(input: {
  destination: string;
  start_date: string;
  end_date: string | null;
  purpose: string | null;
  notes: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("trips").insert({
    user_id: user.id,
    destination: input.destination,
    start_date: input.start_date,
    end_date: input.end_date,
    purpose: input.purpose,
    notes: input.notes,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/trips");
}

export async function deleteTrip(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trips");
}
