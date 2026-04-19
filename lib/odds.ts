import { supabase } from '@/lib/supabase'

export interface MatchOdds {
  fixture_id: number
  fetched_at: string
  bookmaker_id: number
  bookmaker_name: string
  home_win: number
  draw: number
  away_win: number
}

export async function getMatchOdds(fixtureId: number): Promise<MatchOdds | null> {
  const { data } = await supabase
    .from('odds')
    .select('fixture_id, bookmaker_id, bookmaker_name, home_win, draw, away_win, synced_at')
    .eq('fixture_id', fixtureId)
    .order('bookmaker_id')
    .limit(1)
    .single()

  if (!data) return null

  return {
    fixture_id:     data.fixture_id,
    fetched_at:     data.synced_at ?? new Date().toISOString(),
    bookmaker_id:   data.bookmaker_id,
    bookmaker_name: data.bookmaker_name ?? '',
    home_win:       Number(data.home_win),
    draw:           Number(data.draw),
    away_win:       Number(data.away_win),
  }
}
