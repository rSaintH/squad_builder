import { useEffect, useState, type ChangeEventHandler } from "react";
import { Copy, ImagePlus, Loader2, Shield, Shirt, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import type { Lineup } from "@/lib/types";
import {
  addLineupMemberEmail,
  createLineupInvite,
  disableLineupInvites,
  getLineupSettings,
  removeLineupMember,
  updateLineupSettings,
  type LineupInvite,
  type LineupMember,
} from "@/lib/api/lineups.functions";
import { GlassCard } from "@/components/GlassCard";

interface LineupSettingsPanelProps {
  open: boolean;
  lineup: Lineup;
  backgroundUploading: boolean;
  clubIconUploading: boolean;
  onClose: () => void;
  onChanged: () => void;
  onBackgroundFileChange: ChangeEventHandler<HTMLInputElement>;
  onClubIconFileChange: ChangeEventHandler<HTMLInputElement>;
  onClearBackground: () => void;
  onClearClubIcon: () => void;
}

export function LineupSettingsPanel({
  open,
  lineup,
  backgroundUploading,
  clubIconUploading,
  onClose,
  onChanged,
  onBackgroundFileChange,
  onClubIconFileChange,
  onClearBackground,
  onClearClubIcon,
}: LineupSettingsPanelProps) {
  const [members, setMembers] = useState<LineupMember[]>([]);
  const [invites, setInvites] = useState<LineupInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function refreshSettings() {
    setLoading(true);
    try {
      const result = await getLineupSettings({ data: { lineupId: lineup.id } });
      setMembers(result.members);
      setInvites(result.invites);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void refreshSettings();
  }, [open, lineup.id]);

  if (!open) return null;

  async function toggleSetting(key: "publicRead" | "publicWrite", value: boolean) {
    setSaving(key);
    try {
      await updateLineupSettings({ data: { lineupId: lineup.id, [key]: value } });
      onChanged();
      toast.success("Configuracao atualizada.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configuracao.");
    } finally {
      setSaving(null);
    }
  }

  async function addMember() {
    const value = email.trim().toLowerCase();
    if (!value) return;
    setSaving("member");
    try {
      await addLineupMemberEmail({ data: { lineupId: lineup.id, email: value, role: "editor" } });
      setEmail("");
      await refreshSettings();
      onChanged();
      toast.success("Email adicionado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar email.");
    } finally {
      setSaving(null);
    }
  }

  async function removeMember(memberId: string) {
    setSaving(memberId);
    try {
      await removeLineupMember({ data: { lineupId: lineup.id, memberId } });
      await refreshSettings();
      onChanged();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover membro.");
    } finally {
      setSaving(null);
    }
  }

  async function createInvite() {
    setSaving("invite");
    try {
      const { token } = await createLineupInvite({ data: { lineupId: lineup.id } });
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      await refreshSettings();
      toast.success("Link de convite copiado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar convite.");
    } finally {
      setSaving(null);
    }
  }

  async function disableInvites() {
    setSaving("disable-invites");
    try {
      await disableLineupInvites({ data: { lineupId: lineup.id } });
      await refreshSettings();
      onChanged();
      toast.success("Convites desativados.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desativar convites.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-6 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl rounded-2xl border p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuracoes</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Fechar configuracoes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Acesso por link</h3>
            <label className="glass-surface flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm">Qualquer pessoa com link pode ver</span>
              <input
                type="checkbox"
                checked={lineup.public_read}
                disabled={saving === "publicRead"}
                onChange={(event) => void toggleSetting("publicRead", event.target.checked)}
              />
            </label>
            <label className="glass-surface flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm">Qualquer pessoa nao autenticada pode editar</span>
              <input
                type="checkbox"
                checked={lineup.public_write}
                disabled={saving === "publicWrite"}
                onChange={(event) => void toggleSetting("publicWrite", event.target.checked)}
              />
            </label>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Imagens</h3>
            <div className="flex flex-wrap gap-2">
              <label className="glass-surface flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium">
                {backgroundUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                Plano de fundo
                <input type="file" accept="image/*" className="sr-only" onChange={onBackgroundFileChange} />
              </label>
              <label className="glass-surface flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium">
                {clubIconUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shirt className="h-4 w-4" />
                )}
                Icone do clube
                <input type="file" accept="image/*" className="sr-only" onChange={onClubIconFileChange} />
              </label>
              {lineup.background_url ? (
                <button onClick={onClearBackground} className="glass-surface rounded-lg border px-3 py-2 text-sm">
                  Remover fundo
                </button>
              ) : null}
              {lineup.club_icon_url ? (
                <button onClick={onClearClubIcon} className="glass-surface rounded-lg border px-3 py-2 text-sm">
                  Remover icone
                </button>
              ) : null}
            </div>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Editores por email</h3>
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void addMember()}
                placeholder="email@clube.com"
                className="glass-surface min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => void addMember()}
                disabled={saving === "member"}
                className="glass-primary rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="grid gap-1">
                {members.map((member) => (
                  <div key={member.id} className="glass-surface flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {member.email ?? member.clerk_user_id}
                    </span>
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                    {member.role !== "owner" ? (
                      <button
                        onClick={() => void removeMember(member.id)}
                        disabled={saving === member.id}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-destructive disabled:opacity-50"
                        aria-label="Remover membro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Convite autenticado</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void createInvite()}
                disabled={saving === "invite"}
                className="glass-primary flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {saving === "invite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Gerar e copiar
              </button>
              <button
                onClick={() => void disableInvites()}
                disabled={saving === "disable-invites"}
                className="glass-surface rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Desativar links
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Convites ativos: {invites.filter((invite) => invite.enabled).length}
            </p>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
