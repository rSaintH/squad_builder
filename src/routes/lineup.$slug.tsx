import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Formation, FormationPosition, Lineup, LineupSlot, Player } from "@/lib/types";
import {
  getFormationPositionsForLineup,
  getLineupPageData,
  mutateLineup,
  type LineupAccess,
} from "@/lib/api/lineups.functions";
import { allocatePlayersToFormation } from "@/lib/lineup-allocation";
import {
  setLineupBackground,
  setLineupClubIcon,
  setLineupFormation,
  uploadLineupBackground,
  uploadLineupClubIcon,
} from "@/services/lineups";
import {
  getFormations,
  getPositions,
  createCustomFormation,
  type PositionDraft,
} from "@/services/formations";
import {
  addPlayer,
  assignToBench,
  assignToPosition,
  clearPosition,
  deletePlayer,
  getPlayers,
  getSlots,
  PlayerUnavailableError,
  removeFromLineup,
  replaceTitularSlots,
  updatePlayer,
} from "@/services/players";
import { exportLineupText } from "@/lib/utils";
import { LineupBoard } from "@/components/LineupBoard";
import { LineupHeader } from "@/components/LineupHeader";
import { LineupSettingsPanel } from "@/components/LineupSettingsPanel";
import { PlayerModal } from "@/components/PlayerModal";
import { PositionModal } from "@/components/PositionModal";
import { FormationEditor } from "@/components/FormationEditor";

export const Route = createFileRoute("/lineup/$slug")({
  component: LineupPage,
  errorComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-muted-foreground">Erro ao carregar a escalação.</p>
      <Link to="/" className="text-primary underline">
        Voltar ao início
      </Link>
    </div>
  ),
});

