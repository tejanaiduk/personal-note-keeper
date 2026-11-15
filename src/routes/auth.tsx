import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Feather, MailCheck } from "lucide-react";
import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Margin" },
      { name: "description", content: "Sign in to Margin or create a free account to start writing notes." },
      { property: "og:title", content: "Sign in to Margin" },
      { property: "og:description", content: "Create a free account and keep your notes in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/notes", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/notes", replace: true });
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const displayName = String(form.get("displayName")).trim();
    const email = String(form.get("email")).trim();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/notes`,
        data: { display_name: displayName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/notes", replace: true });
    } else {
      setConfirmEmail(email);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2 font-display text-3xl">
        <Feather className="size-6 text-accent" />
        Margin
      </Link>

      <div className="sheet w-full max-w-md p-8">
        {confirmEmail ? (
          <div className="text-center">
            <MailCheck className="mx-auto size-10 text-accent" />
            <h1 className="mt-4 font-display text-3xl">Check your inbox</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to <span className="font-medium text-foreground">{confirmEmail}</span>.
              Click it to finish creating your account, then sign in.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setConfirmEmail(null);
                setTab("signin");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <h1 className="font-display text-3xl">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your notes are right where you left them.</p>
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <Field id="signin-email" name="email" label="Email" type="email" autoComplete="email" />
                <Field
                  id="signin-password"
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                />
                <Button type="submit" variant="accent" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <h1 className="font-display text-3xl">Start your notebook</h1>
              <p className="mt-1 text-sm text-muted-foreground">Free, private, and just for you.</p>
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <Field id="signup-name" name="displayName" label="Display name" autoComplete="nickname" maxLength={60} />
                <Field id="signup-email" name="email" label="Email" type="email" autoComplete="email" />
                <Field
                  id="signup-password"
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  hint="At least 6 characters."
                />
                <Button type="submit" variant="accent" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required className="bg-background/60" {...props} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
