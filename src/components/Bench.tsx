import { X } from "lucide-react";
import type { LineupSlot, Player } from "@/lib/types";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";

interface BenchProps {
  players: Player[];
  slots: LineupSlot[];
  className?: string;
  onRemove: (playerId: string) => void;
  disabled?: boolean;
}

export function Bench({ players, slots, className, onRemove, disabled = false }: BenchProps) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const bench = slots
    .filter((s) => s.slot_type === "banco" && s.player_id)
    .map((s) => playerById.get(s.player_id as string))
    .filter(Boolean) as Player[];

  return (
    <GlassCard
      className={cn(
        "flex max-h-[28vh] min-h-0 flex-col rounded-2xl border p-3 lg:h-full lg:max-h-none",
        className,
      )}
      contentClassName="flex h-full min-h-0 flex-col"
    >
      <h3 className="mb-2 shrink-0 font-semibold">Banco ({bench.length})</h3>
      {bench.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Ninguem no banco ainda.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto pr-1">
          {bench.map((p) => (
            <span
              key={p.id}
              className="glass-surface flex h-fit items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-sm"
            >
              {p.name}
              {!disabled ? (
                <button
                  onClick={() => onRemove(p.id)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  aria-label="Tirar do banco"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
