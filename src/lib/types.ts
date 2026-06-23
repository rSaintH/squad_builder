export interface Lineup {
  id: string;
  share_slug: string;
  name: string;
  formation_id: string | null;
  background_url: string | null;
  club_icon_url: string | null;
  owner_clerk_user_id: string | null;
  is_private: boolean;
  public_read: boolean;
  public_write: boolean;
  realtime_secret: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  lineup_id: string;
  name: string;
  favorite_positions: string[];
  created_at: string;
}

export interface Formation {
  id: string;
  lineup_id: string | null;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface FormationPosition {
  id: string;
  formation_id: string;
  label: string;
  x: number;
  y: number;
  sort_order: number;
}

export type SlotType = "titular" | "banco";

export interface LineupSlot {
  id: string;
  lineup_id: string;
  formation_position_id: string | null;
  player_id: string | null;
  slot_type: SlotType;
  sort_order: number;
}
