import { supabase } from "@/integrations/supabase/client";
import type { LineupSlot, Player } from "@/lib/types";
import type { PositionAssignment } from "@/lib/lineup-allocation";

export class PlayerUnavailableError extends Error {
  constructor() {
    super("Esse jogador não está mais disponível. A escalação foi atualizada.");
    this.name = "PlayerUnavailableError";
  }
}

async function assertPlayerBelongsToLineup(lineupId: string, playerId: string): Promise<void> {
  const { data, error } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("lineup_id", lineupId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new PlayerUnavailableError();
}

async function assertPositionExists(formationPositionId: string): Promise<void> {
  const { data, error } = await supabase
    .from("formation_positions")
    .select("id")
    .eq("id", formationPositionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Essa posição não existe mais.");
}

function normalizeSlotError(error: { code?: string } | null): never {
  if (error?.code === "23503") throw new PlayerUnavailableError();
  throw error;
}

export async function getPlayers(lineupId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select()
    .eq("lineup_id", lineupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Player[]) ?? [];
}

export async function addPlayer(
  lineupId: string,
  name: string,
  favoritePositions: string[],
): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .insert({
      lineup_id: lineupId,
      name,
      favorite_positions: favoritePositions,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Player;
}

export async function updatePlayer(
  id: string,
  name: string,
  favoritePositions: string[],
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .update({ name, favorite_positions: favoritePositions })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
}

// ---- Slots ----

export async function getSlots(lineupId: string): Promise<LineupSlot[]> {
  const { data, error } = await supabase.from("lineup_slots").select().eq("lineup_id", lineupId);
  if (error) throw error;
  return (data as LineupSlot[]) ?? [];
}

export async function assignToPosition(
  lineupId: string,
  formationPositionId: string,
  playerId: string,
): Promise<void> {
  await Promise.all([
    assertPlayerBelongsToLineup(lineupId, playerId),
    assertPositionExists(formationPositionId),
  ]);

  const { error: deleteError } = await supabase
    .from("lineup_slots")
    .delete()
    .eq("lineup_id", lineupId)
    .or(`formation_position_id.eq.${formationPositionId},player_id.eq.${playerId}`);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from("lineup_slots").insert({
    lineup_id: lineupId,
    formation_position_id: formationPositionId,
    player_id: playerId,
    slot_type: "titular",
  });
  if (error) normalizeSlotError(error);
}

export async function assignToBench(lineupId: string, playerId: string): Promise<void> {
  await assertPlayerBelongsToLineup(lineupId, playerId);

  const { error: deleteError } = await supabase
    .from("lineup_slots")
    .delete()
    .eq("lineup_id", lineupId)
    .eq("player_id", playerId);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from("lineup_slots").insert({
    lineup_id: lineupId,
    player_id: playerId,
    slot_type: "banco",
  });
  if (error) normalizeSlotError(error);
}

export async function clearPosition(lineupId: string, formationPositionId: string): Promise<void> {
  const { error } = await supabase
    .from("lineup_slots")
    .delete()
    .eq("lineup_id", lineupId)
    .eq("formation_position_id", formationPositionId);
  if (error) throw error;
}

export async function removeFromLineup(lineupId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from("lineup_slots")
    .delete()
    .eq("lineup_id", lineupId)
    .eq("player_id", playerId);
  if (error) throw error;
}

export async function replaceTitularSlots(
  lineupId: string,
  assignments: PositionAssignment[],
): Promise<void> {
  if (assignments.length > 0) {
    const playerIds = [...new Set(assignments.map(({ playerId }) => playerId))];
    const positionIds = [
      ...new Set(assignments.map(({ formationPositionId }) => formationPositionId)),
    ];
    const [
      { data: validPlayers, error: playersError },
      { data: validPositions, error: positionsError },
    ] = await Promise.all([
      supabase.from("players").select("id").eq("lineup_id", lineupId).in("id", playerIds),
      supabase.from("formation_positions").select("id").in("id", positionIds),
    ]);

    if (playersError) throw playersError;
    if (positionsError) throw positionsError;
    if (validPlayers.length !== playerIds.length) {
      throw new PlayerUnavailableError();
    }
    if (validPositions.length !== positionIds.length) {
      throw new Error("A formação mudou enquanto os jogadores eram realocados.");
    }
  }

  const { error: deleteError } = await supabase
    .from("lineup_slots")
    .delete()
    .eq("lineup_id", lineupId)
    .eq("slot_type", "titular");
  if (deleteError) throw deleteError;

  if (assignments.length === 0) return;

  const { error } = await supabase.from("lineup_slots").insert(
    assignments.map((assignment, sortOrder) => ({
      lineup_id: lineupId,
      formation_position_id: assignment.formationPositionId,
      player_id: assignment.playerId,
      slot_type: "titular",
      sort_order: sortOrder,
    })),
  );
  if (error) normalizeSlotError(error);
}
