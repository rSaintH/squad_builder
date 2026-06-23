import { supabase } from "@/integrations/supabase/client";
import type { Formation, FormationPosition } from "@/lib/types";

export async function getFormations(lineupId: string): Promise<Formation[]> {
  // Formações padrão (lineup_id null) + formações customizadas desta escalação.
  const { data, error } = await supabase
    .from("formations")
    .select()
    .or(`is_default.eq.true,lineup_id.eq.${lineupId}`)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Formation[]) ?? [];
}

export async function getPositions(
  formationId: string,
): Promise<FormationPosition[]> {
  const { data, error } = await supabase
    .from("formation_positions")
    .select()
    .eq("formation_id", formationId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as FormationPosition[]) ?? [];
}

export interface PositionDraft {
  label: string;
  x: number;
  y: number;
}

// Cria uma formação customizada ligada à escalação, copiando posições fornecidas.
export async function createCustomFormation(
  lineupId: string,
  name: string,
  positions: PositionDraft[],
): Promise<Formation> {
  const { data: formation, error } = await supabase
    .from("formations")
    .insert({ lineup_id: lineupId, name, is_default: false })
    .select()
    .single();
  if (error) throw error;
  const f = formation as Formation;

  const rows = positions.map((p, i) => ({
    formation_id: f.id,
    label: p.label,
    x: p.x,
    y: p.y,
    sort_order: i,
  }));
  const { error: posError } = await supabase
    .from("formation_positions")
    .insert(rows);
  if (posError) throw posError;
  return f;
}
