import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Loader2, Shirt } from "lucide-react";
import { toast } from "sonner";
import { createPrivateLineup, getMyLineups } from "@/lib/api/lineups.functions";
import { createLineup } from "@/services/lineups";
import { AdSenseRail } from "@/components/AdSenseRail";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Montador de Escalacao - Pro Clubs" },
      {
        name: "description",
        content: "Monte a escalacao do dia do Pro Clubs com seus amigos e compartilhe por link.",
      },
      { property: "og:title", content: "Montador de Escalacao - Pro Clubs" },
      {
        property: "og:description",
        content: "Monte a escalacao do dia do Pro Clubs com seus amigos e compartilhe por link.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"public" | "private" | null>(null);
  const myLineupsQuery = useQuery({
    queryKey: ["my-lineups"],
    queryFn: () => getMyLineups(),
    enabled: Boolean(isSignedIn),
  });

  const myLineups = myLineupsQuery.data ?? [];

  async function handleCreate() {
    const value = name.trim() || "Pro Clubs de hoje";
    setLoading("public");
    try {
      const lineup = await createLineup(value);
      navigate({ to: "/lineup/$slug", params: { slug: lineup.share_slug } });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar escalacao. Tente novamente.");
      setLoading(null);
    }
  }

  async function handleCreatePrivate() {
    const value = name.trim() || "Pro Clubs privado";
    setLoading("private");
    try {
      const lineup = await createPrivateLineup({ data: { name: value } });
      navigate({ to: "/lineup/$slug", params: { slug: lineup.share_slug } });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar escalacao privada. Tente novamente.");
      setLoading(null);
    }
  }

  function handleJoin() {
    const slug = code
      .trim()
      .replace(/^.*\/lineup\//, "")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) {
      toast.error("Digite o codigo da escalacao.");
      return;
    }

    navigate({ to: "/lineup/$slug", params: { slug } });
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 items-center gap-8 xl:grid-cols-[160px_minmax(0,28rem)_160px]">
        <AdSenseRail side="left" />
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 flex justify-end gap-2">
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
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Shirt className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Escalacao Pro Clubs</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Monte a escalacao do dia e compartilhe o link com a galera.
            </p>
          </div>

          <GlassCard className="rounded-2xl border p-5">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Nome da escalacao
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Pro Clubs de hoje"
              className="glass-surface mb-4 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={handleCreate}
              disabled={loading !== null}
              className="glass-primary flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "public" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar escalacao"
              )}
            </button>
            <Show when="signed-in">
              <button
                onClick={handleCreatePrivate}
                disabled={loading !== null}
                className="glass-surface mt-2 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading === "private" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Criar privada
              </button>
            </Show>
          </GlassCard>

          <GlassCard className="mt-3 rounded-2xl border p-5">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Entrar por codigo
            </label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="ex: ef42kjgl"
                className="glass-surface min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                onClick={handleJoin}
                className="glass-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-90"
                aria-label="Entrar na escalacao"
                title="Entrar"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>

          <Show when="signed-in">
            <GlassCard className="mt-3 rounded-2xl border p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Minhas escalacoes</h2>
                {myLineupsQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>

              {myLineupsQuery.isError ? (
                <p className="text-sm text-destructive">Erro ao carregar suas escalacoes.</p>
              ) : myLineups.length > 0 ? (
                <div className="space-y-2">
                  {myLineups.map((lineup) => (
                    <button
                      key={lineup.id}
                      type="button"
                      onClick={() => {
                        navigate({ to: "/lineup/$slug", params: { slug: lineup.share_slug } });
                      }}
                      className="glass-surface flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-primary/45"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                          lineup.club_icon_url ? "bg-transparent" : "glass-primary border"
                        }`}
                      >
                        {lineup.club_icon_url ? (
                          <img
                            src={lineup.club_icon_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Shirt className="h-5 w-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{lineup.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {lineup.role === "owner"
                            ? "Dono"
                            : lineup.role === "editor"
                              ? "Editor"
                              : "Visualizador"}
                          {" · "}
                          {lineup.is_private ? "Privada" : "Publica"}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Suas escalacoes privadas e convites aceitos aparecem aqui.
                </p>
              )}
            </GlassCard>
          </Show>
        </div>
        <AdSenseRail side="right" />
      </div>
    </main>
  );
}
