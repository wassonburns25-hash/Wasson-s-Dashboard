"use client";

import { useState, useTransition } from "react";
import {
  updateContactStatus,
  deleteContact,
  draftOutreach,
  type ContactStatus,
  type OutreachDraft,
} from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Sparkles,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  link: string | null;
  status: ContactStatus;
};

const STATUS_LABEL: Record<ContactStatus, string> = {
  to_contact: "To contact",
  contacted: "Contacted",
  responded: "Responded",
  meeting: "Meeting",
};

export function ContactList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contacts yet. Add people at companies you&apos;d like to work with,
        then generate a tailored outreach email.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {contacts.map((c) => (
        <ContactRow key={c.id} contact={c} />
      ))}
    </ul>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const [goal, setGoal] = useState("Summer 2026 internship");
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function makeDraft() {
    setDrafting(true);
    try {
      const result = await draftOutreach({
        name: contact.name,
        company: contact.company,
        role: contact.role,
        goal,
      });
      setDraft(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to draft");
    } finally {
      setDrafting(false);
    }
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Couldn't copy")
    );
  }

  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{contact.name}</span>
            {contact.link && (
              <a
                href={contact.link}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {[contact.role, contact.company].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={contact.status}
            onValueChange={(v) =>
              startTransition(async () => {
                try {
                  await updateContactStatus(contact.id, v as ContactStatus);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as ContactStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-label="Delete contact"
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteContact(contact.id);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What you're after (e.g. summer internship)"
          className="h-8 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={makeDraft}
          disabled={drafting}
        >
          {drafting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Draft email
            </>
          )}
        </Button>
      </div>

      {draft && (
        <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{draft.subject}</p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => copy(draft.subject, "Subject")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {draft.body}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => copy(`Subject: ${draft.subject}\n\n${draft.body}`, "Email")}
          >
            <Copy className="h-3.5 w-3.5" /> Copy full email
          </Button>
        </div>
      )}
    </li>
  );
}
