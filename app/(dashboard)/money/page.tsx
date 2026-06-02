import { createClient } from "@/lib/supabase/server";
import { MoneyDashboard } from "./money-dashboard";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const supabase = createClient();
  const { data } = await supabase.from("money_accounts").select("key, balance");

  const initial: Record<string, number> = {};
  for (const row of data ?? []) {
    initial[(row as { key: string }).key] = Number(
      (row as { balance: number }).balance
    );
  }

  return <MoneyDashboard initial={initial} />;
}
