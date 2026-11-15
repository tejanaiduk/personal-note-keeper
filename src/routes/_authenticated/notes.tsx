import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Feather, LogOut, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteNote,
  fetchDisplayName,
  fetchNotes,
  noteSnippet,
  notesQueryKey,
  relativeTime,
  saveNote,
  type Note,
} from "@/lib/notes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "My notes — Margin" },
      { name: "description", content: "Your private notes: write, edit and revisit them anytime." },
      { property: "og:title", content: "My notes — Margin" },
      { property: "og:description", content: "Your private notebook on Margin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotesPage,
});

type Selection = string | "new" | null;

function NotesPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Selection>(null);
  const dirtyRef = useRef(false);

  const notesQuery = useQuery({ queryKey: notesQueryKey, queryFn: fetchNotes });
  const nameQuery = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => fetchDisplayName(user.id),
  });
  const notes = notesQuery.data ?? [];
  const activeNote = selected && selected !== "new" ? notes.find((n) => n.id === selected) : undefined;

  // On wide screens, open the most recent note by default.
  useEffect(() => {
    if (selected === null && notes.length > 0 && window.matchMedia("(min-width: 768px)").matches) {
      setSelected(notes[0]!.id);
    }
  }, [notes, selected]);

  function select(next: Selection) {
    if (next === selected) return;
    if (dirtyRef.current && !window.confirm("You have unsaved changes. Discard them?")) return;
    dirtyRef.current = false;
    setSelected(next);
  }

  async function handleSignOut() {
    if (dirtyRef.current && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const displayName = nameQuery.data || user.email?.split("@")[0] || "there";
  const showEditor = selected !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl">
            <Feather className="size-5 text-accent" />
            Margin
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Hi, <span className="font-medium text-foreground">{displayName}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 md:grid-cols-[300px_1fr] md:px-6">
        <aside className={cn("flex flex-col gap-4", showEditor && "hidden md:flex")}>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl">Notes</h1>
            <Button variant="accent" size="sm" onClick={() => select("new")}>
              <Plus /> New note
            </Button>
          </div>

          {notesQuery.isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notesQuery.isError ? (
            <p className="text-sm text-destructive">Couldn't load your notes. Please refresh.</p>
          ) : notes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No notes yet. Your first one is a click away.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => select(note.id)}
                    className={cn(
                      "w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-secondary",
                      selected === note.id && "sheet border-border",
                    )}
                  >
                    <p className="truncate font-medium">{note.title || "Untitled"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {noteSnippet(note.body) || "No content"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/80">{relativeTime(note.updated_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={cn(!showEditor && "hidden md:block")}>
          {showEditor && (selected === "new" || activeNote) ? (
            <NoteEditor
              key={selected === "new" ? "new" : activeNote?.id}
              note={selected === "new" ? undefined : activeNote}
              onDirtyChange={(d) => (dirtyRef.current = d)}
              onBack={() => select(null)}
              onSaved={(n) => {
                dirtyRef.current = false;
                setSelected(n.id);
              }}
              onDeleted={() => {
                dirtyRef.current = false;
                setSelected(null);
              }}
            />
          ) : (
            <div className="sheet flex h-full min-h-[24rem] flex-col items-center justify-center p-10 text-center">
              <p className="font-display text-3xl italic text-muted-foreground">A blank page awaits.</p>
              <p className="mt-2 text-sm text-muted-foreground">Pick a note on the left, or start a new one.</p>
              <Button variant="accent" className="mt-6" onClick={() => select("new")}>
                <Plus /> New note
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NoteEditor({
  note,
  onDirtyChange,
  onBack,
  onSaved,
  onDeleted,
}: {
  note: Note | undefined;
  onDirtyChange: (dirty: boolean) => void;
  onBack: () => void;
  onSaved: (note: Note) => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");

  const dirty = title !== (note?.title ?? "") || body !== (note?.body ?? "");
  const empty = title.trim() === "" && body.trim() === "";

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const save = useMutation({
    mutationFn: () => saveNote({ id: note?.id, title, body }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: notesQueryKey });
      toast.success(note ? "Changes saved" : "Note created");
      onSaved(saved);
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save the note"),
  });

  const remove = useMutation({
    mutationFn: () => deleteNote(note!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesQueryKey });
      toast.success("Note deleted");
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete the note"),
  });

  const canSave = dirty && !empty && !save.isPending;

  return (
    <form
      className="sheet flex min-h-[32rem] flex-col p-6 md:p-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save.mutate();
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (canSave) save.mutate();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" className="-ml-3 md:hidden" onClick={onBack}>
          <ArrowLeft /> Notes
        </Button>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {note ? `Edited ${relativeTime(note.updated_at)}` : "New note"}
          {dirty ? " · unsaved changes" : ""}
        </p>
        <div className="flex items-center gap-2">
          {note ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Delete note">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                  <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button type="submit" variant="accent" size="sm" disabled={!canSave}>
            {save.isPending ? "Saving…" : note ? "Save changes" : "Save note"}
          </Button>
        </div>
      </div>

      <input
        aria-label="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={200}
        autoFocus={!note}
        className="mt-6 w-full bg-transparent font-display text-4xl leading-tight outline-none placeholder:text-muted-foreground/60 md:text-5xl"
      />
      <textarea
        aria-label="Note body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing…"
        className="ruled mt-4 w-full flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
        rows={14}
      />
    </form>
  );
}
