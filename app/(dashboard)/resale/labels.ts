import type { ListingCategory, ListingCondition } from "@/lib/types";

export const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: "sneakers", label: "Sneakers" },
  { value: "lacrosse", label: "Lacrosse / Sports gear" },
  { value: "clothing", label: "Clothing" },
  { value: "other", label: "Other" },
];

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: "new", label: "New / Deadstock" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
];

export const categoryLabel = (c: ListingCategory) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c;

export const conditionLabel = (c: ListingCondition) =>
  CONDITIONS.find((x) => x.value === c)?.label ?? c;

/** Trusted marketplaces, used to power the manual marketplace dropdown. */
export const MARKETPLACES = [
  "eBay",
  "StockX",
  "GOAT",
  "Grailed",
  "SidelineSwap",
  "Depop",
  "Poshmark",
  "Facebook Marketplace",
  "Local / In person",
];
