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

export async function saveAccountBalance(key: string, balance: number) {
  const { supabase, user } = await requireUser();
  const safe = Number.isFinite(balance) && balance >= 0 ? balance : 0;
  const { error } = await supabase.from("money_accounts").upsert(
    { user_id: user.id, key, balance: safe, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}
