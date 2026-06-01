import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProgramView } from "./program-view";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const supabase = createClient();
  const { data } = await supabase.from("program_checks").select("item_key");
  const checks = (data ?? []).map((r) => r.item_key as string);

  return (
    <div>
      <PageHeader
        title="Training Program"
        description="Bucknell lacrosse summer calendar — check off each day."
      />
      <ProgramView initialChecks={checks} today={todayISO()} />
    </div>
  );
}
