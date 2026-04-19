import { supabase } from "@/lib/supabase";
import wcPlayers from "@/data/players.json";
import clubPlayers from "@/data/club-players.json";

async function main() {
  const { data: teams } = await supabase.from("teams").select("id, slug, api_football_id");
  const teamBySlug  = new Map(teams!.map((r: any) => [r.slug, r.id]));
  const teamByApiId = new Map(teams!.filter((r: any) => r.api_football_id).map((r: any) => [r.api_football_id, r.id]));

  const rows: any[] = [];

  for (const p of wcPlayers as any[]) {
    const teamId = p.teamSlug ? (teamBySlug.get(p.teamSlug) ?? null) : (p.teamId ? teamByApiId.get(p.teamId) ?? null : null);
    rows.push({
      slug:            p.slug,
      name:            p.name,
      photo:           p.photo_url ?? null,
      position:        p.position ?? null,
      nationality:     p.nationality ?? null,
      date_of_birth:   p.dateOfBirth ?? null,
      shirt_number:    p.shirtNumber ?? null,
      api_football_id: p.id ?? null,
      team_id:         teamId,
    });
  }

  for (const p of clubPlayers as any[]) {
    const teamId = p.teamSlug ? (teamBySlug.get(p.teamSlug) ?? null) : (p.teamId ? teamByApiId.get(p.teamId) ?? null : null);
    rows.push({
      slug:            p.slug,
      name:            p.name,
      photo:           p.photo_url ?? null,
      position:        p.position ?? null,
      nationality:     p.nationality ?? null,
      date_of_birth:   p.dateOfBirth ?? null,
      shirt_number:    p.shirtNumber ?? null,
      api_football_id: p.id ?? null,
      team_id:         teamId,
    });
  }

  console.log(`Seeding ${rows.length} players…`);
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from("players")
      .upsert(rows.slice(i, i + CHUNK), { onConflict: "slug" });
    if (error) { console.error(`players chunk ${i} error:`, error.message); }
    process.stdout.write(`\r  ${i + Math.min(CHUNK, rows.length - i)}/${rows.length}`);
  }
  console.log("\n✅ players done");
}

main();
