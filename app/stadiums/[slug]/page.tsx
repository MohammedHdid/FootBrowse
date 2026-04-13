import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { stadiums, getStadium, getStadiumMatches } from "@/lib/data";
import StadiumHeroImage from "./StadiumHeroImage";
import AdSlot from "@/components/AdSlot";
import MatchFlagImg from "@/components/MatchFlagImg";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return stadiums.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const stadium = getStadium(params.slug);
  if (!stadium) return {};
  return {
    title: stadium.meta_title,
    description: stadium.meta_description,
    alternates: { canonical: `https://footbrowse.com/stadiums/${params.slug}` },
  };
}

export default function StadiumPage({ params }: Props) {
  const stadium = getStadium(params.slug);
  if (!stadium) notFound();

  const stadiumMatches = getStadiumMatches(stadium.slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://footbrowse.com" },
      { "@type": "ListItem", "position": 2, "name": "Stadiums", "item": "https://footbrowse.com/stadiums" },
      { "@type": "ListItem", "position": 3, "name": stadium.name, "item": `https://footbrowse.com/stadiums/${stadium.slug}` }
    ]
  };

  // Prefer TheSportsDB photos (no rate limiting), fallback to Wikipedia
  const heroPhotoUrl = (stadium.sportsdb_photos && stadium.sportsdb_photos.length > 0)
    ? stadium.sportsdb_photos[0]
    : stadium.photo_url;
  const heroPhotoCredit = (stadium.sportsdb_photos && stadium.sportsdb_photos.length > 0)
    ? "TheSportsDB"
    : stadium.photo_credit;

  const stadiumJsonLd = {
    "@context": "https://schema.org",
    "@type": "StadiumOrArena",
    "name": stadium.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": stadium.city,
      "addressRegion": stadium.state,
      "addressCountry": stadium.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": stadium.lat,
      "longitude": stadium.lng
    },
    "maximumAttendeeCapacity": stadium.capacity,
    "image": heroPhotoUrl,
    "description": stadium.overview
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stadiumJsonLd) }}
      />
      <article className="space-y-8">

      {/* Full-width photo hero with overlay */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 240 }}>
        {heroPhotoUrl ? (
          <>
            <StadiumHeroImage src={heroPhotoUrl} alt={stadium.name} />
            {/* Dark gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.1) 100%)",
              }}
            />
            {/* Content over image */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge-blue">{stadium.city}, {stadium.state}</span>
                {stadium.is_final_venue && (
                  <span className="badge-green">2026 Final Venue</span>
                )}
              </div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white"
                style={{ letterSpacing: "-0.04em" }}
              >
                {stadium.name}
              </h1>
              {heroPhotoCredit && (
                <p className="text-xs text-zinc-600 mt-2">Photo: {heroPhotoCredit}</p>
              )}
            </div>
          </>
        ) : (
          /* Fallback header if no photo */
          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-blue">{stadium.city}, {stadium.state}</span>
              {stadium.is_final_venue && (
                <span className="badge-green">2026 Final Venue</span>
              )}
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              {stadium.name}
            </h1>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/stadiums">Stadiums</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{stadium.name}</span>
      </nav>

      <AdSlot slot="1234567890" format="auto" />

      {/* Venue Stats */}
      <section>
        <h2 className="section-title text-xl mb-4">Venue Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">Capacity</p>
            <p className="stat-value">{stadium.capacity.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Surface</p>
            <p className="stat-value text-base">{stadium.surface}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Roof</p>
            <p className="stat-value text-base">{stadium.roof}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Opened</p>
            <p className="stat-value">{stadium.opened}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="stat-label">WC 2026 Matches</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {stadium.wc_matches}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Final Venue</p>
            <p
              className="stat-value text-base"
              style={{ color: stadium.is_final_venue ? "#00FF87" : "inherit" }}
            >
              {stadium.is_final_venue ? "Yes" : "No"}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Parking</p>
            <p className="stat-value text-base">
              {stadium.parking_available ? "Available" : "Limited"}
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Venue Overview</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{stadium.overview}</p>
      </section>

      {/* Transport & Access */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Getting There</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <dt className="stat-label">Nearest Airport</dt>
            <dd className="text-sm font-bold text-white mt-1">{stadium.nearest_airport}</dd>
            <dd className="text-xs text-zinc-500 mt-0.5">
              {stadium.airport_distance_km} km from venue
            </dd>
          </div>
          <div>
            <dt className="stat-label">Nearest City</dt>
            <dd className="text-sm font-bold text-white mt-1">{stadium.nearest_city}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="stat-label">Public Transport</dt>
            <dd className="text-sm text-zinc-300 mt-1 leading-relaxed">
              {stadium.transport}
            </dd>
          </div>
        </dl>
      </section>

      {/* Map coordinates */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Location</h2>
        <div
          className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{
            backgroundColor: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <div className="flex-1">
            <p className="text-sm text-zinc-400 mb-1">{stadium.name}</p>
            <p className="text-sm font-mono text-zinc-300">
              {stadium.city}, {stadium.state}, {stadium.country}
            </p>
            <p className="text-xs text-zinc-600 mt-2 font-mono">
              {stadium.lat}°N, {Math.abs(stadium.lng)}°W
            </p>
          </div>
          <a
            href={`https://www.google.com/maps?q=${stadium.lat},${stadium.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80 shrink-0"
            style={{
              backgroundColor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#3B82F6",
            }}
          >
            Open in Google Maps →
          </a>
        </div>
      </section>

      {/* Travel CTAs */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Book Travel</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Fly into {stadium.nearest_airport} — {stadium.airport_distance_km} km from the venue.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={stadium.hotel_affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
          >
            🏨 Find hotels near {stadium.name}
          </a>
          <a
            href={stadium.flight_affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            ✈️ Find flights to {stadium.nearest_city}
          </a>
        </div>
      </section>

      <AdSlot slot="1234567890" format="auto" />

      {/* Hosted Matches */}
      {stadiumMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">World Cup 2026 Fixtures at This Venue</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {stadiumMatches.map((match) => {
              const city = match.city.split(",")[0].trim();
              return (
                <Link
                  key={match.slug}
                  href={`/matches/${match.slug}`}
                  className="flex items-center gap-2 sm:gap-3 px-3 py-3 transition-colors hover:bg-white/[0.03] group"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {/* Team A */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="font-bold text-white text-xs sm:text-sm truncate text-right" style={{ letterSpacing: "-0.01em" }}>
                      {match.team_a.name}
                    </span>
                    <MatchFlagImg src={match.team_a.flag_url} alt={match.team_a.name} />
                  </div>

                  {/* Centre */}
                  <div className="flex flex-col items-center shrink-0 w-20 sm:w-28">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                      {new Date(match.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 tabular-nums">{match.kickoff_utc} UTC</span>
                    <span className="text-[10px] font-black mt-1" style={{ color: "#00FF87", letterSpacing: "0.05em" }}>VS</span>
                    <span className="text-[9px] text-zinc-400 mt-0.5 text-center truncate max-w-full">{city}</span>
                  </div>

                  {/* Team B */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <MatchFlagImg src={match.team_b.flag_url} alt={match.team_b.name} />
                    <span className="font-bold text-white text-xs sm:text-sm truncate" style={{ letterSpacing: "-0.01em" }}>
                      {match.team_b.name}
                    </span>
                  </div>

                  {/* Odds + arrow (desktop) */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0 ml-2">
                    {match.odds && match.odds.length > 0 && (
                      <div className="flex gap-2 text-[10px] font-bold tabular-nums">
                        <span style={{ color: "#00FF87" }}>{match.odds[0].team_a_win.toFixed(2)}</span>
                        <span className="text-zinc-500">{match.odds[0].draw.toFixed(2)}</span>
                        <span className="text-blue-400">{match.odds[0].team_b_win.toFixed(2)}</span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
                  </div>

                  {/* Mobile arrow */}
                  <span className="sm:hidden text-[10px] font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <AdSlot slot="1234567890" format="auto" />
    </article>
    </>
  );
}
