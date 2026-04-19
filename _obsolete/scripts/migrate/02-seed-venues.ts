import { supabase } from "@/lib/supabase";
import stadiums from "@/data/stadiums.json";
import clubTeams from "@/data/club-teams.json";

async function main() {
  const rows: any[] = [];

  // WC stadiums
  for (const s of stadiums as any[]) {
    rows.push({
      slug:     s.slug,
      name:     s.name,
      city:     s.city ?? null,
      state:    s.state ?? null,
      country:  s.country ?? null,
      capacity: s.capacity ?? null,
      photo:    s.photo_url ?? null,
      surface:  s.surface ?? null,
      lat:      s.lat ?? null,
      lng:      s.lng ?? null,
    });
  }

  // Club venues (from club-teams inline venue data)
  for (const t of clubTeams as any[]) {
    if (!t.venue?.name) continue;
    const slug = `venue-${t.venue.id ?? t.slug}`;
    rows.push({
      slug:           slug,
      name:           t.venue.name,
      city:           t.venue.city ?? null,
      country:        t.country ?? null,
      capacity:       t.venue.capacity ?? null,
      photo:          t.venue.image ?? null,
      api_football_id: t.venue.id ?? null,
    });
  }

  // dedupe by slug
  const unique = Array.from(new Map(rows.map((r) => [r.slug, r])).values());
  console.log(`Seeding ${unique.length} venues…`);

  const { error } = await supabase
    .from("venues")
    .upsert(unique, { onConflict: "slug" });

  if (error) { console.error("venues error:", error); process.exit(1); }
  console.log("✅ venues done");
}

main();
