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

export type MealEstimate = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

const ESTIMATE_SCHEMA = {
  type: "object",
  properties: {
    calories: { type: "integer", description: "Total estimated calories" },
    protein_g: { type: "integer", description: "Total protein in grams" },
    carbs_g: { type: "integer", description: "Total carbohydrates in grams" },
    fat_g: { type: "integer", description: "Total fat in grams" },
  },
  required: ["calories", "protein_g", "carbs_g", "fat_g"],
  additionalProperties: false,
} as const;

/** Estimate calories + macros for a free-text meal description using Claude. */
export async function estimateMeal(description: string): Promise<MealEstimate> {
  await requireUser();
  const text = description.trim();
  if (!text) throw new Error("Describe what you ate first");

  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "AI estimation isn't configured yet (missing ANTHROPIC_API_KEY). You can still enter calories manually."
    );
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system:
      "You are a sports nutritionist. Estimate the total calories and macros " +
      "(protein, carbs, fat in grams) for the meal the user describes. Assume " +
      "typical portion sizes when unspecified. Return realistic whole-number estimates.",
    output_config: { format: { type: "json_schema", schema: ESTIMATE_SCHEMA } },
    messages: [{ role: "user", content: text }],
  });

  const parsed = parseJsonObject<MealEstimate>(firstText(response.content));
  return {
    calories: Math.max(0, Math.round(parsed.calories || 0)),
    protein_g: Math.max(0, Math.round(parsed.protein_g || 0)),
    carbs_g: Math.max(0, Math.round(parsed.carbs_g || 0)),
    fat_g: Math.max(0, Math.round(parsed.fat_g || 0)),
  };
}

export async function addMeal(input: {
  eaten_on: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    eaten_on: input.eaten_on,
    description: input.description,
    calories: input.calories,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
}

export async function deleteMeal(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
}

export async function logWeight(input: { weigh_date: string; weight_lb: number }) {
  const { supabase, user } = await requireUser();
  if (!input.weight_lb || input.weight_lb <= 0) throw new Error("Enter your weight");
  const { error } = await supabase.from("weights").upsert(
    {
      user_id: user.id,
      weigh_date: input.weigh_date,
      weight_lb: input.weight_lb,
    },
    { onConflict: "user_id,weigh_date" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/command");
}
