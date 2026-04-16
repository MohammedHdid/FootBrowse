"use client";
import Image from "next/image";
import Link from "next/link";
import InjuryList from "@/components/InjuryList";
import type { MatchPageData } from "../../MatchPageClient";

const FORM_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: "rgba(0,255,135,0.12)", color: "#00FF87", border: "rgba(0,255,135,0.3)" },
  D: { bg: "rgba(234,179,8,0.12)",  color: "#EAB308", border: "rgba(234,179,8,0.3)" },
  L: { bg: "rgba(239,68,68,0.12)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

function FormPills({ form, max = 6 }: { form: string; max?: number }) {
  const chars = form.slice(-max).split("").filter((c) => ["W","D","L"].includes(c));
  if (!chars.length) return <span className="text-[10px] text-zinc-700">No data</span>;
  return (
    <div className="flex gap-1">
      {chars.map((r, i) => {
        const s = FORM_STYLE[r];
        return (
          <span key={i} className="w-6 h-6 rounded text-[10px] font-black flex items-center justify-center"
            style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {r}
          </span>
        );
      })}
    </div>
  );
}

const AFFILIATE_URL = "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599";

export default function OverviewTab({ data }: { data: MatchPageData }) {
  // ── Finished / Live ──────────────────────────────────────────────────────────
  if (data.finished || data.live) {
    const goalEvents    = data.events.filter((e) => e.type === "Goal");
    const homeGoals     = goalEvents.filter((e) => e.team_id === data.homeTeamId);
    const awayGoals     = goalEvents.filter((e) => e.team_id !== data.homeTeamId);
    const yellowCards   = data.events.filter((e) => e.type === "Card" && e.detail === "Yellow Card");
    const redCards      = data.events.filter((e) => e.type === "Card" && (e.detail === "Red Card" || e.detail === "Yellow-Red Card"));
    const substitutions = data.events.filter((e) => e.type === "subst");
    const hasSummary    = homeGoals.length > 0 || awayGoals.length > 0 || yellowCards.length > 0 || redCards.length > 0;

    if (!hasSummary) {
      return (
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">No match summary available yet.</p>
        </div>
      );
    }

    const hasCards = yellowCards.length > 0 || redCards.length > 0 || substitutions.length > 0;

    return (
      <section className="section-block">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Match Summary</h2>
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div
            className={`grid grid-cols-2 gap-4 ${hasCards ? "mb-4 pb-4" : ""}`}
            style={hasCards ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}>
            <div className="space-y-2.5">
              {homeGoals.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5">⚽</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200 leading-tight">{e.player}</p>
                    <p className="text-[11px] text-zinc-600 tabular-nums">
                      {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                      {e.assist && <span className="ml-1 text-zinc-500">· {e.assist}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 text-right">
              {awayGoals.map((e, i) => (
                <div key={i} className="flex items-start gap-2 flex-row-reverse">
                  <span className="text-sm leading-none mt-0.5">⚽</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200 leading-tight">{e.player}</p>
                    <p className="text-[11px] text-zinc-600 tabular-nums">
                      {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                      {e.assist && <span className="mr-1 text-zinc-500">{e.assist} ·</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasCards && (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {yellowCards.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="inline-block w-2.5 h-3.5 rounded-[2px]" style={{ backgroundColor: "#EAB308", opacity: 0.85 }} />
                {yellowCards.length} yellow {yellowCards.length === 1 ? "card" : "cards"}
              </span>
            )}
            {redCards.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="inline-block w-2.5 h-3.5 rounded-[2px]" style={{ backgroundColor: "#EF4444", opacity: 0.85 }} />
                {redCards.length} red {redCards.length === 1 ? "card" : "cards"}
              </span>
            )}
            {substitutions.length > 0 && (
              <span className="text-xs text-zinc-500">🔄 {substitutions.length} substitutions</span>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Preview / Upcoming ───────────────────────────────────────────────────────
  const isNatl = data.isWC || data.isNational;

  return (
    <div className="space-y-6">
      {/* WC preview text */}
      {data.wcPreview && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Match Preview</h2>
          <p className="text-zinc-300 leading-relaxed text-sm">{data.wcPreview}</p>
        </section>
      )}

      {/* Form + Team comparison */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="section-block !mb-0">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Recent Form</h2>
          <div className="space-y-4">
            {[
              { name: data.homeName, logo: data.homeLogo, form: data.homeForm },
              { name: data.awayName, logo: data.awayLogo, form: data.awayForm },
            ].map(({ name, logo, form }) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Image src={logo} alt={name} width={20} height={20} unoptimized
                    className="rounded-sm object-cover shrink-0 opacity-90"
                    style={{ width: 20, height: data.isWC ? 14 : 20 }} />
                  <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider truncate">{name}</span>
                </div>
                <FormPills form={form} max={5} />
              </div>
            ))}
          </div>
        </div>

        <div className="section-block !mb-0">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
            {isNatl ? "Team Comparison" : "Season Stats"}
          </h2>
          <div className="space-y-2">
            {isNatl && (data.homeNationalInfo || data.awayNationalInfo) ? (
              <>
                {([
                  (data.homeNationalInfo?.fifaRank != null || data.awayNationalInfo?.fifaRank != null)
                    ? { label: "FIFA Rank",
                        a: data.homeNationalInfo?.fifaRank != null ? `#${data.homeNationalInfo.fifaRank}` : "—",
                        b: data.awayNationalInfo?.fifaRank != null ? `#${data.awayNationalInfo.fifaRank}` : "—" }
                    : null,
                  { label: "Established",
                    a: data.homeNationalInfo?.yearFormed ?? "—",
                    b: data.awayNationalInfo?.yearFormed ?? "—" },
                  { label: "WC Titles",
                    a: data.homeNationalInfo?.wcTitles ?? "—",
                    b: data.awayNationalInfo?.wcTitles ?? "—",
                    ca: Number(data.homeNationalInfo?.wcTitles ?? 0) > 0 ? "#00FF87" : undefined,
                    cb: Number(data.awayNationalInfo?.wcTitles ?? 0) > 0 ? "#00FF87" : undefined },
                ].filter(Boolean) as Array<{ label: string; a: string | number; b: string | number; ca?: string; cb?: string }>)
                  .map(({ label, a, b, ca, cb }) => (
                    <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-zinc-500">{label}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold" style={{ color: ca ?? "#fff" }}>{a}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="font-bold" style={{ color: cb ?? "#fff" }}>{b}</span>
                      </div>
                    </div>
                  ))}
              </>
            ) : data.homeTeamRecord && data.awayTeamRecord ? (
              <>
                {[
                  { label: "Goals For",     a: data.homeTeamRecord.goals_for,     b: data.awayTeamRecord.goals_for },
                  { label: "Goals Against", a: data.homeTeamRecord.goals_against, b: data.awayTeamRecord.goals_against },
                  { label: "Clean Sheets",  a: data.homeTeamRecord.clean_sheets,  b: data.awayTeamRecord.clean_sheets },
                  { label: "Played",        a: data.homeTeamRecord.played,        b: data.awayTeamRecord.played },
                ].map(({ label, a, b }) => (
                  <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-zinc-500">{label}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white">{a}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="font-bold text-white">{b}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-zinc-600 italic">Stats not yet available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Where to Watch */}
      {data.tvChannels.length > 0 && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Where to Watch</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.tvChannels.map((entry) => (
              <div key={entry.country} className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "#3b82f6" }}>
                    {entry.country}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {entry.channels.map((ch) => (
                    <li key={ch} className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="w-px h-3 bg-zinc-700 shrink-0" />{ch}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Availability */}
      {(data.homeInjuries.length > 0 || data.awayInjuries.length > 0) && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Availability</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { name: data.homeName, logo: data.homeLogo, injuries: data.homeInjuries },
              { name: data.awayName, logo: data.awayLogo, injuries: data.awayInjuries },
            ].map(({ name, logo, injuries }) => (
              <div key={name}>
                <div className="flex items-center gap-2 mb-3">
                  <Image src={logo} alt={name} width={16} height={16} className="object-contain" unoptimized />
                  <span className="text-xs font-bold text-zinc-400 truncate">{name}</span>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <InjuryList injuries={injuries as any} compact />
                {injuries.length === 0 && <p className="text-xs text-zinc-600 italic">No reports</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Venue — WC stadium */}
      {data.stadiumInfo && (
        <section className="section-block !p-0 overflow-hidden">
          {data.stadiumInfo.photo_url && (
            <div className="w-full h-40 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.stadiumInfo.photo_url} alt={data.stadiumInfo.name}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 60%)" }} />
              {data.stadiumInfo.is_final_venue && (
                <span className="badge-green absolute top-3 left-4">Final Venue</span>
              )}
              <h2 className="section-title text-xl absolute bottom-3 left-4">Venue</h2>
            </div>
          )}
          <div className="p-4">
            <Link href={`/stadiums/${data.stadiumInfo.slug}`} className="group flex items-start justify-between">
              <div>
                <p className="font-black text-white group-hover:opacity-70" style={{ letterSpacing: "-0.02em" }}>
                  {data.stadiumInfo.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">{data.stadiumInfo.city}, {data.stadiumInfo.state}</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Cap. {data.stadiumInfo.capacity.toLocaleString()} · {data.stadiumInfo.surface} · {data.stadiumInfo.roof} roof
                </p>
              </div>
              <span className="arrow-link shrink-0 ml-4">Stadium guide →</span>
            </Link>
          </div>
        </section>
      )}

      {/* Venue — Club */}
      {!data.stadiumInfo && data.venueName && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Venue</h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              🏟️
            </div>
            <div>
              <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{data.venueName}</p>
              {data.venueCity && <p className="text-sm text-zinc-400 mt-0.5">{data.venueCity}</p>}
              {data.venueCapacity && (
                <p className="text-sm text-zinc-500 mt-0.5">Capacity: {data.venueCapacity.toLocaleString()}</p>
              )}
              {data.homeClubFounded && (
                <p className="text-xs text-zinc-600 mt-2">{data.homeName} — Est. {data.homeClubFounded}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Travel & Tickets */}
      {(data.travel || data.venueCity || data.city) && (() => {
        const city = data.city ?? data.venueCity;
        if (!city && !data.travel) return null;
        const hotelUrl = data.travel?.hotel_affiliate_url
          ?? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city!)}`;
        const flightUrl = data.travel?.flight_affiliate_url
          ?? `https://www.skyscanner.com/flights-to/${encodeURIComponent(city!.toLowerCase().replace(/\s/g, "-"))}`;
        return (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">Travel &amp; Tickets</h2>
            {data.travel?.nearest_airport ? (
              <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>✈️</span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">Nearest airport</p>
                  <p className="text-sm font-bold text-white">{data.travel.nearest_airport}</p>
                </div>
              </div>
            ) : city ? (
              <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>📍</span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">Match City</p>
                  <p className="text-sm font-bold text-white">{city}</p>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-3">
              <a href={hotelUrl} target="_blank" rel="noopener noreferrer nofollow"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 text-sm font-bold hover:opacity-85"
                style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}>
                <span className="text-xl">🏨</span><span>Book Hotel</span>
              </a>
              <a href={flightUrl} target="_blank" rel="noopener noreferrer nofollow"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                <span className="text-xl">✈️</span><span>Find Flights</span>
              </a>
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                <span className="text-xl">🎟️</span><span>Get Tickets</span>
              </a>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
