"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getAnthropic,
  AI_MODEL,
  firstText,
  parseJsonObject,
} from "@/lib/anthropic";
import type {
  ListingCategory,
  ListingCondition,
  ListingStatus,
} from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// AI: analyze a photo of an item and suggest where/how much to sell it for.
// ---------------------------------------------------------------------------

export type ItemAnalysis = {
  title: string;
  category: ListingCategory;
  brand: string;
  item_size: string;
  condition: ListingCondition;
  recommended_marketplace: string;
  marketplace_reason: string;
  alt_marketplaces: string[];
  price_low: number;
  price_high: number;
  summary: string;
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Short marketplace-ready listing title, e.g. 'Nike Air Max 90 - Triple White - Mens 10'",
    },
    category: {
      type: "string",
      enum: ["sneakers", "lacrosse", "clothing", "other"],
    },
    brand: { type: "string", description: "Brand if identifiable, else empty string" },
    item_size: { type: "string", description: "Size if visible (e.g. 'M', '10.5', '32x30'), else empty string" },
    condition: {
      type: "string",
      enum: ["new", "like_new", "good", "fair", "worn"],
    },
    recommended_marketplace: {
      type: "string",
      description:
        "Single best marketplace to sell on (eBay, StockX, GOAT, Grailed, SidelineSwap, Depop, Poshmark, or Facebook Marketplace)",
    },
    marketplace_reason: {
      type: "string",
      description: "One sentence on why that marketplace fits this item.",
    },
    alt_marketplaces: {
      type: "array",
      items: { type: "string" },
      description: "1-2 other good marketplaces for this item.",
    },
    price_low: { type: "number", description: "Low end of realistic USD resale price after fees." },
    price_high: { type: "number", description: "High end of realistic USD resale price." },
    summary: {
      type: "string",
      description:
        "2-3 sentences: what it is, condition notes, and one tip to sell it faster / for more.",
    },
  },
  required: [
    "title",
    "category",
    "brand",
    "item_size",
    "condition",
    "recommended_marketplace",
    "marketplace_reason",
    "alt_marketplaces",
    "price_low",
    "price_high",
    "summary",
  ],
  additionalProperties: false,
} as const;

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/**
 * Look at a photo of an item the user wants to sell and return a structured
 * analysis: the best trusted marketplace, a realistic resale price range, and
 * a listing title + tips. Uses Claude vision.
 */
export async function analyzeItem(
  base64: string,
  mediaType: string
): Promise<ItemAnalysis> {
  await requireUser();

  if (!ALLOWED_MEDIA.includes(mediaType as (typeof ALLOWED_MEDIA)[number])) {
    throw new Error("Unsupported image type — use JPEG, PNG, or WebP");
  }

  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "AI analysis isn't configured yet (missing ANTHROPIC_API_KEY). You can still add the item and prices manually."
    );
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    system:
      "You are a reselling expert who helps people sell used sneakers, " +
      "lacrosse / sports gear, and clothing on trusted marketplaces. Identify " +
      "the item in the photo, judge its condition honestly, and recommend the " +
      "single best marketplace to sell it on, choosing from: eBay, StockX, " +
      "GOAT, Grailed, SidelineSwap, Depop, Poshmark, or Facebook Marketplace. " +
      "Rules of thumb: hyped/new sneakers -> StockX or GOAT; general or vintage " +
      "sneakers -> eBay; streetwear & designer menswear -> Grailed; trendy / " +
      "everyday clothing -> Depop or Poshmark; lacrosse and sports gear -> " +
      "SidelineSwap; bulky or local-only items -> Facebook Marketplace. Give a " +
      "realistic USD resale price RANGE for the secondhand market (not retail), " +
      "accounting for condition. Be conservative and honest — never inflate " +
      "prices. If you cannot identify the item, make your best guess and widen " +
      "the price range.",
    output_config: { format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/webp"
                | "image/gif",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Analyze this item I want to sell. Where should I sell it and for how much?",
          },
        ],
      },
    ],
  });

  const parsed = parseJsonObject<ItemAnalysis>(firstText(response.content));
  const low = Math.max(0, Math.round(Number(parsed.price_low) || 0));
  const high = Math.max(low, Math.round(Number(parsed.price_high) || 0));
  return {
    title: String(parsed.title || "Untitled item").slice(0, 140),
    category: parsed.category,
    brand: String(parsed.brand || "").slice(0, 80),
    item_size: String(parsed.item_size || "").slice(0, 40),
    condition: parsed.condition,
    recommended_marketplace: String(parsed.recommended_marketplace || "").slice(0, 60),
    marketplace_reason: String(parsed.marketplace_reason || "").slice(0, 300),
    alt_marketplaces: (parsed.alt_marketplaces ?? [])
      .map((m) => String(m).slice(0, 60))
      .slice(0, 3),
    price_low: low,
    price_high: high,
    summary: String(parsed.summary || "").slice(0, 600),
  };
}

// ---------------------------------------------------------------------------
// AI: suggest local places to sell in person ("set up a stand").
// ---------------------------------------------------------------------------

export type LocalVenue = {
  name: string;
  type: string;
  why: string;
  tip: string;
};

