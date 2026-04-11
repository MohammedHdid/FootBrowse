import { MetadataRoute } from "next";
import { matches, teams, stadiums, players } from "@/lib/data";

const BASE_URL = "https://footbrowse.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/matches`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/teams`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stadiums`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/players`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const matchRoutes: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${BASE_URL}/matches/${match.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const teamRoutes: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${BASE_URL}/teams/${team.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const stadiumRoutes: MetadataRoute.Sitemap = stadiums.map((stadium) => ({
    url: `${BASE_URL}/stadiums/${stadium.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const playerRoutes: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${BASE_URL}/players/${player.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...matchRoutes,
    ...teamRoutes,
    ...stadiumRoutes,
    ...playerRoutes,
  ];
}
