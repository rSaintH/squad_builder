import { ArrowDownToLine, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import type { LineupSlot, Player } from "@/lib/types";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  slots: LineupSlot[];
  className?: string;
  onAdd: () => void;
  onEdit: (player: Player) => void;
  onSendToBench: (playerId: string) => void;
  onRemove: (player: Player) => void;
  disabled?: boolean;
}

export function PlayerList({
  players,
  slots,
  className,
  onAdd,
  onEdit,
  onSendToBench,
  onRemove,
  disabled = false,
}: PlayerListProps) {
  function statusOf(playerId: string): "titular" | "banco" | null {
    const slot = slots.find((s) => s.player_id === playerId);
    return slot ? slot.slot_type : null;
  }

  return (
    <GlassCard
      className={cn(
        "flex max-h-[42vh] min-h-0 flex-col rounded-2xl border p-3 lg:h-full lg:max-h-none",
        className,
      )}
      contentClassName="flex h-full min-h-0 flex-col"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Jogadores ({players.length})</h3>
          <p className="text-xs text-muted-foreground">
            Arraste um jogador até uma posição no campo.
          </p>
        </div>
        {!disabled ? (
          <button
            onClick={onAdd}
            className="glass-primary flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        ) : null}
      </div>

      {players.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum jogador. Clique em "Adicionar".
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {players.map((p) => {
            const status = statusOf(p.id);
            return (
              <li
                key={p.id}
                data-player-id={p.id}
                draggable={!disabled}
                title={`Arraste ${p.name} até o campo`}
                onDragStart={(event) => {
                  if (disabled) return;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("application/x-pro-squad-player", p.id);
                  event.dataTransfer.setData("text/plain", p.id);
                }}
                className={`glass-surface group flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 transition-colors hover:border-primary/50 ${
                  disabled ? "" : "cursor-grab active:cursor-grabbing"
                }`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {status === "titular" && (
                      <span className="shrink-0 rounded border border-primary/20 bg-primary/18 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        titular
                      </span>
                    )}
                    {status === "banco" && (
                      <span className="shrink-0 rounded border border-white/10 bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        banco
                      </span>
                    )}
                  </div>
                  {p.favorite_positions.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {p.favorite_positions.join(" · ")}
                    </p>
                  )}
                </div>
                {!disabled ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => onSendToBench(p.id)}
                      title="Mandar para o banco"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      title="Editar"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemove(p)}
                      title="Excluir"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
