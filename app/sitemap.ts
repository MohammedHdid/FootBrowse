import { MetadataRoute } from "next";
import { matches, teams, stadiums, getAllPlayers } from "@/lib/data";
import { getAllLeagues } from "@/lib/leagues";
import { getAllClubTeams } from "@/lib/club-teams";
import { getFixtures } from "@/lib/fixtures";

const BASE_URL = "https://footbrowse.com";
const BUILT_AT = new Date("2026-04-14");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/matches`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/teams`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stadiums`,
      lastModified: BUILT_AT,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/players`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // WC match pages — canonical under /leagues/world-cup/matches/
  const wcMatchRoutes: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${BASE_URL}/leagues/world-cup/matches/${match.slug}`,
    lastModified: new Date(match.date),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Club fixture pages — canonical under /leagues/[slug]/matches/
  const clubMatchRoutes: MetadataRoute.Sitemap = getAllLeagues()
    .filter((l) => l.slug !== "world-cup")
    .flatMap((league) =>
      getFixtures(league).map((f) => ({
        url: `${BASE_URL}/leagues/${league.slug}/matches/${f.slug}`,
        lastModified: new Date(f.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    );

  const teamRoutes: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${BASE_URL}/teams/${team.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const stadiumRoutes: MetadataRoute.Sitemap = stadiums.map((stadium) => ({
    url: `${BASE_URL}/stadiums/${stadium.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const playerRoutes: MetadataRoute.Sitemap = getAllPlayers().map((player) => ({
    url: `${BASE_URL}/players/${player.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "weekly" as const,
    priority: player.primaryLeagueSlug ? 0.65 : 0.7,
  }));

  const leagues = getAllLeagues();

  const leagueIndexRoute: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/leagues`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
  ];

  const leagueRoutes: MetadataRoute.Sitemap = leagues.flatMap((league) => [
    {
      url: `${BASE_URL}/leagues/${league.slug}`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/leagues/${league.slug}/matches`,
      lastModified: BUILT_AT,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/leagues/${league.slug}/standings`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/leagues/${league.slug}/teams`,
      lastModified: BUILT_AT,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/leagues/${league.slug}/players`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ]);

  const clubTeams = getAllClubTeams();
  const clubTeamRoutes: MetadataRoute.Sitemap = clubTeams.map((team) => ({
    url: `${BASE_URL}/leagues/${team.primary_league_slug}/teams/${team.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...leagueIndexRoute,
    ...leagueRoutes,
    ...clubTeamRoutes,
    ...wcMatchRoutes,
    ...clubMatchRoutes,
    ...teamRoutes,
    ...stadiumRoutes,
    ...playerRoutes,
  ];
}
