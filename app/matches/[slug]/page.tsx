/**
 * Legacy redirect — all match pages have moved to /leagues/[slug]/matches/[match-slug].
 * This file keeps all previously-indexed URLs working with a permanent redirect.
 */
import { permanentRedirect, notFound } from "next/navigation";
import { matches } from "@/lib/data";
import { getAllLeagues } from "@/lib/leagues";
import { getFixtures } from "@/lib/fixtures";
import { supabase } from "@/lib/supabase";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const wcParams = matches.map((m) => ({ slug: m.slug }));
  const { data } = await supabase
    .from("matches")
    .select("slug");
  const seen = new Set(wcParams.map((p) => p.slug));
  const clubParams = (data ?? [])
    .map((r: any) => ({ slug: r.slug as string }))
    .filter((p) => { if (seen.has(p.slug)) return false; seen.add(p.slug); return true; });
  return [...wcParams, ...clubParams];
}

export default async function MatchRedirect({ params }: Props) {
  const wcMatch = matches.find((m) => m.slug === params.slug);
  if (wcMatch) {
    permanentRedirect(`/leagues/world-cup/matches/${params.slug}`);
  }

  const leagues = await getAllLeagues();
  for (const league of leagues) {
    const fixtures = await getFixtures(league);
    const fixture = fixtures.find((f) => f.slug === params.slug);
    if (fixture) {
      permanentRedirect(`/leagues/${league.slug}/matches/${params.slug}`);
    }
  }

  notFound();
}
