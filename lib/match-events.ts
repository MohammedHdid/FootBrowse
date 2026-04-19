import { supabase } from '@/lib/supabase'

export interface MatchEventItem {
  minute: number
  extra: number | null
  team_id: number
  player: string
  assist: string | null
  type: 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string
}

export interface MatchStatGroup {
  team_id: number
  possession: number | null
  shots_on: number | null
  shots_total: number | null
  corners: number | null
  fouls: number | null
  yellow_cards: number | null
  red_cards: number | null
  offsides: number | null
  saves: number | null
  xg: number | null
}

export interface MatchEvents {
  fixture_id: number
  fetched_at: string
  status: string
  elapsed: number | null
  score: { home: number | null; away: number | null }
  events: MatchEventItem[]
  home_stats: MatchStatGroup | null
  away_stats: MatchStatGroup | null
}

export async function getMatchEvents(fixtureId: number): Promise<MatchEvents | null> {
  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, elapsed, score_home, score_away,
      home:teams!home_id(api_football_id),
      away:teams!away_id(api_football_id)
    `)
    .eq('fixture_id', fixtureId)
    .single()

  if (!match) return null

  const [eventsRes, statsRes] = await Promise.all([
    supabase
      .from('match_events')
      .select(`
        minute, extra_minute, type, detail, player_name, assist_name,
        team:teams!team_id(api_football_id)
      `)
      .eq('match_id', (match as any).id)
      .order('minute', { ascending: true }),
    supabase
      .from('match_stats')
      .select(`
        possession, shots_on, shots_total, corners, fouls, yellow_cards, red_cards, offsides, saves, xg,
        team:teams!team_id(api_football_id)
      `)
      .eq('match_id', (match as any).id),
  ])

  const homeApiId = (match as any).home?.api_football_id ?? 0
  const awayApiId = (match as any).away?.api_football_id ?? 0
  const statsArr  = statsRes.data ?? []

  const homeStatRow = statsArr.find((s: any) => s.team?.api_football_id === homeApiId)
  const awayStatRow = statsArr.find((s: any) => s.team?.api_football_id === awayApiId)

  function mapStat(r: any, teamId: number): MatchStatGroup | null {
    if (!r) return null
    return {
      team_id:      teamId,
      possession:   r.possession ?? null,
      shots_on:     r.shots_on ?? null,
      shots_total:  r.shots_total ?? null,
      corners:      r.corners ?? null,
      fouls:        r.fouls ?? null,
      yellow_cards: r.yellow_cards ?? null,
      red_cards:    r.red_cards ?? null,
      offsides:     r.offsides ?? null,
      saves:        r.saves ?? null,
      xg:           r.xg ?? null,
    }
  }

  let events: MatchEventItem[] = [];

  if (eventsRes.data?.length) {
    events = eventsRes.data.map((e: any) => ({
      minute:  e.minute ?? 0,
      extra:   e.extra_minute ?? null,
      team_id: e.team?.api_football_id ?? 0,
      player:  e.player_name ?? '',
      assist:  e.assist_name ?? null,
      type:    e.type as any,
      detail:  e.detail ?? '',
    }));
  } else {
    const matchId = (match as any).id;
    if (matchId) {
      const liveRes = await supabase
        .from('live_events')
        .select(`
          minute, extra_minute, type, detail, player_name,
          team:teams!team_id(api_football_id)
        `)
        .eq('match_id', matchId)
        .order('minute', { ascending: true });
      
      if (liveRes.data) {
        events = liveRes.data.map((e: any) => ({
          minute:  e.minute ?? 0,
          extra:   e.extra_minute ?? null,
          team_id: (e.team as any)?.api_football_id ?? 0, 
          player:  e.player_name ?? '',
          assist:  null,
          type:    e.type as any,
          detail:  e.detail ?? '',
        }));
      }
    }
  }

  return {
    fixture_id: fixtureId,
    fetched_at: new Date().toISOString(),
    status:     (match as any).status,
    elapsed:    (match as any).elapsed ?? null,
    score:      { home: (match as any).score_home ?? null, away: (match as any).score_away ?? null },
    events,
    home_stats: mapStat(homeStatRow, homeApiId),
    away_stats: mapStat(awayStatRow, awayApiId),
  }
}
