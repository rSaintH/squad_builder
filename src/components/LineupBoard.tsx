import type { ReactNode } from "react";
import { ClipboardCopy, Link2 } from "lucide-react";
import type { Formation, FormationPosition, LineupSlot, Player } from "@/lib/types";
import { Bench } from "@/components/Bench";
import { FormationSelect } from "@/components/FormationSelect";
import { GlassCard } from "@/components/GlassCard";
import { PlayerList } from "@/components/PlayerList";
import { SoccerField } from "@/components/SoccerField";

interface LineupBoardProps {
  header: ReactNode;
  formations: Formation[];
  formationId: string | null;
  positions: FormationPosition[];
  slots: LineupSlot[];
  players: Player[];
  onFormationChange: (formationId: string) => void;
  onNewFormation: () => void;
  onCopyLink: () => void;
  onCopyText: () => void;
  onPositionClick: (position: FormationPosition) => void;
  onClearPosition: (position: FormationPosition) => void;
  onDropPlayer: (position: FormationPosition, playerId: string) => void;
  onAddPlayer: () => void;
  onEditPlayer: (player: Player) => void;
  onSendToBench: (playerId: string) => void;
  onRemovePlayer: (player: Player) => void;
  onRemoveFromBench: (playerId: string) => void;
  canEdit?: boolean;
}

export function FormationCard({
  formations,
  formationId,
  onFormationChange,
  onNewFormation,
  onCopyLink,
  onCopyText,
  canEdit = true,
}: Pick<
  LineupBoardProps,
  | "formations"
  | "formationId"
  | "onFormationChange"
  | "onNewFormation"
  | "onCopyLink"
  | "onCopyText"
  | "canEdit"
>) {
  return (
    <GlassCard className="rounded-2xl border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <FormationSelect
            formations={formations}
            value={formationId}
            onChange={onFormationChange}
            onNewFormation={onNewFormation}
            disabled={!canEdit}
          />
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <button
            onClick={onCopyLink}
            className="glass-surface grid h-10 w-10 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copiar link"
            title="Copiar link"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            onClick={onCopyText}
            className="glass-surface grid h-10 w-10 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copiar em texto"
            title="Copiar em texto"
          >
            <ClipboardCopy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export function FieldCard({
  formationId,
  positions,
  slots,
  players,
  onPositionClick,
  onClearPosition,
  onDropPlayer,
  canEdit = true,
}: Pick<
  LineupBoardProps,
  | "formationId"
  | "positions"
  | "slots"
  | "players"
  | "onPositionClick"
  | "onClearPosition"
  | "onDropPlayer"
  | "canEdit"
>) {
  if (!formationId) {
    return (
      <GlassCard className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Escolha uma formacao para montar o time no campo.
      </GlassCard>
    );
  }

  return (
    <SoccerField
      positions={positions}
      slots={slots}
      players={players}
      onPositionClick={onPositionClick}
      onClearPosition={onClearPosition}
      onDropPlayer={onDropPlayer}
      disabled={!canEdit}
    />
  );
}

export function LineupBoard({
  header,
  formations,
  formationId,
  positions,
  slots,
  players,
  onFormationChange,
  onNewFormation,
  onCopyLink,
  onCopyText,
  onPositionClick,
  onClearPosition,
  onDropPlayer,
  onAddPlayer,
  onEditPlayer,
  onSendToBench,
  onRemovePlayer,
  onRemoveFromBench,
  canEdit = true,
}: LineupBoardProps) {
  return (
    <div className="flex flex-col gap-3 lg:h-full">
      <div className="relative shrink-0 lg:min-h-16">
        <div className="relative z-10">{header}</div>
        <div className="mt-3 lg:absolute lg:left-[calc(300px+0.75rem)] lg:right-[calc(260px+0.75rem)] lg:top-0 lg:z-20 lg:mt-0">
          <div className="mx-auto w-full max-w-[min(420px,80vw)] lg:max-w-[440px]">
            <FormationCard
              formations={formations}
              formationId={formationId}
              onFormationChange={onFormationChange}
              onNewFormation={onNewFormation}
              onCopyLink={onCopyLink}
              onCopyText={onCopyText}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)_260px]">
        <PlayerList
          players={players}
          slots={slots}
          onAdd={onAddPlayer}
          onEdit={onEditPlayer}
          onSendToBench={onSendToBench}
          onRemove={onRemovePlayer}
          disabled={!canEdit}
        />

        <div className="flex min-h-0 justify-center">
          <div className="flex min-h-0 w-full max-w-[min(420px,80vw)] items-start justify-center lg:max-w-[440px]">
            <FieldCard
              formationId={formationId}
              positions={positions}
              slots={slots}
              players={players}
              onPositionClick={onPositionClick}
              onClearPosition={onClearPosition}
              onDropPlayer={onDropPlayer}
              canEdit={canEdit}
            />
          </div>
        </div>

        <Bench players={players} slots={slots} onRemove={onRemoveFromBench} disabled={!canEdit} />
      </div>
    </div>
  );
}
