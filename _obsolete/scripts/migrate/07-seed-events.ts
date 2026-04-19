import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";

async function main() {
  const { data: matches } = await supabase.from("matches").select("id, fixture_id");
  const { data: teams }   = await supabase.from("teams").select("id, api_football_id");

  const matchByFixtureId = new Map(matches!.filter((m: any) => m.fixture_id).map((m: any) => [m.fixture_id, m.id]));
  const teamByApiId      = new Map(teams!.filter((t: any) => t.api_football_id).map((t: any) => [t.api_football_id, t.id]));

  const eventsDir = path.join(process.cwd(), "data", "match-events");
  const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".json"));

  let total = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(eventsDir, file), "utf-8"));
    const matchId = matchByFixtureId.get(data.fixture_id) ?? null;
    if (!matchId) continue;

    // Seed match_stats
    if (data.home_stats || data.away_stats) {
      const statsRows: any[] = [];
      for (const [side, stats] of [["home", data.home_stats], ["away", data.away_stats]] as const) {
        if (!stats) continue;
        const teamApiId = data[`${side}_team_id`] ?? null;
        const teamId = teamApiId ? (teamByApiId.get(teamApiId) ?? null) : null;
        const statMap = new Map(stats.map((s: any) => [s.type, s.value]));
        statsRows.push({
          match_id:     matchId,
          team_id:      teamId,
          possession:   parseInt(statMap.get("Ball Possession") ?? "0") || null,
          shots_on:     statMap.get("Shots on Goal") ?? null,
          shots_total:  statMap.get("Total Shots") ?? null,
          corners:      statMap.get("Corner Kicks") ?? null,
          fouls:        statMap.get("Fouls") ?? null,
          yellow_cards: statMap.get("Yellow Cards") ?? null,
          red_cards:    statMap.get("Red Cards") ?? null,
          xg:           statMap.get("expected_goals") ?? null,
          pass_accuracy: statMap.get("Passes %") ? parseInt(statMap.get("Passes %")) : null,
          offsides:     statMap.get("Offsides") ?? null,
          saves:        statMap.get("Goalkeeper Saves") ?? null,
        });
      }
      if (statsRows.length > 0) {
        const { error } = await supabase
          .from("match_stats")
          .upsert(statsRows, { onConflict: "match_id,team_id" });
        if (error) console.warn(`  match_stats ${file}:`, error.message);
      }
    }

    // Seed match_events
    const events: any[] = data.events ?? [];
    if (events.length === 0) continue;

    const rows = events.map((e: any) => ({
      match_id:      matchId,
      type:          e.type ?? null,
      detail:        e.detail ?? null,
      minute:        e.minute ?? null,
      extra_minute:  e.extra ?? null,
      player_name:   e.player ?? null,
      player_api_id: e.player_id ?? null,
      assist_name:   e.assist ?? null,
      assist_api_id: e.assist_id ?? null,
      team_id:       e.team_id ? (teamByApiId.get(e.team_id) ?? null) : null,
    }));

    // Delete existing events for this match then insert fresh
    await supabase.from("match_events").delete().eq("match_id", matchId);
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase.from("match_events").insert(rows.slice(i, i + CHUNK));
      if (error) console.warn(`  events ${file} chunk ${i}:`, error.message);
    }
    total += rows.length;
  }
  console.log(`✅ events done — ${total} events across ${files.length} files`);
}

main();
