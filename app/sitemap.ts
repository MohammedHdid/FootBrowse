import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://footbrowse.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch all data from Supabase in parallel
  const [
    { data: leagues },
    { data: teams },
    { data: players },
    { data: matches }
  ] = await Promise.all([
    supabase.from("leagues").select("slug, updated_at"),
    supabase.from("teams").select("slug, updated_at, leagues!league_id(slug)"),
    supabase.from("players").select("slug, updated_at"),
    supabase.from("matches").select("slug, date, leagues!league_id(slug)")
  ]);

  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,             lastModified: now, changeFrequency: "daily",   priority: 1 },
    { url: `${BASE_URL}/leagues`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/players`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
  ];

  // League routes
  const leagueRoutes: MetadataRoute.Sitemap = (leagues ?? []).flatMap((l) => [
    { url: `${BASE_URL}/leagues/${l.slug}`,            lastModified: l.updated_at, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE_URL}/leagues/${l.slug}/standings`,  lastModified: l.updated_at, changeFrequency: "daily",  priority: 0.8 },
    { url: `${BASE_URL}/leagues/${l.slug}/matches`,    lastModified: l.updated_at, changeFrequency: "always", priority: 0.8 },
  ]);

  // Team routes
  const teamRoutes: MetadataRoute.Sitemap = (teams ?? []).map((t) => ({
    url: `${BASE_URL}/leagues/${(t.leagues as any)?.slug || 'misc'}/teams/${t.slug}`,
    lastModified: t.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Match routes
  const matchRoutes: MetadataRoute.Sitemap = (matches ?? []).map((m) => ({
    url: `${BASE_URL}/leagues/${(m.leagues as any)?.slug || 'misc'}/matches/${m.slug}`,
    lastModified: new Date(m.date),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  // Player routes
  const playerRoutes: MetadataRoute.Sitemap = (players ?? []).map((p) => ({
    url: `${BASE_URL}/players/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...leagueRoutes,
    ...teamRoutes,
    ...matchRoutes,
    ...playerRoutes,
  ];
}
