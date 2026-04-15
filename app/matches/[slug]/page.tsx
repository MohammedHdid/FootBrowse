/**
 * Legacy redirect — all match pages have moved to /leagues/[slug]/matches/[match-slug].
 * This file keeps all previously-indexed URLs working with a permanent redirect.
 */
import { permanentRedirect, notFound } from "next/navigation";
import { matches } from "@/lib/data";
import { getAllLeagues } from "@/lib/leagues";
import { getFixtures } from "@/lib/fixtures";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  // WC matches
  const wcParams = matches.map((m) => ({ slug: m.slug }));
  // Club fixtures (deduplicated slugs)
  const seen = new Set(wcParams.map((p) => p.slug));
  const clubParams = getAllLeagues()
    .flatMap((league) => getFixtures(league).map((f) => ({ slug: f.slug })))
    .filter((p) => { if (seen.has(p.slug)) return false; seen.add(p.slug); return true; });
  return [...wcParams, ...clubParams];
}

export default function MatchRedirect({ params }: Props) {
  // WC match?
  const wcMatch = matches.find((m) => m.slug === params.slug);
  if (wcMatch) {
    permanentRedirect(`/leagues/world-cup/matches/${params.slug}`);
  }

  // Club fixture?
  for (const league of getAllLeagues()) {
    const fixture = getFixtures(league).find((f) => f.slug === params.slug);
    if (fixture) {
      permanentRedirect(`/leagues/${league.slug}/matches/${params.slug}`);
    }
  }

  notFound();
}
