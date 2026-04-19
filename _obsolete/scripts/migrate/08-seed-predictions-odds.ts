import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";

async function main() {
  const { data: matches } = await supabase.from("matches").select("id, fixture_id");
  const matchByFixtureId = new Map(matches!.filter((m: any) => m.fixture_id).map((m: any) => [m.fixture_id, m.id]));

  // Predictions
  const predDir = path.join(process.cwd(), "data", "predictions");
  const predFiles = fs.existsSync(predDir)
    ? fs.readdirSync(predDir).filter((f) => f.endsWith(".json"))
    : [];

  let predTotal = 0;
  const predRows: any[] = [];
  for (const file of predFiles) {
    const p: any = JSON.parse(fs.readFileSync(path.join(predDir, file), "utf-8"));
    const matchId = matchByFixtureId.get(p.fixture_id) ?? null;
    predRows.push({
      match_id:      matchId,
      fixture_id:    p.fixture_id,
      advice:        p.advice ?? null,
      winner_api_id: p.winner_id ?? null,
      winner_name:   p.winner_name ?? null,
      winner_comment: p.winner_comment ?? null,
      percent_home:  p.percent?.home ?? null,
      percent_draw:  p.percent?.draw ?? null,
      percent_away:  p.percent?.away ?? null,
      under_over:    p.under_over ?? null,
      goals_home:    p.goals_home ?? null,
      goals_away:    p.goals_away ?? null,
      comparison:    p.comparison ?? null,
      synced_at:     p.fetched_at ?? null,
      valid_until:   p.fetched_at
        ? new Date(new Date(p.fetched_at).getTime() + 48 * 3600_000).toISOString()
        : null,
    });
  }

  if (predRows.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < predRows.length; i += CHUNK) {
      const { error } = await supabase
        .from("predictions")
        .upsert(predRows.slice(i, i + CHUNK), { onConflict: "fixture_id" });
      if (error) console.warn(`predictions chunk ${i}:`, error.message);
    }
    predTotal = predRows.length;
  }
  console.log(`✅ predictions done — ${predTotal}`);

  // Odds
  const oddsDir = path.join(process.cwd(), "data", "odds");
  const oddsFiles = fs.existsSync(oddsDir)
    ? fs.readdirSync(oddsDir).filter((f) => f.endsWith(".json"))
    : [];

  let oddsTotal = 0;
  const oddsRows: any[] = [];
  for (const file of oddsFiles) {
    const o: any = JSON.parse(fs.readFileSync(path.join(oddsDir, file), "utf-8"));
    const matchId = matchByFixtureId.get(o.fixture_id) ?? null;
    oddsRows.push({
      match_id:      matchId,
      fixture_id:    o.fixture_id,
      bookmaker_id:  o.bookmaker_id ?? null,
      bookmaker_name: o.bookmaker_name ?? null,
      home_win:      o.home_win ?? null,
      draw:          o.draw ?? null,
      away_win:      o.away_win ?? null,
      synced_at:     o.fetched_at ?? null,
      valid_until:   o.fetched_at
        ? new Date(new Date(o.fetched_at).getTime() + 24 * 3600_000).toISOString()
        : null,
    });
  }

  if (oddsRows.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < oddsRows.length; i += CHUNK) {
      const { error } = await supabase
        .from("odds")
        .upsert(oddsRows.slice(i, i + CHUNK), { onConflict: "fixture_id" });
      if (error) console.warn(`odds chunk ${i}:`, error.message);
    }
    oddsTotal = oddsRows.length;
  }
  console.log(`✅ odds done — ${oddsTotal}`);
}

main();
