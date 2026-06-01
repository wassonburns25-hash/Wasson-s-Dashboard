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

export async function toggleProgramCheck(itemKey: string, checked: boolean) {
  const { supabase, user } = await requireUser();

  if (checked) {
    const { error } = await supabase
      .from("program_checks")
      .upsert(
        { user_id: user.id, item_key: itemKey },
        { onConflict: "user_id,item_key" }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("program_checks")
      .delete()
      .eq("user_id", user.id)
      .eq("item_key", itemKey);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/program");
}
