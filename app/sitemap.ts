import { MetadataRoute } from "next";
import { matches, teams, stadiums, players } from "@/lib/data";

const BASE_URL = "https://footbrowse.com";
const BUILT_AT = new Date("2026-04-13");

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

  const matchRoutes: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${BASE_URL}/matches/${match.slug}`,
    lastModified: new Date(match.date),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

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

  const playerRoutes: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${BASE_URL}/players/${player.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...matchRoutes,
    ...teamRoutes,
    ...stadiumRoutes,
    ...playerRoutes,
  ];
}
