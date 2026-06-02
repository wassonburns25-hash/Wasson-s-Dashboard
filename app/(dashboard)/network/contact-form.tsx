"use client";

import { useState, useTransition } from "react";
import { addContact } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    startTransition(async () => {
      try {
        await addContact({
          name: name.trim(),
          company: company.trim() || null,
          role: role.trim() || null,
          link: link.trim() || null,
        });
        toast.success("Contact added");
        setName("");
        setCompany("");
        setRole("");
        setLink("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <Input
          placeholder="Role / title"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <Input
          placeholder="LinkedIn / profile URL"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add contact
          </>
        )}
      </Button>
    </form>
  );
}
