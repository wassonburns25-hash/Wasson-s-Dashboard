import { redirect } from "next/navigation";

// The money dashboard now lives under the Finances tab.
export default function MoneyPage() {
  redirect("/finance");
}
