import Image from "next/image";
import type { InjuryRecord } from "@/lib/injuries";

interface Props {
  injuries: InjuryRecord[];
  /** compact = single-column pill list; default = card grid */
  compact?: boolean;
}

const TYPE_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Injured:         { color: "#EF4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)",  label: "INJ" },
  Suspended:       { color: "#EAB308", bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.25)",  label: "SUS" },
  "Missing Fixture": { color: "#A1A1AA", bg: "rgba(161,161,170,0.10)", border: "rgba(161,161,170,0.2)", label: "OUT" },
};

function typeStyle(type: string) {
  return (
    TYPE_STYLE[type] ?? {
      color: "#A1A1AA",
      bg: "rgba(161,161,170,0.10)",
      border: "rgba(161,161,170,0.2)",
      label: type.slice(0, 3).toUpperCase(),
    }
  );
}

export default function InjuryList({ injuries, compact = false }: Props) {
  if (injuries.length === 0) {
    return (
      <p className="text-sm text-zinc-600 italic">No injury or suspension reports.</p>
    );
  }

  // Group by type
  const groups: Record<string, InjuryRecord[]> = {};
  for (const r of injuries) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {injuries.map((r) => {
          const s = typeStyle(r.type);
          return (
            <div
              key={`${r.player_id}-${r.fixture_id}`}
              className="flex items-center gap-2.5 text-sm"
            >
              {r.player_photo ? (
                <Image
                  src={r.player_photo}
                  alt={r.player_name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover shrink-0"
                  style={{ width: 24, height: 24 }}
                  unoptimized
                />
              ) : (
                <div
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 24, height: 24, backgroundColor: s.bg }}
                />
              )}
              <span className="font-semibold text-zinc-200 truncate flex-1">{r.player_name}</span>
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 tabular-nums"
                style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
              >
                {s.label}
              </span>
              {r.reason && (
                <span className="text-[10px] text-zinc-600 truncate shrink-0 hidden sm:block">
                  {r.reason}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full card view — grouped by type
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([type, records]) => {
        const s = typeStyle(type);
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
              >
                {type}
              </span>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                {records.length} player{records.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {records.map((r) => (
                <div
                  key={`${r.player_id}-${r.fixture_id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {r.player_photo ? (
                    <Image
                      src={r.player_photo}
                      alt={r.player_name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0 object-top"
                      style={{ width: 36, height: 36 }}
                      unoptimized
                    />
                  ) : (
                    <div
                      className="shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ width: 36, height: 36, backgroundColor: s.bg, color: s.color }}
                    >
                      {r.player_name.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.player_name}</p>
                    {r.reason && (
                      <p className="text-[11px] text-zinc-500 truncate">{r.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
