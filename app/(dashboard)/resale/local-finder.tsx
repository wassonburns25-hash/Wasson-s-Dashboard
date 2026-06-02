"use client";

import { useState, useTransition } from "react";
import { suggestLocalVenues, type LocalVenue } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Search, ShieldCheck, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export function LocalFinder() {
  const [location, setLocation] = useState("");
  const [items, setItems] = useState("sneakers, lacrosse gear, clothes");
  const [venues, setVenues] = useState<LocalVenue[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) {
      toast.error("Enter a city, town, or ZIP code");
      return;
    }
    startTransition(async () => {
      try {
        const result = await suggestLocalVenues(location, items);
        setVenues(result);
        setSearched(true);
        if (result.length === 0) toast.error("No ideas came back — try again");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Sell locally
          </CardTitle>
          <CardDescription>
            Find nearby ways to sell in person — flea markets, consignment & buy-
            sell-trade shops, and safe local meetup options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lf-loc">Your city, town, or ZIP</Label>
              <Input
                id="lf-loc"
                placeholder="e.g. Boston, MA or 02115"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lf-items">What are you selling?</Label>
              <Input
                id="lf-items"
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Finding ideas…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Find local spots
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {venues.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {venues.map((v, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{v.name}</p>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {v.type}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{v.why}</p>
                <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  {v.tip}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searched && venues.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            These are AI suggestions to research, not verified live listings.
            For any in-person sale, meet in a public, well-lit place (many police
            stations offer safe-exchange zones), bring a friend, and prefer cash
            or instant payment.
          </span>
        </div>
      )}
    </div>
  );
}
