import { supabase } from "@/integrations/supabase/client";
import type { Lineup } from "@/lib/types";
import { generateSlug } from "@/lib/utils";

export async function createLineup(name: string): Promise<Lineup> {
  // Ensure a unique slug.
  let slug = generateSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("lineups")
      .insert({ name, share_slug: slug })
      .select()
      .single();
    if (!error && data) return data as Lineup;
    if (error && error.code === "23505") {
      slug = generateSlug();
      continue;
    }
    if (error) throw error;
  }
  throw new Error("Não foi possível criar a escalação.");
}

export async function getLineupBySlug(slug: string): Promise<Lineup | null> {
  const { data, error } = await supabase
    .from("lineups")
    .select()
    .eq("share_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Lineup) ?? null;
}

export async function renameLineup(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("lineups").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function setLineupFormation(id: string, formationId: string | null): Promise<void> {
  const { error } = await supabase
    .from("lineups")
    .update({ formation_id: formationId })
    .eq("id", id);
  if (error) throw error;
}

export async function setLineupBackground(id: string, backgroundUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from("lineups")
    .update({ background_url: backgroundUrl })
    .eq("id", id);
  if (error) throw error;
}

export async function setLineupClubIcon(id: string, clubIconUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from("lineups")
    .update({ club_icon_url: clubIconUrl })
    .eq("id", id);
  if (error) throw error;
}

async function uploadLineupAsset(
  lineupId: string,
  file: File,
  folder: "backgrounds" | "icons",
): Promise<string> {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${lineupId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("lineup-backgrounds").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("lineup-backgrounds").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadLineupBackground(lineupId: string, file: File): Promise<string> {
  return uploadLineupAsset(lineupId, file, "backgrounds");
}

export async function uploadLineupClubIcon(lineupId: string, file: File): Promise<string> {
  return uploadLineupAsset(lineupId, file, "icons");
}
