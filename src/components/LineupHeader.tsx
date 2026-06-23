import { Link } from "@tanstack/react-router";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/tanstack-react-start";
import { ArrowLeft, ImagePlus, Loader2, Radio, Settings, Shirt, X } from "lucide-react";
import type { ChangeEventHandler, RefObject } from "react";
import type { Lineup } from "@/lib/types";
import { GlassCard } from "@/components/GlassCard";

interface LineupHeaderProps {
  lineup: Lineup;
  className?: string;
  realtimeConnected: boolean;
  collaboratorCount: number;
  backgroundToolsOpen: boolean;
  backgroundUploading: boolean;
  clubIconUploading: boolean;
  backgroundInputRef: RefObject<HTMLInputElement | null>;
  clubIconInputRef: RefObject<HTMLInputElement | null>;
  onBackgroundFileChange: ChangeEventHandler<HTMLInputElement>;
  onClubIconFileChange: ChangeEventHandler<HTMLInputElement>;
  onPickBackground: () => void;
  onPickClubIcon: () => void;
  onClearBackground: () => void;
  onClearClubIcon: () => void;
  canManageSettings?: boolean;
  onOpenSettings?: () => void;
}

export function LineupHeader({
  lineup,
  className = "",
  realtimeConnected,
  collaboratorCount,
  backgroundToolsOpen,
  backgroundUploading,
  clubIconUploading,
  backgroundInputRef,
  clubIconInputRef,
  onBackgroundFileChange,
  onClubIconFileChange,
  onPickBackground,
  onPickClubIcon,
  onClearBackground,
  onClearClubIcon,
  canManageSettings = false,
  onOpenSettings,
}: LineupHeaderProps) {
  return (
    <header className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      <Link
        to="/"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        aria-label="Inicio"
        title="Inicio"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-primary-foreground ${
            lineup.club_icon_url
              ? "bg-transparent shadow-lg shadow-black/25"
              : "glass-primary border"
          }`}
        >
          {lineup.club_icon_url ? (
            <img
              src={lineup.club_icon_url}
              alt={`Icone do clube ${lineup.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Shirt className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight tracking-tight">{lineup.name}</h1>
          <div
            className={`flex items-center gap-1.5 text-xs ${
              realtimeConnected ? "text-emerald-500" : "text-muted-foreground"
            }`}
          >
            <Radio className={`h-3 w-3 ${realtimeConnected ? "animate-pulse" : ""}`} />
            {realtimeConnected
              ? `Ao vivo - ${collaboratorCount} ${collaboratorCount === 1 ? "pessoa" : "pessoas"}`
              : "Conectando..."}
            <span className="text-muted-foreground/60">-</span>
            <span className="text-muted-foreground">Link compartilhavel</span>
          </div>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal" fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
            <button className="glass-surface rounded-lg border px-3 py-2 text-sm font-medium">
              Entrar
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/" signInFallbackRedirectUrl="/">
            <button className="glass-primary rounded-lg border px-3 py-2 text-sm font-semibold">
              Criar conta
            </button>
          </SignUpButton>
        </Show>
        {canManageSettings ? (
          <button
            onClick={onOpenSettings}
            className="glass-surface grid h-10 w-10 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Configuracoes"
            title="Configuracoes"
          >
            <Settings className="h-4 w-4" />
          </button>
        ) : null}
        {backgroundToolsOpen ? (
          <GlassCard
            className="rounded-lg border border-primary/40 p-1"
            contentClassName="flex flex-wrap items-center gap-2"
          >
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onBackgroundFileChange}
            />
            <input
              ref={clubIconInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onClubIconFileChange}
            />
            <button
              type="button"
              disabled={backgroundUploading}
              onClick={onPickBackground}
              className="glass-surface flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
            >
              {backgroundUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Plano de fundo
            </button>
            <button
              type="button"
              disabled={clubIconUploading}
              onClick={onPickClubIcon}
              className="glass-surface flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
            >
              {clubIconUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shirt className="h-4 w-4" />
              )}
              Icone do clube
            </button>
            {lineup.background_url ? (
              <button
                type="button"
                disabled={backgroundUploading}
                onClick={onClearBackground}
                className="glass-surface grid h-8 w-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                aria-label="Remover plano de fundo"
                title="Remover plano de fundo"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {lineup.club_icon_url ? (
              <button
                type="button"
                disabled={clubIconUploading}
                onClick={onClearClubIcon}
                className="glass-surface grid h-8 w-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                aria-label="Remover icone do clube"
                title="Remover icone do clube"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </GlassCard>
        ) : null}
      </div>
    </header>
  );
}
