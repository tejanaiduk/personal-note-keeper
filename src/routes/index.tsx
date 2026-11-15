import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Feather, Lock, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSignedIn } from "@/hooks/use-signed-in";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Margin — a private notebook for your thoughts" },
      {
        name: "description",
        content: "Sign up, write notes with a title and body, and find them waiting every time you come back.",
      },
      { property: "og:title", content: "Margin — a private notebook for your thoughts" },
      {
        property: "og:description",
        content: "Write notes, edit them anytime, and keep them safe in your own account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const signedIn = useSignedIn();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl">
          <Feather className="size-5 text-accent" />
          Margin
        </Link>
        {signedIn ? (
          <Button asChild variant="ghost">
            <Link to="/notes">My notes</Link>
          </Button>
        ) : (
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </header>

      <main className="mx-auto grid max-w-5xl gap-14 px-6 pb-24 pt-10 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20">
        <section>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Your notebook</p>
          <h1 className="mt-4 font-display text-6xl leading-[1.02] md:text-7xl">
            Write it down.
            <br />
            <span className="italic marker">Keep it close.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            A quiet place for ideas, lists and half-finished thoughts. Your notes are saved to your
            account and waiting whenever you return.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link to={signedIn ? "/notes" : "/auth"}>
                {signedIn ? "Open my notes" : "Start writing — it's free"}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <PencilLine className="size-4" /> Edit anytime
            </li>
            <li className="flex items-center gap-2">
              <Lock className="size-4" /> Only you can see your notes
            </li>
          </ul>
        </section>

        <section aria-hidden className="relative mx-auto w-full max-w-sm">
          <div className="sheet absolute inset-0 translate-x-4 translate-y-4 rotate-3 opacity-70" />
          <div className="sheet relative -rotate-2 p-8">
            <p className="font-display text-3xl">Sunday plans</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Nov 15</p>
            <div className="ruled mt-4 text-base/8 text-foreground/80">
              <p>— farmers market before 10</p>
              <p>— call grandma</p>
              <p>— finish the chapter on tides</p>
              <p>— try the new chai recipe</p>
              <p>&nbsp;</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
