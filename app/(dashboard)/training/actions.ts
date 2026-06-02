"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getAnthropic,
  AI_MODEL,
  firstText,
  parseJsonObject,
} from "@/lib/anthropic";

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

export type ExtractedExercise = {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
};

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    workouts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          exercise: { type: "string" },
          sets: { type: "integer" },
          reps: { type: "integer" },
          weight: { type: "number", description: "Weight in pounds (0 if bodyweight)" },
        },
        required: ["exercise", "sets", "reps", "weight"],
        additionalProperties: false,
      },
    },
  },
  required: ["workouts"],
  additionalProperties: false,
} as const;

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/**
 * Read a photo of a workout journal or training-app screen (e.g. Bridge
 * Athletic) and extract the exercises into structured entries via Claude vision.
 */
export async function extractWorkoutFromPhoto(
  base64: string,
  mediaType: string
): Promise<ExtractedExercise[]> {
  await requireUser();

  if (!ALLOWED_MEDIA.includes(mediaType as (typeof ALLOWED_MEDIA)[number])) {
    throw new Error("Unsupported image type — use JPEG, PNG, or WebP");
  }

  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "Photo import isn't configured yet (missing ANTHROPIC_API_KEY). You can still log workouts manually."
    );
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    thinking: { type: "disabled" },
    system:
      "You read photos of workout journals and training-app screens (e.g. " +
      "Bridge Athletic). Extract every strength exercise into structured rows. " +
      "For each: exercise name, number of sets, reps per set, and weight in " +
      "pounds (use 0 for bodyweight). If a set scheme varies, use the most " +
      "representative working set. Ignore warmups, cardio, and notes.",
    output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract all the strength exercises from this image.",
          },
        ],
      },
    ],
  });

  const parsed = parseJsonObject<{ workouts: ExtractedExercise[] }>(
    firstText(response.content)
  );
  return (parsed.workouts ?? []).map((w) => ({
    exercise: String(w.exercise || "").slice(0, 120),
    sets: Math.max(0, Math.round(w.sets || 0)),
    reps: Math.max(0, Math.round(w.reps || 0)),
    weight: Math.max(0, Number(w.weight) || 0),
  }));
}

export async function addWorkoutsBulk(
  workoutDate: string,
  entries: ExtractedExercise[]
) {
  const { supabase, user } = await requireUser();
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({
    user_id: user.id,
    workout_date: workoutDate,
    exercise: e.exercise,
    sets: e.sets,
    reps: e.reps,
    weight: e.weight,
    notes: null,
  }));
  const { error } = await supabase.from("workouts").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/training");
}
