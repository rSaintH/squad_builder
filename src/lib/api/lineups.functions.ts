import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Formation, FormationPosition, Lineup, LineupSlot, Player } from "@/lib/types";
import { generateSlug } from "@/lib/utils";

export interface LineupAccess {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isOwner: boolean;
  isMember: boolean;
  memberRole: "owner" | "editor" | "viewer" | null;
  canRead: boolean;
  canEdit: boolean;
}

export interface LineupPageData {
  lineup: Lineup | null;
  players: Player[];
  formations: Formation[];
  slots: LineupSlot[];
  positions: FormationPosition[];
  access: LineupAccess;
}

export interface LineupMember {
  id: string;
  clerk_user_id: string | null;
  email: string | null;
  role: "owner" | "editor" | "viewer";
}

export interface LineupInvite {
  id: string;
  role: "owner" | "editor" | "viewer";
  requires_auth: boolean;
  enabled: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface MyLineupSummary {
  id: string;
  share_slug: string;
  name: string;
  club_icon_url: string | null;
  is_private: boolean;
  public_read: boolean;
  public_write: boolean;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
}

const emptyAccess: LineupAccess = {
  isAuthenticated: false,
  userId: null,
  email: null,
  isOwner: false,
  isMember: false,
  memberRole: null,
  canRead: false,
  canEdit: false,
};

async function getServerDeps() {
  const [{ auth, clerkClient }, { supabaseAdmin }] = await Promise.all([
    import("@clerk/tanstack-react-start/server"),
    import("@/integrations/supabase/client.server"),
  ]);
  return { auth, clerkClient, supabaseAdmin };
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

async function hashToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

async function randomToken() {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(24).toString("base64url");
}

async function getCurrentClerkUser() {
  const { auth, clerkClient } = await getServerDeps();
  const authState = await auth();
  const userId = authState.userId ?? null;
  if (!userId) return { userId: null, email: null };

  const user = await clerkClient().users.getUser(userId);
  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  return { userId, email: normalizeEmail(primaryEmail) };
}

function assertCanRead(access: LineupAccess) {
  if (!access.canRead) throw new Error("Voce nao tem acesso a esta escalacao.");
}

function assertCanEdit(access: LineupAccess) {
  if (!access.canEdit) throw new Error("Voce nao pode editar esta escalacao.");
}

function assertOwner(access: LineupAccess) {
  if (!access.isOwner) throw new Error("Apenas o dono pode alterar estas configuracoes.");
}

async function computeAccess(
  lineup: Lineup,
  inviteToken?: string | null,
): Promise<LineupAccess> {
  const { supabaseAdmin } = await getServerDeps();
  const { userId, email } = await getCurrentClerkUser();

  const isOwner = Boolean(userId && lineup.owner_clerk_user_id === userId);
  const memberQuery = supabaseAdmin
    .from("lineup_members")
    .select("role")
    .eq("lineup_id", lineup.id)
    .or(
      [
        userId ? `clerk_user_id.eq.${userId}` : null,
        email ? `email.eq.${email}` : null,
      ]
        .filter(Boolean)
        .join(","),
    )
    .limit(1);

  const { data: memberRows, error: memberError } =
    userId || email ? await memberQuery : { data: [], error: null };
  if (memberError) throw memberError;

  const memberRole = (memberRows?.[0]?.role as LineupAccess["memberRole"]) ?? null;
  const isMember = memberRole != null;

  let inviteCanRead = false;
  let inviteCanEdit = false;
  if (inviteToken) {
    const { data: invite, error } = await supabaseAdmin
      .from("lineup_invites")
      .select("role, requires_auth, enabled, expires_at")
      .eq("lineup_id", lineup.id)
      .eq("token_hash", await hashToken(inviteToken))
      .maybeSingle();
    if (error) throw error;
    const stillValid =
      invite?.enabled === true &&
      (!invite.expires_at || new Date(invite.expires_at).getTime() > Date.now()) &&
      (!invite.requires_auth || Boolean(userId));
    inviteCanRead = Boolean(stillValid);
    inviteCanEdit = Boolean(stillValid && invite?.role !== "viewer" && userId);
  }

  const publicRead = lineup.public_read || lineup.public_write;
  const canRead = isOwner || isMember || inviteCanRead || publicRead;
  const canEdit =
    isOwner ||
    memberRole === "owner" ||
    memberRole === "editor" ||
    inviteCanEdit ||
    lineup.public_write;

  return {
    isAuthenticated: Boolean(userId),
    userId,
    email,
    isOwner,
    isMember,
    memberRole,
    canRead,
    canEdit,
  };
}

async function getLineupById(lineupId: string) {
  const { supabaseAdmin } = await getServerDeps();
  const { data, error } = await supabaseAdmin
    .from("lineups")
    .select()
    .eq("id", lineupId)
    .maybeSingle();
  if (error) throw error;
  return (data as Lineup | null) ?? null;
}

export const getLineupPageData = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      slug: z.string().min(1),
      inviteToken: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }): Promise<LineupPageData> => {
    const { supabaseAdmin } = await getServerDeps();
    const { data: lineupRow, error: lineupError } = await supabaseAdmin
      .from("lineups")
      .select()
      .eq("share_slug", data.slug)
      .maybeSingle();
    if (lineupError) throw lineupError;

    const lineup = (lineupRow as Lineup | null) ?? null;
    if (!lineup) {
      return { lineup: null, players: [], formations: [], slots: [], positions: [], access: emptyAccess };
    }

    const access = await computeAccess(lineup, data.inviteToken);
    assertCanRead(access);

    const [playersResult, formationsResult, slotsResult, positionsResult] = await Promise.all([
      supabaseAdmin
        .from("players")
        .select()
        .eq("lineup_id", lineup.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("formations")
        .select()
        .or(`is_default.eq.true,lineup_id.eq.${lineup.id}`)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("lineup_slots").select().eq("lineup_id", lineup.id),
      lineup.formation_id
        ? supabaseAdmin
            .from("formation_positions")
            .select()
            .eq("formation_id", lineup.formation_id)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of [playersResult, formationsResult, slotsResult, positionsResult]) {
      if (result.error) throw result.error;
    }

    return {
      lineup,
      players: (playersResult.data as Player[]) ?? [],
      formations: (formationsResult.data as Formation[]) ?? [],
      slots: (slotsResult.data as LineupSlot[]) ?? [],
      positions: (positionsResult.data as FormationPosition[]) ?? [],
      access,
    };
  });

export const createPrivateLineup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }): Promise<Lineup> => {
    const { supabaseAdmin } = await getServerDeps();
    const { userId, email } = await getCurrentClerkUser();
    if (!userId) throw new Error("Entre para criar uma escalacao privada.");

    let slug = generateSlug();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: lineup, error } = await supabaseAdmin
        .from("lineups")
        .insert({
          name: data.name,
          share_slug: slug,
          owner_clerk_user_id: userId,
          is_private: true,
          public_read: false,
          public_write: false,
        })
        .select()
        .single();

      if (!error && lineup) {
        await supabaseAdmin.from("lineup_members").insert({
          lineup_id: lineup.id,
          clerk_user_id: userId,
          email,
          role: "owner",
        });
        return lineup as Lineup;
      }
      if (error?.code === "23505") {
        slug = generateSlug();
        continue;
      }
      if (error) throw error;
    }
    throw new Error("Nao foi possivel criar a escalacao privada.");
  });

