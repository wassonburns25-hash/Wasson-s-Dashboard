"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LayoutDashboard, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setStep("code");
      toast.success("Code sent — check your email.");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (token.length < 6) {
      toast.error("Enter the full code from your email");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Session cookies are now set client-side. Hard-navigate so middleware
    // and server components pick up the authenticated session.
    toast.success("Signed in!");
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Wasson&apos;s Dashboard</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email and we'll send you a sign-in code."
              : `Enter the code we sent to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="Enter code"
                  className="text-center text-lg tracking-[0.3em]"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" /> Verify &amp; sign in
                  </>
                )}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={loading}
                  onClick={() => sendCode(new Event("submit") as never)}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
