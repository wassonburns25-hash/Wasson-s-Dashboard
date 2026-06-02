import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProfileEditor } from "./profile-editor";
import { ContactForm } from "./contact-form";
import { ContactList, type Contact } from "./contact-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const supabase = createClient();

  const [{ data: profile }, { data: contactsData }] = await Promise.all([
    supabase.from("outreach_profile").select("background").maybeSingle(),
    supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const background = (profile?.background as string | undefined) ?? "";
  const contacts = (contactsData ?? []) as Contact[];

  return (
    <div>
      <PageHeader
        title="Networking"
        description="Track people you want to reach and draft tailored outreach."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your background</CardTitle>
          <CardDescription>
            Used to personalize every AI outreach draft. Save once, reuse for all
            contacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditor initial={background} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add a contact</CardTitle>
            <CardDescription>
              Someone at a company you&apos;d like to work with or for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactList contacts={contacts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
