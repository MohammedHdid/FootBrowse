import { supabase } from "@/lib/supabase";
import wcTeams from "@/data/teams.json";
import clubTeams from "@/data/club-teams.json";

async function main() {
  // Build league slug → UUID map
  const { data: leagueRows, error: le } = await supabase
    .from("leagues").select("id, slug");
  if (le) { console.error(le); process.exit(1); }
  const leagueMap = new Map(leagueRows!.map((r: any) => [r.slug, r.id]));

  // Build venue lookup: api_football_id → UUID
  const { data: venueRows, error: ve } = await supabase
    .from("venues").select("id, api_football_id, slug");
  if (ve) { console.error(ve); process.exit(1); }
  const venueByApiId = new Map(venueRows!.filter((v: any) => v.api_football_id).map((v: any) => [v.api_football_id, v.id]));
  const venueBySlug  = new Map(venueRows!.map((v: any) => [v.slug, v.id]));

  const rows: any[] = [];

  // WC national teams
  for (const t of wcTeams as any[]) {
    rows.push({
      slug:         t.slug,
      name:         t.name,
      logo:         t.badge_url ?? t.logo_url ?? null,
      country:      t.name,
      is_national:  true,
      flag_url:     t.flag_url ?? null,
      flag_large:   t.flag_large ?? null,
      confederation: t.confederation ?? null,
      fifa_rank:    t.fifa_rank ?? null,
      wc_titles:    t.wc_titles ?? null,
      wc_group:     t.group ?? null,
      color_primary:   t.color_primary ?? null,
      color_secondary: t.color_secondary ?? null,
      league_id:    leagueMap.get("world-cup") ?? null,
      venue_id:     t.stadium_slug ? (venueBySlug.get(t.stadium_slug) ?? null) : null,
    });
  }

  // Club teams
  for (const t of clubTeams as any[]) {
    const venueId = t.venue?.id ? (venueByApiId.get(t.venue.id) ?? null) : null;
    const leagueId = t.primary_league_slug ? (leagueMap.get(t.primary_league_slug) ?? null) : null;
    rows.push({
      slug:            t.slug,
      name:            t.name,
      logo:            t.logo ?? null,
      country:         t.country ?? null,
      founded:         t.founded ?? null,
      api_football_id: t.id ?? null,
      league_id:       leagueId,
      venue_id:        venueId,
      is_national:     false,
    });
  }

  console.log(`Seeding ${rows.length} teams…`);
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from("teams")
      .upsert(rows.slice(i, i + CHUNK), { onConflict: "slug" });
    if (error) { console.error(`teams chunk ${i} error:`, error); process.exit(1); }
  }
  console.log("✅ teams done");
}

main();