export const getMyLineups = createServerFn({ method: "POST" })
  .handler(async (): Promise<MyLineupSummary[]> => {
    const { supabaseAdmin } = await getServerDeps();
    const { userId, email } = await getCurrentClerkUser();
    if (!userId) return [];

    const memberFilters = [
      `clerk_user_id.eq.${userId}`,
      email ? `email.eq.${email}` : null,
    ].filter(Boolean);

    const [ownedResult, memberResult] = await Promise.all([
      supabaseAdmin
        .from("lineups")
        .select("id, share_slug, name, club_icon_url, is_private, public_read, public_write, updated_at")
        .eq("owner_clerk_user_id", userId),
      memberFilters.length > 0
        ? supabaseAdmin
            .from("lineup_members")
            .select("lineup_id, role")
            .or(memberFilters.join(","))
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (ownedResult.error) throw ownedResult.error;
    if (memberResult.error) throw memberResult.error;

    const lineupsById = new Map<string, MyLineupSummary>();
    for (const row of (ownedResult.data as Lineup[]) ?? []) {
      lineupsById.set(row.id, {
        id: row.id,
        share_slug: row.share_slug,
        name: row.name,
        club_icon_url: row.club_icon_url,
        is_private: row.is_private,
        public_read: row.public_read,
        public_write: row.public_write,
        updated_at: row.updated_at,
        role: "owner",
      });
    }

    const memberRows = ((memberResult.data ?? []) as Array<{
      lineup_id: string;
      role: "owner" | "editor" | "viewer";
    }>).filter((row) => !lineupsById.has(row.lineup_id));

    if (memberRows.length > 0) {
      const memberRoleByLineup = new Map(memberRows.map((row) => [row.lineup_id, row.role]));
      const { data: memberLineups, error } = await supabaseAdmin
        .from("lineups")
        .select("id, share_slug, name, club_icon_url, is_private, public_read, public_write, updated_at")
        .in("id", memberRows.map((row) => row.lineup_id));
      if (error) throw error;

      for (const row of (memberLineups as Lineup[]) ?? []) {
        lineupsById.set(row.id, {
          id: row.id,
          share_slug: row.share_slug,
          name: row.name,
          club_icon_url: row.club_icon_url,
          is_private: row.is_private,
          public_read: row.public_read,
          public_write: row.public_write,
          updated_at: row.updated_at,
          role: memberRoleByLineup.get(row.id) ?? "viewer",
        });
      }
    }

    return Array.from(lineupsById.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  });

export const mutateLineup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid(), kind: z.string(), payload: z.any() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    const access = await computeAccess(lineup);
    assertCanEdit(access);

    const payload = data.payload as Record<string, unknown>;
    switch (data.kind) {
      case "setFormation": {
        const { error } = await supabaseAdmin
          .from("lineups")
          .update({ formation_id: (payload.formationId as string) ?? null })
          .eq("id", data.lineupId);
        if (error) throw error;
        return null;
      }
      case "setBackground": {
        const { error } = await supabaseAdmin
          .from("lineups")
          .update({ background_url: (payload.backgroundUrl as string | null) ?? null })
          .eq("id", data.lineupId);
        if (error) throw error;
        return null;
      }
      case "setClubIcon": {
        const { error } = await supabaseAdmin
          .from("lineups")
          .update({ club_icon_url: (payload.clubIconUrl as string | null) ?? null })
          .eq("id", data.lineupId);
        if (error) throw error;
        return null;
      }
      case "addPlayer": {
        const { data: player, error } = await supabaseAdmin
          .from("players")
          .insert({
            lineup_id: data.lineupId,
            name: payload.name as string,
            favorite_positions: (payload.favoritePositions as string[]) ?? [],
          })
          .select()
          .single();
        if (error) throw error;
        return player;
      }
      case "updatePlayer": {
        const { error } = await supabaseAdmin
          .from("players")
          .update({
            name: payload.name as string,
            favorite_positions: (payload.favoritePositions as string[]) ?? [],
          })
          .eq("id", payload.id as string)
          .eq("lineup_id", data.lineupId);
        if (error) throw error;
        return null;
      }
      case "deletePlayer": {
        const { error } = await supabaseAdmin
          .from("players")
          .delete()
          .eq("id", payload.id as string)
          .eq("lineup_id", data.lineupId);
        if (error) throw error;
        return null;
      }
      case "assignToPosition": {
        const playerId = payload.playerId as string;
        const formationPositionId = payload.formationPositionId as string;
        await supabaseAdmin
          .from("lineup_slots")
          .delete()
          .eq("lineup_id", data.lineupId)
          .or(`formation_position_id.eq.${formationPositionId},player_id.eq.${playerId}`);
        const { error } = await supabaseAdmin.from("lineup_slots").insert({
          lineup_id: data.lineupId,
          formation_position_id: formationPositionId,
          player_id: playerId,
          slot_type: "titular",
        });
        if (error) throw error;
        return null;
      }
      case "assignToBench": {
        const playerId = payload.playerId as string;
        await supabaseAdmin
          .from("lineup_slots")
          .delete()
          .eq("lineup_id", data.lineupId)
          .eq("player_id", playerId);
        const { error } = await supabaseAdmin.from("lineup_slots").insert({
          lineup_id: data.lineupId,
          player_id: playerId,
          slot_type: "banco",
        });
        if (error) throw error;
        return null;
      }
      case "clearPosition": {
        const { error } = await supabaseAdmin
          .from("lineup_slots")
          .delete()
          .eq("lineup_id", data.lineupId)
          .eq("formation_position_id", payload.formationPositionId as string);
        if (error) throw error;
        return null;
      }
      case "removeFromLineup": {
        const { error } = await supabaseAdmin
          .from("lineup_slots")
          .delete()
          .eq("lineup_id", data.lineupId)
          .eq("player_id", payload.playerId as string);
        if (error) throw error;
        return null;
      }
      case "replaceTitularSlots": {
        const assignments = (payload.assignments as Array<{
          formationPositionId: string;
          playerId: string;
        }>) ?? [];
        const { error: deleteError } = await supabaseAdmin
          .from("lineup_slots")
          .delete()
          .eq("lineup_id", data.lineupId)
          .eq("slot_type", "titular");
        if (deleteError) throw deleteError;
        if (assignments.length === 0) return null;
        const { error } = await supabaseAdmin.from("lineup_slots").insert(
          assignments.map((assignment, sortOrder) => ({
            lineup_id: data.lineupId,
            formation_position_id: assignment.formationPositionId,
            player_id: assignment.playerId,
            slot_type: "titular",
            sort_order: sortOrder,
          })),
        );
        if (error) throw error;
        return null;
      }
      case "createCustomFormation": {
        const { data: formation, error } = await supabaseAdmin
          .from("formations")
          .insert({
            lineup_id: data.lineupId,
            name: payload.name as string,
            is_default: false,
          })
          .select()
          .single();
        if (error) throw error;
        const positions = (payload.positions as Array<{ label: string; x: number; y: number }>) ?? [];
        const { error: positionsError } = await supabaseAdmin.from("formation_positions").insert(
          positions.map((position, sortOrder) => ({
            formation_id: formation.id,
            label: position.label,
            x: position.x,
            y: position.y,
            sort_order: sortOrder,
          })),
        );
        if (positionsError) throw positionsError;
        return formation;
      }
      default:
        throw new Error("Mutacao desconhecida.");
    }
  });

export const getFormationPositionsForLineup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid(), formationId: z.string().uuid() }))
  .handler(async ({ data }): Promise<FormationPosition[]> => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertCanRead(await computeAccess(lineup));

    const { data: rows, error } = await supabaseAdmin
      .from("formation_positions")
      .select()
      .eq("formation_id", data.formationId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (rows as FormationPosition[]) ?? [];
  });

