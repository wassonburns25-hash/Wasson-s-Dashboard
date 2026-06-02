"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function ProfileEditor({ initial }: { initial: string }) {
  const [background, setBackground] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Textarea
        value={background}
        onChange={(e) => setBackground(e.target.value)}
        placeholder="Paste a short resume summary: your school, major, year, key experience, skills, athletics, and the kind of role you're after. This is used to personalize every outreach draft."
        className="min-h-[120px]"
      />
      <Button
        onClick={() =>
          startTransition(async () => {
            try {
              await saveProfile(background);
              toast.success("Background saved");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          })
        }
        disabled={isPending}
        variant="secondary"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4" /> Save background
          </>
        )}
      </Button>
    </div>
  );
}
