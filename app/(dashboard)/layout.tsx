import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar email={user.email} />
      <MobileHeader />
      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
