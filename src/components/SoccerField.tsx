import { useState } from "react";
import { UserRound, X } from "lucide-react";
import type { FormationPosition, LineupSlot, Player } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SoccerFieldProps {
  positions: FormationPosition[];
  slots: LineupSlot[];
  players: Player[];
  className?: string;
  onPositionClick: (position: FormationPosition) => void;
  onClearPosition: (position: FormationPosition) => void;
  onDropPlayer: (position: FormationPosition, playerId: string) => void;
  disabled?: boolean;
}

export function SoccerField({
  positions,
  slots,
  players,
  className,
  onPositionClick,
  onClearPosition,
  onDropPlayer,
  disabled = false,
}: SoccerFieldProps) {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const playerById = new Map(players.map((p) => [p.id, p]));

  function playerAt(positionId: string): Player | null {
    const slot = slots.find(
      (s) => s.slot_type === "titular" && s.formation_position_id === positionId,
    );
    return slot?.player_id ? (playerById.get(slot.player_id) ?? null) : null;
  }

  return (
    <div
      className={cn(
        "pitch-bg relative mx-auto aspect-[2/3] w-full max-w-none overflow-hidden rounded-2xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)]",
        className,
      )}
    >
      {/* Marcações do campo */}
      <div className="pitch-texture pointer-events-none absolute inset-0" />
      <div className="pitch-vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-1 rounded-[1rem] border border-white/10" />

      <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-[var(--pitch-line)] shadow-[inset_0_0_24px_rgba(255,255,255,0.05)]" />
      <div className="pitch-line pointer-events-none absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--pitch-line)] shadow-[0_0_16px_rgba(255,255,255,0.08)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pitch-line)] shadow-[0_0_10px_rgba(255,255,255,0.25)]" />
      {/* Áreas */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 h-[18%] w-[54%] -translate-x-1/2 border-2 border-b-0 border-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 h-[8.5%] w-[28%] -translate-x-1/2 border-2 border-b-0 border-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute bottom-[14.5%] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute bottom-[19%] left-1/2 h-16 w-24 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-[var(--pitch-line)]" />

      <div className="pointer-events-none absolute left-1/2 top-4 h-[18%] w-[54%] -translate-x-1/2 border-2 border-t-0 border-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute left-1/2 top-4 h-[8.5%] w-[28%] -translate-x-1/2 border-2 border-t-0 border-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute left-1/2 top-[14.5%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--pitch-line)]" />
      <div className="pointer-events-none absolute left-1/2 top-[19%] h-16 w-24 -translate-x-1/2 rotate-180 rounded-t-full border-2 border-b-0 border-[var(--pitch-line)]" />

      {positions.map((pos) => {
        const player = playerAt(pos.id);
        return (
          <div
            key={pos.id}
            data-position-id={pos.id}
            data-position-label={pos.label}
            onDragEnter={(event) => {
              if (disabled) return;
              event.preventDefault();
              setDropTargetId(pos.id);
            }}
            onDragOver={(event) => {
              if (disabled) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setDropTargetId(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (disabled) return;
              const playerId =
                event.dataTransfer.getData("application/x-pro-squad-player") ||
                event.dataTransfer.getData("text/plain");
              setDropTargetId(null);
              if (playerId) onDropPlayer(pos, playerId);
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl p-2 transition-all ${
              dropTargetId === pos.id ? "scale-110 bg-white/20 ring-2 ring-white" : ""
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <button
              onClick={() => {
                if (!disabled) onPositionClick(pos);
              }}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition-transform group-active:scale-95 ${
                  player
                    ? "border-white bg-primary text-primary-foreground ring-2 ring-black/10"
                    : "border-dashed border-white/70 bg-black/30 text-white/90"
                }`}
              >
                {player ? <UserRound className="h-6 w-6" /> : pos.label}
                {player && (
                  <span className="absolute -bottom-1.5 rounded-full border border-white bg-black/75 px-1.5 text-[8px] leading-4 text-white">
                    {pos.label}
                  </span>
                )}
              </span>
              <span className="mt-0.5 max-w-[88px] truncate rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {player ? player.name : "vazio"}
              </span>
            </button>
            {player && !disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearPosition(pos);
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-destructive text-destructive-foreground shadow"
                aria-label="Remover da posição"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
