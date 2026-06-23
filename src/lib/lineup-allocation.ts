import type { FormationPosition, LineupSlot, Player } from "./types";

export interface PositionAssignment {
  formationPositionId: string;
  playerId: string;
}

interface PreviousPosition {
  label: string;
  x: number;
  y: number;
}

export function allocatePlayersToFormation({
  players,
  previousPositions,
  nextPositions,
  slots,
}: {
  players: Player[];
  previousPositions: FormationPosition[];
  nextPositions: FormationPosition[];
  slots: LineupSlot[];
}): PositionAssignment[] {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const previousPositionById = new Map(
    previousPositions.map((position) => [position.id, position]),
  );
  const previousByPlayer = new Map<string, PreviousPosition>();

  const titularPlayerIds = slots
    .filter((slot) => slot.slot_type === "titular" && slot.player_id)
    .map((slot) => {
      const previousPosition = slot.formation_position_id
        ? previousPositionById.get(slot.formation_position_id)
        : undefined;
      if (previousPosition && slot.player_id) {
        previousByPlayer.set(slot.player_id, previousPosition);
      }
      return slot.player_id as string;
    })
    .filter((playerId) => playerById.has(playerId));

  const availablePlayers = [...new Set(titularPlayerIds)]
    .map((playerId) => playerById.get(playerId))
    .filter(Boolean) as Player[];
  const sortedPositions = [...nextPositions].sort((a, b) => a.sort_order - b.sort_order);

  const positionById = new Map(sortedPositions.map((position) => [position.id, position]));
  const playerByPosition = new Map<string, string>();
  const positionByPlayer = new Map<string, string>();

  function tryFavoriteMatch(position: FormationPosition, visitedPlayers: Set<string>): boolean {
    const candidates = availablePlayers
      .filter((player) => player.favorite_positions.includes(position.label))
      .sort((a, b) => {
        const aSame = previousByPlayer.get(a.id)?.label === position.label ? 0 : 1;
        const bSame = previousByPlayer.get(b.id)?.label === position.label ? 0 : 1;
        return aSame - bSame || a.name.localeCompare(b.name);
      });

    for (const player of candidates) {
      if (visitedPlayers.has(player.id)) continue;
      visitedPlayers.add(player.id);

      const currentPositionId = positionByPlayer.get(player.id);
      if (
        !currentPositionId ||
        tryFavoriteMatch(positionById.get(currentPositionId)!, visitedPlayers)
      ) {
        playerByPosition.set(position.id, player.id);
        positionByPlayer.set(player.id, position.id);
        return true;
      }
    }

    return false;
  }

  const positionsByScarcity = [...sortedPositions].sort((a, b) => {
    const countFavorites = (position: FormationPosition) =>
      availablePlayers.filter((player) => player.favorite_positions.includes(position.label))
        .length;
    return countFavorites(a) - countFavorites(b) || a.sort_order - b.sort_order;
  });

  for (const position of positionsByScarcity) {
    tryFavoriteMatch(position, new Set());
  }

  const usedPlayers = new Set(positionByPlayer.keys());
  const usedPositions = new Set(playerByPosition.keys());
  const remainingPlayers = availablePlayers.filter((player) => !usedPlayers.has(player.id));
  const remainingPositions = sortedPositions.filter((position) => !usedPositions.has(position.id));

  const fallbackPairs = remainingPlayers.flatMap((player) =>
    remainingPositions.map((position) => {
      const previous = previousByPlayer.get(player.id);
      const sameLabel = previous?.label === position.label;
      const distance = previous
        ? Math.hypot(position.x - previous.x, position.y - previous.y)
        : 1000;
      return { player, position, sameLabel, distance };
    }),
  );

  fallbackPairs.sort(
    (a, b) =>
      Number(b.sameLabel) - Number(a.sameLabel) ||
      a.distance - b.distance ||
      a.position.sort_order - b.position.sort_order ||
      a.player.name.localeCompare(b.player.name),
  );

  for (const pair of fallbackPairs) {
    if (usedPlayers.has(pair.player.id) || usedPositions.has(pair.position.id)) {
      continue;
    }
    playerByPosition.set(pair.position.id, pair.player.id);
    positionByPlayer.set(pair.player.id, pair.position.id);
    usedPlayers.add(pair.player.id);
    usedPositions.add(pair.position.id);
  }

  return [...playerByPosition.entries()].map(([formationPositionId, playerId]) => ({
    playerId,
    formationPositionId,
  }));
}
