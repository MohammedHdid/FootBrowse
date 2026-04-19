import { supabase } from '@/lib/supabase'

export interface MatchPrediction {
  fixture_id: number
  fetched_at: string
  advice: string
  winner_id: number | null
  winner_name: string | null
  winner_comment: string | null
  percent: { home: string; draw: string; away: string }
  under_over: string | null
  goals_home: string | null
  goals_away: string | null
  comparison: {
    form:  { home: string; away: string }
    att:   { home: string; away: string }
    def:   { home: string; away: string }
    total: { home: string; away: string }
  } | null
}

export async function getPrediction(fixtureId: number): Promise<MatchPrediction | null> {
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single()

  if (!data) return null

  return {
    fixture_id:      data.fixture_id,
    fetched_at:      data.synced_at ?? new Date().toISOString(),
    advice:          data.advice ?? '',
    winner_id:       data.winner_api_id ?? null,
    winner_name:     data.winner_name ?? null,
    winner_comment:  data.winner_comment ?? null,
    percent:         { home: data.percent_home ?? '0%', draw: data.percent_draw ?? '0%', away: data.percent_away ?? '0%' },
    under_over:      data.under_over ?? null,
    goals_home:      data.goals_home ?? null,
    goals_away:      data.goals_away ?? null,
    comparison:      data.comparison ?? null,
  }
}
