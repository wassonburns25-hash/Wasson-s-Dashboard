"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function upsertDailyLog(input: {
  log_date?: string;
  lifted?: boolean;
  nutrition_on_track?: boolean;
  schoolwork_done?: boolean;
  mood?: number | null;
  energy?: number | null;
  earnings?: number;
}) {
  const { supabase, user } = await requireUser();
  const log_date = input.log_date ?? todayISO();

  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      log_date,
      ...("lifted" in input ? { lifted: input.lifted } : {}),
      ...("nutrition_on_track" in input
        ? { nutrition_on_track: input.nutrition_on_track }
        : {}),
      ...("schoolwork_done" in input
        ? { schoolwork_done: input.schoolwork_done }
        : {}),
      ...("mood" in input ? { mood: input.mood } : {}),
      ...("energy" in input ? { energy: input.energy } : {}),
      ...("earnings" in input ? { earnings: input.earnings } : {}),
    },
    { onConflict: "user_id,log_date" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/finance");
}
