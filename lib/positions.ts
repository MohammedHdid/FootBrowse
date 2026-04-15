/**
 * Maps all football-data.org position strings to display info.
 * Covers both the high-level values (Goalkeeper, Defence, Midfield, Offence)
 * and the granular ones (Centre-Back, Attacking Midfield, etc.)
 */
export interface PositionStyle {
  color: string;
  bg: string;
  border: string;
  label: string;
}

const POSITION_MAP: Record<string, PositionStyle> = {
  // Goalkeepers
  Goalkeeper: { color: "#EAB308", bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)", label: "GK" },

  // Defenders
  Defence:    { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "DEF" },
  "Centre-Back": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "CB" },
  "Right-Back":  { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "RB" },
  "Left-Back":   { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "LB" },

  // Midfielders
  Midfield:           { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "MID" },
  "Central Midfield": { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "CM" },
  "Defensive Midfield": { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "DM" },
  "Right Midfield":   { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "RM" },
  "Left Midfield":    { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "LM" },

  // API-Football simple positions (club squads)
  Defender:           { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "DEF" },
  Midfielder:         { color: "#22C55E", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  label: "MID" },
  Forward:            { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  label: "FWD" },
  Attacker:           { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  label: "FWD" },

  // Attackers
  Offence:            { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "FWD" },
  "Centre-Forward":   { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "CF" },
  "Attacking Midfield": { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "AM" },
  "Right Winger":     { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "RW" },
  "Left Winger":      { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "LW" },
  "Second Striker":   { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "SS" },
};

const DEFAULT_POSITION: PositionStyle = {
  color: "#6B7280",
  bg: "rgba(107,114,128,0.12)",
  border: "rgba(107,114,128,0.3)",
  label: "—",
};

export function getPositionStyle(position: string): PositionStyle {
  return POSITION_MAP[position] ?? DEFAULT_POSITION;
}