export const updateLineupSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      lineupId: z.string().uuid(),
      publicRead: z.boolean().optional(),
      publicWrite: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const patch: { public_read?: boolean; public_write?: boolean; realtime_secret?: string } = {};
    if (typeof data.publicRead === "boolean") patch.public_read = data.publicRead;
    if (typeof data.publicWrite === "boolean") patch.public_write = data.publicWrite;
    patch.realtime_secret = await randomToken();

    const { error } = await supabaseAdmin.from("lineups").update(patch).eq("id", data.lineupId);
    if (error) throw error;
    return null;
  });

export const getLineupSettings = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const [membersResult, invitesResult] = await Promise.all([
      supabaseAdmin
        .from("lineup_members")
        .select("id, clerk_user_id, email, role")
        .eq("lineup_id", data.lineupId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("lineup_invites")
        .select("id, role, requires_auth, enabled, expires_at, created_at")
        .eq("lineup_id", data.lineupId)
        .order("created_at", { ascending: false }),
    ]);
    if (membersResult.error) throw membersResult.error;
    if (invitesResult.error) throw invitesResult.error;
    return {
      members: (membersResult.data as LineupMember[]) ?? [],
      invites: (invitesResult.data as LineupInvite[]) ?? [],
    };
  });

export const addLineupMemberEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      lineupId: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(["editor", "viewer"]).default("editor"),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const normalizedEmail = normalizeEmail(data.email) as string;
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("lineup_members")
      .select("id")
      .eq("lineup_id", data.lineupId)
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingError) throw existingError;

    const result = existing
      ? await supabaseAdmin
          .from("lineup_members")
          .update({ role: data.role })
          .eq("id", existing.id)
      : await supabaseAdmin.from("lineup_members").insert({
          lineup_id: data.lineupId,
          email: normalizedEmail,
          role: data.role,
        });
    if (result.error) throw result.error;
    return null;
  });

