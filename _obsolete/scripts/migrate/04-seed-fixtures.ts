import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";

async function main() {
  // Lookup maps
  const { data: leagues } = await supabase.from("leagues").select("id, slug");
  const { data: teams }   = await supabase.from("teams").select("id, slug, api_football_id");
  const { data: venues }  = await supabase.from("venues").select("id, api_football_id");

  const leagueMap = new Map(leagues!.map((r: any) => [r.slug, r.id]));
  const teamBySlug = new Map(teams!.map((r: any) => [r.slug, r.id]));
  const teamByApiId = new Map(teams!.filter((r: any) => r.api_football_id).map((r: any) => [r.api_football_id, r.id]));
  const venueByApiId = new Map(venues!.filter((v: any) => v.api_football_id).map((v: any) => [v.api_football_id, v.id]));

  const fixturesDir = path.join(process.cwd(), "data", "fixtures");
  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));

  let total = 0;
  for (const file of files) {
    const leagueSlug = file.replace(/-\d{4}\.json$/, "");
    const leagueId = leagueMap.get(leagueSlug) ?? null;
    const fixtures: any[] = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), "utf-8"));

    const rows = fixtures.map((f) => {
      const homeId = teamBySlug.get(f.home_team.slug) ?? teamByApiId.get(f.home_team.id) ?? null;
      const awayId = teamBySlug.get(f.away_team.slug) ?? teamByApiId.get(f.away_team.id) ?? null;
      const venueId = f.venue_id ? (venueByApiId.get(f.venue_id) ?? null) : null;
      return {
        slug:        f.slug,
        fixture_id:  f.fixture_id ?? null,
        league_id:   leagueId,
        home_id:     homeId,
        away_id:     awayId,
        venue_id:    venueId,
        date:        f.date,
        kickoff_utc: f.kickoff_utc ?? null,
        status:      f.status ?? "NS",
        score_home:  f.score?.home ?? null,
        score_away:  f.score?.away ?? null,
        stage:       f.stage ?? null,
        matchday:    f.matchday ?? null,
        group_name:  f.group ?? null,
      };
    });

    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase
        .from("matches")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "slug" });
      if (error) { console.error(`matches ${file} chunk ${i} error:`, error.message); }
    }
    total += rows.length;
    console.log(`  ${file}: ${rows.length} fixtures`);
  }
  console.log(`✅ fixtures done — ${total} total`);
}

main();
