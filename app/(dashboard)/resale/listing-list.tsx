"use client";

import { useState, useTransition } from "react";
import {
  setListingStatus,
  markListingSold,
  deleteListing,
  addFundContribution,
} from "./actions";
import { categoryLabel, conditionLabel } from "./labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/lib/types";
import { formatCurrency, todayISO } from "@/lib/utils";
import {
  Loader2,
  Trash2,
  Check,
  Tag,
  DollarSign,
  PiggyBank,
  Store,
} from "lucide-react";
import { toast } from "sonner";

function priceRange(l: Listing): string {
  if (l.asking_price) return formatCurrency(Number(l.asking_price));
  if (l.price_low || l.price_high)
    return `${formatCurrency(Number(l.price_low))}–${formatCurrency(Number(l.price_high))}`;
  return "—";
}

function ListingRow({
  listing,
  allocationPct,
  contributed,
}: {
  listing: Listing;
  allocationPct: number;
  contributed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [selling, setSelling] = useState(false);
  const [soldPrice, setSoldPrice] = useState(
    listing.asking_price ? String(listing.asking_price) : ""
  );
  const [soldMarket, setSoldMarket] = useState(
    listing.recommended_marketplace ?? ""
  );
  const [soldOn, setSoldOn] = useState(todayISO());

  function confirmSold() {
    const price = Number(soldPrice);
    if (!price || price <= 0) {
      toast.error("Enter the sale price");
      return;
    }
    startTransition(async () => {
      try {
        await markListingSold(listing.id, {
          sold_price: price,
          sold_marketplace: soldMarket,
          sold_on: soldOn,
        });
        toast.success("Marked as sold 🎉");
        setSelling(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function action(fn: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function investProceeds() {
    const proceeds = Number(listing.sold_price) || 0;
    const amount = Math.round((proceeds * allocationPct) / 100 * 100) / 100;
    if (amount <= 0) {
      toast.error("No proceeds to invest");
      return;
    }
    action(
      () =>
        addFundContribution({
          amount,
          source: "sale",
          listing_id: listing.id,
          note: listing.title,
          occurred_on: listing.sold_on ?? todayISO(),
        }),
      `Added ${formatCurrency(amount)} to your fund`
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-start">
      {listing.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.photo_url}
          alt={listing.title}
          className="h-20 w-20 flex-shrink-0 rounded-md object-cover bg-muted"
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Tag className="h-6 w-6" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{listing.title}</p>
            <p className="text-xs text-muted-foreground">
              {categoryLabel(listing.category)} · {conditionLabel(listing.condition)}
              {listing.item_size ? ` · ${listing.item_size}` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Delete this listing?"))
                action(() => deleteListing(listing.id), "Deleted");
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {listing.status === "sold" ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              Sold · {formatCurrency(Number(listing.sold_price))}
            </Badge>
          ) : (
            <>
              <Badge variant="secondary">{priceRange(listing)}</Badge>
              {listing.recommended_marketplace && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="h-3 w-3" /> {listing.recommended_marketplace}
                </span>
              )}
            </>
          )}
        </div>

        {listing.ai_summary && listing.status !== "sold" && (
          <p className="mt-2 text-xs text-muted-foreground">{listing.ai_summary}</p>
        )}

        {/* Actions */}
        {listing.status === "sold" ? (
          <div className="mt-3">
            {contributed ? (
              <p className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <Check className="h-3 w-3" /> Proceeds added to fund
              </p>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={investProceeds}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <PiggyBank className="h-4 w-4" /> Invest {allocationPct}% of proceeds
                  </>
                )}
              </Button>
            )}
          </div>
        ) : selling ? (
          <div className="mt-3 space-y-2 rounded-md border bg-muted/40 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`sp-${listing.id}`} className="text-xs">
                  Sold for ($)
                </Label>
                <Input
                  id={`sp-${listing.id}`}
                  type="number"
                  inputMode="decimal"
                  className="h-8"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`sd-${listing.id}`} className="text-xs">
                  Date
                </Label>
                <Input
                  id={`sd-${listing.id}`}
                  type="date"
                  className="h-8"
                  value={soldOn}
                  onChange={(e) => setSoldOn(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`sm-${listing.id}`} className="text-xs">
                Where it sold
              </Label>
              <Input
                id={`sm-${listing.id}`}
                className="h-8"
                placeholder="eBay, Grailed, local…"
                value={soldMarket}
                onChange={(e) => setSoldMarket(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmSold} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Confirm sale
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelling(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSelling(true)} disabled={isPending}>
              <DollarSign className="h-4 w-4" /> Mark sold
            </Button>
            {listing.status === "draft" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  action(
                    () => setListingStatus(listing.id, "listed"),
                    "Moved to active listings"
                  )
                }
                disabled={isPending}
              >
                List it
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ListingList({
  listings,
  allocationPct,
  contributedIds,
}: {
  listings: Listing[];
  allocationPct: number;
  contributedIds: string[];
}) {
  const contributed = new Set(contributedIds);
  const active = listings.filter(
    (l) => l.status === "draft" || l.status === "listed"
  );
  const sold = listings.filter((l) => l.status === "sold");

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Tag className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No items yet. Snap a photo above to get your first price estimate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            For sale <span className="ml-1 font-normal">{active.length}</span>
          </h3>
          <div className="space-y-3">
            {active.map((l) => (
              <ListingRow
                key={l.id}
                listing={l}
                allocationPct={allocationPct}
                contributed={contributed.has(l.id)}
              />
            ))}
          </div>
        </section>
      )}

      {sold.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sold <span className="ml-1 font-normal">{sold.length}</span>
          </h3>
          <div className="space-y-3">
            {sold.map((l) => (
              <ListingRow
                key={l.id}
                listing={l}
                allocationPct={allocationPct}
                contributed={contributed.has(l.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