const VENUES_SCHEMA = {
  type: "object",
  properties: {
    venues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Type of venue or a well-known chain (e.g. 'Play It Again Sports', 'Local flea market')" },
          type: { type: "string", description: "Short category label, e.g. 'Consignment', 'Flea market', 'Online local'" },
          why: { type: "string", description: "Why it fits the items being sold." },
          tip: { type: "string", description: "One practical tip for selling there." },
        },
        required: ["name", "type", "why", "tip"],
        additionalProperties: false,
      },
    },
  },
  required: ["venues"],
  additionalProperties: false,
} as const;

/**
 * Suggest local, in-person ways to sell near a given area. These are ideas /
 * categories of venue (we can't pull live listings) the user can then look up.
 */
export async function suggestLocalVenues(
  location: string,
  itemKinds: string
): Promise<LocalVenue[]> {
  await requireUser();
  const place = location.trim();
  if (!place) throw new Error("Enter a city, town, or ZIP code");

  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "AI suggestions aren't configured yet (missing ANTHROPIC_API_KEY)."
    );
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    system:
      "You help people sell secondhand sneakers, sports gear, and clothing in " +
      "person near where they live. Suggest 5-6 realistic types of local venues " +
      "and how to find them — e.g. flea markets, consignment & buy-sell-trade " +
      "shops (Plato's Closet, Play It Again Sports, local consignment), " +
      "community / church yard sales, college campus sale groups, sneaker " +
      "meetups or conventions, and local online options (Facebook Marketplace " +
      "with public meetup spots, Nextdoor, OfferUp). Tailor to the items and the " +
      "area's general size when known. Always include a safety reminder to meet " +
      "in public, well-lit places. Keep each entry concise.",
    output_config: { format: { type: "json_schema", schema: VENUES_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `I'm near ${place}. I want to sell: ${itemKinds || "sneakers, lacrosse gear, and clothes"}. Where could I sell these locally or set up a stand?`,
      },
    ],
  });

  const parsed = parseJsonObject<{ venues: LocalVenue[] }>(
    firstText(response.content)
  );
  return (parsed.venues ?? []).slice(0, 8).map((v) => ({
    name: String(v.name || "").slice(0, 120),
    type: String(v.type || "").slice(0, 40),
    why: String(v.why || "").slice(0, 300),
    tip: String(v.tip || "").slice(0, 300),
  }));
}

// ---------------------------------------------------------------------------
// Listings CRUD
// ---------------------------------------------------------------------------

export async function addListing(input: {
  title: string;
  category: ListingCategory;
  brand: string | null;
  item_size: string | null;
  condition: ListingCondition;
  photo_url: string | null;
  recommended_marketplace: string | null;
  price_low: number;
  price_high: number;
  asking_price: number | null;
  ai_summary: string | null;
  status?: ListingStatus;
  notes?: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (!input.title.trim()) throw new Error("A title is required");
  const { error } = await supabase.from("listings").insert({
    user_id: user.id,
    title: input.title.trim(),
    category: input.category,
    brand: input.brand || null,
    item_size: input.item_size || null,
    condition: input.condition,
    photo_url: input.photo_url || null,
    recommended_marketplace: input.recommended_marketplace || null,
    price_low: input.price_low,
    price_high: input.price_high,
    asking_price: input.asking_price,
    ai_summary: input.ai_summary || null,
    status: input.status ?? "draft",
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
}

export async function setListingStatus(id: string, status: ListingStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
}

export async function markListingSold(
  id: string,
  input: { sold_price: number; sold_marketplace: string; sold_on: string }
) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("listings")
    .update({
      status: "sold",
      sold_price: input.sold_price,
      sold_marketplace: input.sold_marketplace || null,
      sold_on: input.sold_on,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function deleteListing(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
  revalidatePath("/finance");
}

// ---------------------------------------------------------------------------
// Investment fund
// ---------------------------------------------------------------------------

export async function updateFundSettings(input: {
  fund_name?: string;
  current_value?: number;
  allocation_pct?: number;
}) {
  const { supabase, user } = await requireUser();
  const patch: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (input.fund_name !== undefined) patch.fund_name = input.fund_name.trim() || "Investment Fund";
  if (input.current_value !== undefined)
    patch.current_value = Math.max(0, input.current_value);
  if (input.allocation_pct !== undefined)
    patch.allocation_pct = Math.max(0, Math.min(100, Math.round(input.allocation_pct)));

  const { error } = await supabase
    .from("fund_settings")
    .upsert(patch, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
}

export async function addFundContribution(input: {
  amount: number;
  kind?: "contribution" | "withdrawal";
  source?: "sale" | "manual";
  listing_id?: string | null;
  note?: string | null;
  occurred_on?: string;
}) {
  const { supabase, user } = await requireUser();
  const amount = Math.round((input.amount || 0) * 100) / 100;
  if (amount <= 0) throw new Error("Enter an amount greater than 0");
  const { error } = await supabase.from("fund_contributions").insert({
    user_id: user.id,
    amount,
    kind: input.kind ?? "contribution",
    source: input.source ?? "manual",
    listing_id: input.listing_id ?? null,
    note: input.note || null,
    occurred_on: input.occurred_on ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
}

export async function deleteFundContribution(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("fund_contributions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/resale");
}
