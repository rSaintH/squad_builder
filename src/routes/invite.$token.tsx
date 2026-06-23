import {
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { acceptLineupInvite } from "@/lib/api/lineups.functions";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const inviteRedirectUrl = `/invite/${token}`;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function accept() {
      setAccepting(true);
      try {
        const { shareSlug } = await acceptLineupInvite({ data: { token } });
        if (!shareSlug) throw new Error("Convite sem escalacao.");
        toast.success("Convite aceito.");
        navigate({ to: "/lineup/$slug", params: { slug: shareSlug } });
      } catch (error) {
        console.error(error);
        toast.error("Convite invalido ou expirado.");
        setAccepting(false);
      }
    }

    void accept();
  }, [token, navigate, isLoaded, isSignedIn]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-md rounded-2xl border p-5 text-center">
        <Show when="signed-in">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {accepting ? "Aceitando convite..." : "Preparando convite..."}
            </p>
          </div>
        </Show>
        <Show when="signed-out">
          <h1 className="text-lg font-semibold">Entre para aceitar o convite</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este convite libera edicao apenas para usuarios autenticados.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <SignInButton
              mode="modal"
              fallbackRedirectUrl={inviteRedirectUrl}
              signUpFallbackRedirectUrl={inviteRedirectUrl}
            >
              <button className="glass-primary rounded-lg border px-4 py-2 text-sm font-semibold">
                Entrar
              </button>
            </SignInButton>
            <SignUpButton
              mode="modal"
              fallbackRedirectUrl={inviteRedirectUrl}
              signInFallbackRedirectUrl={inviteRedirectUrl}
            >
              <button className="glass-surface rounded-lg border px-4 py-2 text-sm font-medium">
                Criar conta
              </button>
            </SignUpButton>
          </div>
        </Show>
      </GlassCard>
    </main>
  );
}
