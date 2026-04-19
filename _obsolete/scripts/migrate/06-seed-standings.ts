import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";

async function main() {
  const { data: leagues } = await supabase.from("leagues").select("id, slug, season");
  const { data: teams }   = await supabase.from("teams").select("id, slug, api_football_id");

  const leagueMap   = new Map(leagues!.map((r: any) => [r.slug, r]));
  const teamBySlug  = new Map(teams!.map((r: any) => [r.slug, r.id]));
  const teamByApiId = new Map(teams!.filter((r: any) => r.api_football_id).map((r: any) => [r.api_football_id, r.id]));

  const standingsDir = path.join(process.cwd(), "data", "standings");
  const files = fs.readdirSync(standingsDir).filter((f) => f.endsWith(".json"));

  let total = 0;
  for (const file of files) {
    const leagueSlug = file.replace(/-\d{4}\.json$/, "");
    const league = leagueMap.get(leagueSlug);
    if (!league) { console.warn(`  skipping ${file} — league not found`); continue; }

    const data = JSON.parse(fs.readFileSync(path.join(standingsDir, file), "utf-8"));
    const rows: any[] = [];

    for (const group of data.groups ?? []) {
      for (const row of group.table ?? []) {
        const teamId = teamBySlug.get(row.team.slug) ?? teamByApiId.get(row.team.id) ?? null;
        if (!teamId) continue;
        rows.push({
          league_id:    league.id,
          team_id:      teamId,
          season:       league.season ?? 2025,
          rank:         row.rank,
          points:       row.points,
          played:       row.played,
          won:          row.won,
          drawn:        row.drawn,
          lost:         row.lost,
          goals_for:    row.goals_for,
          goals_against: row.goals_against,
          goal_diff:    row.goal_diff,
          form:         row.form ?? null,
          description:  row.description ?? null,
        });
      }
    }

    if (rows.length === 0) continue;
    const { error } = await supabase
      .from("standings")
      .upsert(rows, { onConflict: "league_id,team_id,season" });
    if (error) { console.error(`standings ${file} error:`, error.message); }
    total += rows.length;
    console.log(`  ${file}: ${rows.length} rows`);
  }
  console.log(`✅ standings done — ${total} total`);
}

main();
