import { supabase } from "@/lib/supabase";
import leagues from "@/data/leagues.json";

async function main() {
  console.log(`Seeding ${leagues.length} leagues…`);

  const rows = leagues.map((l: any) => ({
    slug:         l.slug,
    name:         l.name,
    country:      l.country ?? null,
    logo:         l.logo ?? null,
    flag:         l.flag ?? null,
    api_id:       l.id ?? null,
    season:       l.season ?? null,
    season_start: l.seasonStart ?? null,
    season_end:   l.seasonEnd ?? null,
    type:         l.type ?? null,
    priority:     l.priority ?? 99,
  }));

  const { error } = await supabase
    .from("leagues")
    .upsert(rows, { onConflict: "slug" });

  if (error) { console.error("leagues error:", error); process.exit(1); }
  console.log("✅ leagues done");
}

main();
