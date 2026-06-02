import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { AddItem } from "./add-item";
import { ListingList } from "./listing-list";
import { LocalFinder } from "./local-finder";
import { FundPanel } from "./fund-panel";
import type {
  Listing,
  FundContribution,
  FundSettings,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Tags, ShoppingBag, DollarSign, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function midpoint(l: Listing): number {
  if (l.asking_price) return Number(l.asking_price);
  const low = Number(l.price_low) || 0;
  const high = Number(l.price_high) || 0;
  if (low && high) return (low + high) / 2;
  return low || high;
}

export default async function ResalePage() {
  const supabase = createClient();

  const [
    { data: listingsData },
    { data: contributionsData },
    { data: settingsData },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("fund_contributions")
      .select("*")
      .order("occurred_on", { ascending: false }),
    supabase.from("fund_settings").select("*").maybeSingle(),
  ]);

  const listings = (listingsData ?? []) as Listing[];
  const contributions = (contributionsData ?? []) as FundContribution[];
  const settings: FundSettings = (settingsData as FundSettings | null) ?? {
    user_id: "",
    fund_name: "Investment Fund",
    current_value: 0,
    allocation_pct: 100,
    updated_at: new Date().toISOString(),
  };

  const active = listings.filter(
    (l) => l.status === "draft" || l.status === "listed"
  );
  const sold = listings.filter((l) => l.status === "sold");
  const potential = active.reduce((s, l) => s + midpoint(l), 0);
  const soldTotal = sold.reduce((s, l) => s + (Number(l.sold_price) || 0), 0);

  const netInvested = contributions.reduce(
    (s, c) => s + (c.kind === "withdrawal" ? -1 : 1) * Number(c.amount),
    0
  );
  const contributedIds = contributions
    .filter((c) => c.source === "sale" && c.listing_id)
    .map((c) => c.listing_id as string);

  return (
    <div>
      <PageHeader
        title="Flipfolio"
        description="Photograph what you're selling, get an AI price + marketplace pick, and turn the proceeds into investments."
      />

      <Tabs defaultValue="sell">
        <TabsList className="mb-6">
          <TabsTrigger value="sell">
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Sell
          </TabsTrigger>
          <TabsTrigger value="local">
            <Tags className="mr-1.5 h-4 w-4" /> Local
          </TabsTrigger>
          <TabsTrigger value="fund">
            <DollarSign className="mr-1.5 h-4 w-4" /> Fund
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sell" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="For sale"
              value={String(active.length)}
              icon={ShoppingBag}
              hint={`${formatCurrency(potential)} potential`}
            />
            <StatCard
              label="Sold"
              value={String(sold.length)}
              icon={Tags}
            />
            <StatCard
              label="Total earned"
              value={formatCurrency(soldTotal)}
              icon={DollarSign}
            />
          </div>

          <AddItem />

          <ListingList
            listings={listings}
            allocationPct={settings.allocation_pct}
            contributedIds={contributedIds}
          />
        </TabsContent>

        <TabsContent value="local">
          <LocalFinder />
        </TabsContent>

        <TabsContent value="fund">
          <FundPanel
            settings={settings}
            contributions={contributions}
            netInvested={netInvested}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          <span className="font-medium text-foreground">Heads up:</span> AI price
          estimates are starting points, not guarantees — real sale prices depend
          on demand, fees, and condition. You sell directly through each
          marketplace under their terms; Flipfolio just helps you organize.
          You&rsquo;re responsible for honest descriptions, shipping, and any
          taxes on what you earn. For in-person sales, meet in public and stay
          safe.
        </span>
      </div>
    </div>
  );
}
