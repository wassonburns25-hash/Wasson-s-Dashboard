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

export type ContactStatus = "to_contact" | "contacted" | "responded" | "meeting";

export async function addContact(input: {
  name: string;
  company: string | null;
  role: string | null;
  link: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (!input.name.trim()) throw new Error("Name is required");
  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    name: input.name.trim(),
    company: input.company,
    role: input.role,
    link: input.link,
    status: "to_contact",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/network");
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contacts").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/network");
}

export async function deleteContact(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/network");
}

export async function saveProfile(background: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("outreach_profile").upsert(
    { user_id: user.id, background, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/network");
}

export type OutreachDraft = { subject: string; body: string };

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

/** Draft a cold-outreach email to a contact, tailored with the user's background. */
export async function draftOutreach(input: {
  name: string;
  company: string | null;
  role: string | null;
  goal: string; // e.g. "summer 2026 internship"
}): Promise<OutreachDraft> {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("outreach_profile")
    .select("background")
    .eq("user_id", user.id)
    .maybeSingle();
  const background = (profile?.background as string | undefined)?.trim();

  if (!background) {
    throw new Error(
      "Add your background/resume summary first (the field at the top) so drafts can be personalized."
    );
  }

  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "AI drafting isn't configured yet (missing ANTHROPIC_API_KEY)."
    );
  }

  const target = [
    `Name: ${input.name}`,
    input.role ? `Role: ${input.role}` : null,
    input.company ? `Company: ${input.company}` : null,
    `My goal: ${input.goal || "a summer internship / job conversation"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system:
      "You write concise, genuine cold-outreach emails for a college student " +
      "seeking internships/jobs. Tone: warm, specific, confident but humble. " +
      "Keep the body under ~150 words, no clichés, one clear ask (a short call " +
      "or to share a resume). Reference the recipient's company/role naturally. " +
      "Do not invent facts about the student beyond the background provided.",
    output_config: { format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          `Write an outreach email.\n\nMy background:\n${background}\n\n` +
          `Recipient:\n${target}`,
      },
    ],
  });

  return parseJsonObject<OutreachDraft>(firstText(response.content));
}
