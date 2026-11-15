import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Note = Tables<"notes">;

export const notesQueryKey = ["notes"] as const;

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.display_name ?? null;
}

export async function saveNote(input: { id: string | undefined; title: string; body: string }): Promise<Note> {
  const values = { title: input.title.trim(), body: input.body };
  const query = input.id
    ? supabase.from("notes").update(values).eq("id", input.id)
    : supabase.from("notes").insert(values);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export function noteSnippet(body: string, max = 90): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
