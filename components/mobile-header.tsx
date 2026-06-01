"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">Wasson&apos;s</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