function LineupPage() {
  const { slug } = Route.useParams();

  const [loading, setLoading] = useState(true);
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [access, setAccess] = useState<LineupAccess | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [positions, setPositions] = useState<FormationPosition[]>([]);
  const [slots, setSlots] = useState<LineupSlot[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [backgroundToolsOpen, setBackgroundToolsOpen] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [clubIconUploading, setClubIconUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const upPressCountRef = useRef(0);
  const upPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const clubIconInputRef = useRef<HTMLInputElement | null>(null);
  const loadRequestRef = useRef(0);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [activePosition, setActivePosition] = useState<FormationPosition | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadLineupData = useCallback(
    async (showLoading = false) => {
      const requestId = ++loadRequestRef.current;
      if (showLoading) setLoading(true);

      try {
        const pageData = await getLineupPageData({ data: { slug } });
        const nextLineup = pageData.lineup;
        if (requestId !== loadRequestRef.current) return;

        if (!nextLineup) {
          setLineup(null);
          setAccess(pageData.access);
          setPlayers([]);
          setFormations([]);
          setPositions([]);
          setSlots([]);
          return;
        }

        if (requestId !== loadRequestRef.current) return;
        setLineup(nextLineup);
        setAccess(pageData.access);
        setPlayers(pageData.players);
        setFormations(pageData.formations);
        setSlots(pageData.slots);
        setPositions(pageData.positions);
      } catch (e) {
        console.error(e);
        if (showLoading) toast.error("Erro ao carregar dados.");
      } finally {
        if (showLoading && requestId === loadRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [slug],
  );

  const refreshSlots = useCallback(
    async (lineupId: string) => {
      if (lineup?.public_write) {
        setSlots(await getSlots(lineupId));
        return;
      }
      await loadLineupData();
    },
    [lineup, loadLineupData],
  );

  useEffect(() => {
    void loadLineupData(true);
  }, [loadLineupData]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (lineup?.is_private && !access?.isOwner) return;
      if (event.key !== "ArrowUp") {
        upPressCountRef.current = 0;
        return;
      }

      upPressCountRef.current += 1;
      if (upPressTimerRef.current) clearTimeout(upPressTimerRef.current);

      if (upPressCountRef.current >= 2) {
        setBackgroundToolsOpen(true);
        upPressCountRef.current = 0;
        toast.success("Plano de fundo desbloqueado.");
        return;
      }

      upPressTimerRef.current = setTimeout(() => {
        upPressCountRef.current = 0;
      }, 700);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (upPressTimerRef.current) clearTimeout(upPressTimerRef.current);
    };
  }, [lineup?.is_private, access?.isOwner]);

  const lineupId = lineup?.id;
  const realtimeChannelKey = lineup
    ? lineup.is_private
      ? lineup.realtime_secret
      : lineup.id
    : null;

  useEffect(() => {
    if (!lineupId || !realtimeChannelKey) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void loadLineupData();
      }, 100);
    };

    const channel = supabase.channel(`lineup:${realtimeChannelKey}`, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: crypto.randomUUID() },
      },
    });
    realtimeChannelRef.current = channel;

    channel
      .on("broadcast", { event: "lineup_changed" }, scheduleRefresh)
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const connectedSessions = Object.values(presenceState).reduce(
          (total, presences) => total + presences.length,
          0,
        );
        setCollaboratorCount(connectedSessions);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lineups",
          filter: `id=eq.${lineupId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `lineup_id=eq.${lineupId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "players",
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lineup_slots",
          filter: `lineup_id=eq.${lineupId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "lineup_slots",
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "formations",
          filter: `lineup_id=eq.${lineupId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "formation_positions",
        },
        scheduleRefresh,
      )
      .subscribe(async (status, error) => {
        setRealtimeConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Realtime]", status, error);
        }
      });

    return () => {
      clearTimeout(refreshTimer);
      setRealtimeConnected(false);
      setCollaboratorCount(0);
      if (realtimeChannelRef.current === channel) {
        realtimeChannelRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [lineupId, realtimeChannelKey, loadLineupData]);

  const broadcastLineupChange = useCallback(async () => {
    const channel = realtimeChannelRef.current;
    if (!channel) return;

    const response = await channel.send({
      type: "broadcast",
      event: "lineup_changed",
      payload: { changed_at: new Date().toISOString() },
    });
    if (response !== "ok") {
      console.warn("[Realtime] Broadcast não confirmado:", response);
    }
  }, []);

  const canEdit = access?.canEdit ?? false;

  function requireEditPermission() {
    if (canEdit) return true;
    toast.error("Voce nao tem permissao para editar esta escalacao.");
    return false;
  }

  async function runProtectedMutation(kind: string, payload: unknown = {}) {
    if (!lineup) return;
    return mutateLineup({ data: { lineupId: lineup.id, kind, payload } });
  }

  async function getFormationPositionsForCurrentLineup(formationId: string) {
    if (!lineup || lineup.public_write) return getPositions(formationId);
    return getFormationPositionsForLineup({
      data: { lineupId: lineup.id, formationId },
    });
  }

  async function handleChangeFormation(formationId: string) {
    if (!lineup || !requireEditPermission()) return;
    try {
      const nextPositions = await getFormationPositionsForCurrentLineup(formationId);
      const assignments = allocatePlayersToFormation({
        players,
        previousPositions: positions,
        nextPositions,
        slots,
      });
      if (lineup.public_write) {
        await replaceTitularSlots(lineup.id, assignments);
        await setLineupFormation(lineup.id, formationId);
      } else {
        await runProtectedMutation("replaceTitularSlots", { assignments });
        await runProtectedMutation("setFormation", { formationId });
      }
      setLineup({ ...lineup, formation_id: formationId });
      setPositions(nextPositions);
      await refreshSlots(lineup.id);
      await broadcastLineupChange();
    } catch (e) {
      console.error(e);
      if (e instanceof PlayerUnavailableError) {
        await loadLineupData();
        toast.error(e.message);
        return;
      }
      toast.error("Erro ao trocar formação.");
    }
  }

  async function assignPlayerToPosition(position: FormationPosition, playerId: string) {
    if (!lineup || !requireEditPermission()) return;
    try {
      if (lineup.public_write) {
        await assignToPosition(lineup.id, position.id, playerId);
      } else {
        await runProtectedMutation("assignToPosition", {
          formationPositionId: position.id,
          playerId,
        });
      }
      await refreshSlots(lineup.id);
      await broadcastLineupChange();
    } catch (e) {
      console.error(e);
      if (e instanceof PlayerUnavailableError) {
        await loadLineupData();
        toast.error(e.message);
        return;
      }
      toast.error("Erro ao escalar jogador.");
    }
  }

  async function handleSelectForPosition(playerId: string) {
    if (!activePosition) return;
    await assignPlayerToPosition(activePosition, playerId);
  }

  async function handleClearPosition(pos: FormationPosition) {
    if (!lineup || !requireEditPermission()) return;
    if (lineup.public_write) {
      await clearPosition(lineup.id, pos.id);
    } else {
      await runProtectedMutation("clearPosition", { formationPositionId: pos.id });
    }
    await refreshSlots(lineup.id);
    await broadcastLineupChange();
  }

  async function handleSavePlayer(name: string, favPositions: string[]) {
    if (!lineup || !requireEditPermission()) return;
    if (lineup.public_write) {
      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, name, favPositions);
      } else {
        await addPlayer(lineup.id, name, favPositions);
      }
    } else {
      await runProtectedMutation(editingPlayer ? "updatePlayer" : "addPlayer", {
        id: editingPlayer?.id,
        name,
        favoritePositions: favPositions,
      });
    }
    setEditingPlayer(null);
    if (lineup.public_write) {
      setPlayers(await getPlayers(lineup.id));
    } else {
      await loadLineupData();
    }
    await broadcastLineupChange();
  }

  async function handleSendToBench(playerId: string) {
    if (!lineup || !requireEditPermission()) return;
    try {
      if (lineup.public_write) {
        await assignToBench(lineup.id, playerId);
      } else {
        await runProtectedMutation("assignToBench", { playerId });
      }
      await refreshSlots(lineup.id);
      await broadcastLineupChange();
    } catch (e) {
      console.error(e);
      if (e instanceof PlayerUnavailableError) {
        await loadLineupData();
        toast.error(e.message);
        return;
      }
      toast.error("Erro ao mandar jogador para o banco.");
    }
  }

  async function handleRemovePlayer(player: Player) {
    if (!lineup || !requireEditPermission()) return;
    if (lineup.public_write) {
      await deletePlayer(player.id);
      setPlayers(await getPlayers(lineup.id));
    } else {
      await runProtectedMutation("deletePlayer", { id: player.id });
      await loadLineupData();
    }
    await refreshSlots(lineup.id);
    await broadcastLineupChange();
  }

  async function handleRemoveFromBench(playerId: string) {
    if (!lineup || !requireEditPermission()) return;
    if (lineup.public_write) {
      await removeFromLineup(lineup.id, playerId);
    } else {
      await runProtectedMutation("removeFromLineup", { playerId });
    }
    await refreshSlots(lineup.id);
    await broadcastLineupChange();
  }

  async function handleCreateFormation(name: string, drafts: PositionDraft[]) {
    if (!lineup || !requireEditPermission()) return;
    try {
      const f = lineup.public_write
        ? await createCustomFormation(lineup.id, name, drafts)
        : ((await runProtectedMutation("createCustomFormation", {
            name,
            positions: drafts,
          })) as Formation);
      const nextPositions = await getFormationPositionsForCurrentLineup(f.id);
      const assignments = allocatePlayersToFormation({
        players,
        previousPositions: positions,
        nextPositions,
        slots,
      });
      if (lineup.public_write) {
        await replaceTitularSlots(lineup.id, assignments);
        await setLineupFormation(lineup.id, f.id);
      } else {
        await runProtectedMutation("replaceTitularSlots", { assignments });
        await runProtectedMutation("setFormation", { formationId: f.id });
      }
      setLineup({ ...lineup, formation_id: f.id });
      if (lineup.public_write) {
        setFormations(await getFormations(lineup.id));
      } else {
        await loadLineupData();
      }
      setPositions(nextPositions);
      await refreshSlots(lineup.id);
      await broadcastLineupChange();
      toast.success("Formação criada!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar formação.");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  }

  function copyText() {
    if (!lineup) return;
    const text = exportLineupText({
      lineupName: lineup.name,
      formationName: formations.find((f) => f.id === lineup.formation_id)?.name ?? null,
      positions,
      slots,
      players,
    });
    navigator.clipboard.writeText(text);
    toast.success("Escalação copiada em texto!");
  }

  function validateImageFile(file: File | undefined) {
    if (!file) return false;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Use uma imagem de até 5 MB.");
      return false;
    }

    return true;
  }

  async function handleBackgroundFile(file: File | undefined) {
    if (!lineup || !validateImageFile(file)) return;
    if (lineup.is_private && !access?.isOwner) {
      toast.error("Apenas o dono pode alterar imagens desta escalacao.");
      return;
    }

    setBackgroundUploading(true);
    try {
      const publicUrl = await uploadLineupBackground(lineup.id, file as File);
      if (lineup.public_write) {
        await setLineupBackground(lineup.id, publicUrl);
      } else {
        await runProtectedMutation("setBackground", { backgroundUrl: publicUrl });
      }
      setLineup({ ...lineup, background_url: publicUrl });
      await broadcastLineupChange();
      toast.success("Plano de fundo atualizado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar plano de fundo.");
    } finally {
      setBackgroundUploading(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = "";
    }
  }

  async function handleClubIconFile(file: File | undefined) {
    if (!lineup || !validateImageFile(file)) return;
    if (lineup.is_private && !access?.isOwner) {
      toast.error("Apenas o dono pode alterar imagens desta escalacao.");
      return;
    }

    setClubIconUploading(true);
    try {
      const publicUrl = await uploadLineupClubIcon(lineup.id, file as File);
      if (lineup.public_write) {
        await setLineupClubIcon(lineup.id, publicUrl);
      } else {
        await runProtectedMutation("setClubIcon", { clubIconUrl: publicUrl });
      }
      setLineup({ ...lineup, club_icon_url: publicUrl });
      await broadcastLineupChange();
      toast.success("Ícone do clube atualizado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar ícone do clube.");
    } finally {
      setClubIconUploading(false);
      if (clubIconInputRef.current) clubIconInputRef.current.value = "";
    }
  }

  async function handleClearBackground() {
    if (!lineup) return;
    if (lineup.is_private && !access?.isOwner) return;

    setBackgroundUploading(true);
    try {
      if (lineup.public_write) {
        await setLineupBackground(lineup.id, null);
      } else {
        await runProtectedMutation("setBackground", { backgroundUrl: null });
      }
      setLineup({ ...lineup, background_url: null });
      await broadcastLineupChange();
      toast.success("Plano de fundo removido.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover plano de fundo.");
    } finally {
      setBackgroundUploading(false);
    }
  }

  async function handleClearClubIcon() {
    if (!lineup) return;
    if (lineup.is_private && !access?.isOwner) return;

    setClubIconUploading(true);
    try {
      if (lineup.public_write) {
        await setLineupClubIcon(lineup.id, null);
      } else {
        await runProtectedMutation("setClubIcon", { clubIconUrl: null });
      }
      setLineup({ ...lineup, club_icon_url: null });
      await broadcastLineupChange();
      toast.success("Ícone do clube removido.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover ícone do clube.");
    } finally {
      setClubIconUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!lineup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-muted-foreground">Escalação não encontrada.</p>
        <Link to="/" className="text-primary underline">
          Criar uma nova
        </Link>
      </div>
    );
  }

  const assignedPlayerIds = new Set(
    slots.filter((s) => s.player_id).map((s) => s.player_id as string),
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden lg:h-[100dvh]">
      {lineup.background_url ? (
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${lineup.background_url})` }}
          aria-hidden="true"
        />
      ) : null}
      <div
        className={`fixed inset-0 -z-10 ${
          lineup.background_url ? "bg-black/70 backdrop-blur-[1px]" : "bg-background"
        }`}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1340px] px-3 py-3 lg:h-full">
        <LineupBoard
          header={
            <LineupHeader
              lineup={lineup}
              realtimeConnected={realtimeConnected}
              collaboratorCount={collaboratorCount}
              backgroundToolsOpen={backgroundToolsOpen && (!lineup.is_private || access?.isOwner === true)}
              backgroundUploading={backgroundUploading}
              clubIconUploading={clubIconUploading}
              backgroundInputRef={backgroundInputRef}
              clubIconInputRef={clubIconInputRef}
              onBackgroundFileChange={(event) => {
                void handleBackgroundFile(event.target.files?.[0]);
              }}
              onClubIconFileChange={(event) => {
                void handleClubIconFile(event.target.files?.[0]);
              }}
              onPickBackground={() => backgroundInputRef.current?.click()}
              onPickClubIcon={() => clubIconInputRef.current?.click()}
              onClearBackground={() => {
                void handleClearBackground();
              }}
              onClearClubIcon={() => {
                void handleClearClubIcon();
              }}
              canManageSettings={lineup.is_private && access?.isOwner === true}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          }
          formations={formations}
          formationId={lineup.formation_id}
          positions={positions}
          slots={slots}
          players={players}
          onFormationChange={handleChangeFormation}
          onNewFormation={() => setEditorOpen(true)}
          onCopyLink={copyLink}
          onCopyText={copyText}
          onPositionClick={setActivePosition}
          onClearPosition={handleClearPosition}
          onDropPlayer={(position, playerId) => {
            void assignPlayerToPosition(position, playerId);
          }}
          onAddPlayer={() => {
            setEditingPlayer(null);
            setPlayerModalOpen(true);
          }}
          onEditPlayer={(p) => {
            setEditingPlayer(p);
            setPlayerModalOpen(true);
          }}
          onSendToBench={handleSendToBench}
          onRemovePlayer={handleRemovePlayer}
          onRemoveFromBench={handleRemoveFromBench}
          canEdit={canEdit}
        />

        {lineup.is_private && access?.isOwner === true ? (
          <LineupSettingsPanel
            open={settingsOpen}
            lineup={lineup}
            backgroundUploading={backgroundUploading}
            clubIconUploading={clubIconUploading}
            onClose={() => setSettingsOpen(false)}
            onChanged={() => {
              void loadLineupData();
            }}
            onBackgroundFileChange={(event) => {
              void handleBackgroundFile(event.target.files?.[0]);
            }}
            onClubIconFileChange={(event) => {
              void handleClubIconFile(event.target.files?.[0]);
            }}
            onClearBackground={() => {
              void handleClearBackground();
            }}
            onClearClubIcon={() => {
              void handleClearClubIcon();
            }}
          />
        ) : null}

        <PlayerModal
          open={playerModalOpen}
          onClose={() => {
            setPlayerModalOpen(false);
            setEditingPlayer(null);
          }}
          onSave={handleSavePlayer}
          title={editingPlayer ? "Editar jogador" : "Adicionar jogador"}
          initialName={editingPlayer?.name ?? ""}
          initialPositions={editingPlayer?.favorite_positions ?? []}
        />

        <PositionModal
          open={activePosition !== null}
          position={activePosition}
          players={players}
          assignedPlayerIds={assignedPlayerIds}
          onClose={() => setActivePosition(null)}
          onSelect={handleSelectForPosition}
        />

        <FormationEditor
          open={editorOpen}
          basePositions={positions}
          onClose={() => setEditorOpen(false)}
          onSave={handleCreateFormation}
        />
      </div>
    </main>
  );
}