export const removeLineupMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid(), memberId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const { error } = await supabaseAdmin
      .from("lineup_members")
      .delete()
      .eq("id", data.memberId)
      .eq("lineup_id", data.lineupId)
      .neq("role", "owner");
    if (error) throw error;
    return null;
  });

export const createLineupInvite = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const token = await randomToken();
    const { error } = await supabaseAdmin.from("lineup_invites").insert({
      lineup_id: data.lineupId,
      token_hash: await hashToken(token),
      role: "editor",
      requires_auth: true,
      enabled: true,
    });
    if (error) throw error;
    return { token };
  });

export const disableLineupInvites = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineupId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const lineup = await getLineupById(data.lineupId);
    if (!lineup) throw new Error("Escalacao nao encontrada.");
    assertOwner(await computeAccess(lineup));

    const { error } = await supabaseAdmin
      .from("lineup_invites")
      .update({ enabled: false })
      .eq("lineup_id", data.lineupId);
    if (error) throw error;
    await supabaseAdmin
      .from("lineups")
      .update({ realtime_secret: await randomToken() })
      .eq("id", data.lineupId);
    return null;
  });

export const acceptLineupInvite = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(16) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await getServerDeps();
    const { userId, email } = await getCurrentClerkUser();
    if (!userId) throw new Error("Entre para aceitar o convite.");

    const { data: invite, error } = await supabaseAdmin
      .from("lineup_invites")
      .select("lineup_id, role, requires_auth, enabled, expires_at, lineups(share_slug)")
      .eq("token_hash", await hashToken(data.token))
      .maybeSingle();
    if (error) throw error;
    const valid =
      invite?.enabled === true &&
      (!invite.expires_at || new Date(invite.expires_at).getTime() > Date.now());
    if (!invite || !valid) throw new Error("Convite invalido ou expirado.");

    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from("lineup_members")
      .select("id, role")
      .eq("lineup_id", invite.lineup_id)
      .or(
        [userId ? `clerk_user_id.eq.${userId}` : null, email ? `email.eq.${email}` : null]
          .filter(Boolean)
          .join(","),
      )
      .maybeSingle();
    if (existingMemberError) throw existingMemberError;

    const memberResult = existingMember
      ? await supabaseAdmin
          .from("lineup_members")
          .update({ email, role: existingMember.role === "owner" ? "owner" : invite.role })
          .eq("id", existingMember.id)
      : await supabaseAdmin.from("lineup_members").insert({
          lineup_id: invite.lineup_id,
          clerk_user_id: userId,
          email,
          role: invite.role,
        });
    if (memberResult.error) throw memberResult.error;

    const lineupRelation = invite.lineups as { share_slug: string } | { share_slug: string }[] | null;
    const shareSlug = Array.isArray(lineupRelation)
      ? lineupRelation[0]?.share_slug
      : lineupRelation?.share_slug;
    return { shareSlug };
  });
