"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { analyzeItem, addListing, type ItemAnalysis } from "./actions";
import {
  CATEGORIES,
  CONDITIONS,
  MARKETPLACES,
} from "./labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { ListingCategory, ListingCondition } from "@/lib/types";
import { Camera, Loader2, Sparkles, Check, X, Tag } from "lucide-react";
import { toast } from "sonner";

type Draft = {
  title: string;
  category: ListingCategory;
  brand: string;
  item_size: string;
  condition: ListingCondition;
  recommended_marketplace: string;
  price_low: string;
  price_high: string;
  asking_price: string;
  ai_summary: string;
};

function fileToBase64(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function analysisToDraft(a: ItemAnalysis): Draft {
  const mid = Math.round((a.price_low + a.price_high) / 2);
  return {
    title: a.title,
    category: a.category,
    brand: a.brand,
    item_size: a.item_size,
    condition: a.condition,
    recommended_marketplace: a.recommended_marketplace,
    price_low: String(a.price_low),
    price_high: String(a.price_high),
    asking_price: mid > 0 ? String(mid) : "",
    ai_summary: a.summary,
  };
}

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "clothing",
  brand: "",
  item_size: "",
  condition: "good",
  recommended_marketplace: "",
  price_low: "",
  price_high: "",
  asking_price: "",
  ai_summary: "",
};

export function AddItem() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [analysis, setAnalysis] = useState<ItemAnalysis | null>(null);
  const [reading, setReading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  }

  function reset() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDraft(null);
    setAnalysis(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB)");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setReading(true);
    try {
      const { base64, mediaType } = await fileToBase64(picked);
      const result = await analyzeItem(base64, mediaType);
      setAnalysis(result);
      setDraft(analysisToDraft(result));
      toast.success("Analyzed — review and save below.");
    } catch (err) {
      // Still let them fill it in by hand.
      setDraft({ ...EMPTY_DRAFT });
      toast.error(
        err instanceof Error ? err.message : "Couldn't analyze the photo"
      );
    } finally {
      setReading(false);
    }
  }

  function startManual() {
    setDraft({ ...EMPTY_DRAFT });
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!file) return null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listings")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        // Non-fatal: save the listing without the stored photo.
        return null;
      }
      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  }

  function save(status: "draft" | "listed") {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Add a title first");
      return;
    }
    startTransition(async () => {
      try {
        const photo_url = await uploadPhoto();
        await addListing({
          title: draft.title,
          category: draft.category,
          brand: draft.brand || null,
          item_size: draft.item_size || null,
          condition: draft.condition,
          photo_url,
          recommended_marketplace: draft.recommended_marketplace || null,
          price_low: Number(draft.price_low) || 0,
          price_high: Number(draft.price_high) || 0,
          asking_price: draft.asking_price ? Number(draft.asking_price) : null,
          ai_summary: draft.ai_summary || null,
          status,
        });
        toast.success(
          status === "listed" ? "Added to your active listings" : "Saved as draft"
        );
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Add an item to sell
        </CardTitle>
        <CardDescription>
          Snap a photo and let AI suggest where to sell it and for how much —
          then tweak anything before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={reading || isPending}
          >
            {reading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing photo…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" /> Take / upload photo
              </>
            )}
          </Button>
          {!draft && (
            <Button
              type="button"
              variant="secondary"
              onClick={startManual}
              disabled={reading || isPending}
            >
              <Tag className="h-4 w-4" /> Enter manually
            </Button>
          )}
        </div>

        {preview && (
          <div className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Item preview"
              className="max-h-64 w-full object-contain bg-muted"
            />
          </div>
        )}

        {analysis && (
          <div className="rounded-lg border bg-primary/5 p-3 text-sm">
            <p className="font-medium">
              Recommended: {analysis.recommended_marketplace}
            </p>
            <p className="text-muted-foreground">{analysis.marketplace_reason}</p>
            {analysis.alt_marketplaces.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Also consider: {analysis.alt_marketplaces.join(", ")}
              </p>
            )}
          </div>
        )}

        {draft && (
          <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Review listing</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={reset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-title">Title</Label>
              <Input
                id="ai-title"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Nike Air Max 90 — Mens 10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => set("category", v as ListingCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={draft.condition}
                  onValueChange={(v) => set("condition", v as ListingCondition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ai-brand">Brand</Label>
                <Input
                  id="ai-brand"
                  value={draft.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Nike, STX, …"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-size">Size</Label>
                <Input
                  id="ai-size"
                  value={draft.item_size}
                  onChange={(e) => set("item_size", e.target.value)}
                  placeholder="M, 10.5, 32x30…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Best marketplace</Label>
              <Select
                value={draft.recommended_marketplace || undefined}
                onValueChange={(v) => set("recommended_marketplace", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose where to sell" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ai-low">Est. low ($)</Label>
                <Input
                  id="ai-low"
                  type="number"
                  inputMode="decimal"
                  value={draft.price_low}
                  onChange={(e) => set("price_low", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-high">Est. high ($)</Label>
                <Input
                  id="ai-high"
                  type="number"
                  inputMode="decimal"
                  value={draft.price_high}
                  onChange={(e) => set("price_high", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-ask">Asking ($)</Label>
                <Input
                  id="ai-ask"
                  type="number"
                  inputMode="decimal"
                  value={draft.asking_price}
                  onChange={(e) => set("asking_price", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-summary">Notes / description</Label>
              <Textarea
                id="ai-summary"
                rows={3}
                value={draft.ai_summary}
                onChange={(e) => set("ai_summary", e.target.value)}
                placeholder="Condition details, selling tips…"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                onClick={() => save("listed")}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Add to active listings
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => save("draft")}
                disabled={isPending}
              >
                Save as draft
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
