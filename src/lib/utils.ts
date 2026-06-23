import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Formation, FormationPosition, LineupSlot, Player } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

interface ExportArgs {
  lineupName: string;
  formationName: string | null;
  positions: FormationPosition[];
  slots: LineupSlot[];
  players: Player[];
}

export function exportLineupText({
  lineupName,
  formationName,
  positions,
  slots,
  players,
}: ExportArgs): string {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const lines: string[] = [];
  lines.push(`Escalação: ${lineupName}`);
  if (formationName) lines.push(`Formação: ${formationName}`);
  lines.push("");

  const sortedPositions = [...positions].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  for (const pos of sortedPositions) {
    const slot = slots.find(
      (s) => s.slot_type === "titular" && s.formation_position_id === pos.id,
    );
    const player = slot?.player_id ? playerById.get(slot.player_id) : null;
    lines.push(`${pos.label}: ${player ? player.name : "—"}`);
  }

  const bench = slots
    .filter((s) => s.slot_type === "banco" && s.player_id)
    .map((s) => playerById.get(s.player_id as string))
    .filter(Boolean) as Player[];

  lines.push("");
  lines.push("Banco:");
  if (bench.length === 0) {
    lines.push("- —");
  } else {
    for (const p of bench) lines.push(`- ${p.name}`);
  }

  return lines.join("\n");
}

export function formationName(formations: Formation[], id: string | null) {
  if (!id) return null;
  return formations.find((f) => f.id === id)?.name ?? null;
}
