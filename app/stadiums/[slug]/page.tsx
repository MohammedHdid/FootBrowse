import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { stadiums, getStadium, getStadiumMatches } from "@/lib/data";
import StadiumHeroImage from "./StadiumHeroImage";

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
  };
}

export default function StadiumPage({ params }: Props) {
  const stadium = getStadium(params.slug);
  if (!stadium) notFound();

  const stadiumMatches = getStadiumMatches(stadium.slug);

  return (
    <article className="space-y-8">

      {/* Full-width photo hero with overlay */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 240 }}>
        {stadium.photo_url ? (
          <>
            <StadiumHeroImage src={stadium.photo_url} alt={stadium.name} />
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
              {stadium.photo_credit && (
                <p className="text-xs text-zinc-600 mt-2">Photo: {stadium.photo_credit}</p>
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

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

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

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Hosted Matches */}
      {stadiumMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">
            World Cup 2026 Fixtures at This Venue
          </h2>
          <div className="space-y-3">
            {stadiumMatches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="match-card flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1">
                    {match.stage} · Group {match.group}
                  </p>
                  <p
                    className="font-black text-white"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {match.team_a.name} vs {match.team_b.name}
                  </p>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {match.kickoff_utc} UTC · {match.kickoff_est} EST
                  </p>
                </div>
                <span className="arrow-link shrink-0 ml-4">Preview →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
