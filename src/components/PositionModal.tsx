import { Modal } from "./Modal";
import type { FormationPosition, Player } from "@/lib/types";
import { POSITION_LABELS, type Position } from "@/lib/positions";

interface PositionModalProps {
  open: boolean;
  position: FormationPosition | null;
  players: Player[];
  assignedPlayerIds: Set<string>;
  onClose: () => void;
  onSelect: (playerId: string) => void;
}

export function PositionModal({
  open,
  position,
  players,
  assignedPlayerIds,
  onClose,
  onSelect,
}: PositionModalProps) {
  if (!position) return null;
  const label = position.label as Position;

  // Jogadores que favoritam a posição aparecem primeiro.
  const sorted = [...players].sort((a, b) => {
    const af = a.favorite_positions.includes(position.label) ? 0 : 1;
    const bf = b.favorite_positions.includes(position.label) ? 0 : 1;
    return af - bf || a.name.localeCompare(b.name);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${position.label} — ${POSITION_LABELS[label] ?? "Posição"}`}
    >
      {players.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum jogador ainda. Adicione jogadores primeiro.
        </p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((p) => {
            const favorite = p.favorite_positions.includes(position.label);
            const assigned = assignedPlayerIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  onClose();
                }}
                className="glass-surface flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors"
              >
                <span className="font-medium">{p.name}</span>
                <span className="flex items-center gap-2">
                  {favorite && (
                    <span className="rounded border border-primary/20 bg-primary/18 px-1.5 py-0.5 text-xs font-semibold text-primary">
                      favorita
                    </span>
                  )}
                  {assigned && <span className="text-xs text-muted-foreground">já escalado</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
