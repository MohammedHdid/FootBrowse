import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Fetch all matches that are currently 'Live'
  const { data } = await supabase
    .from('matches')
    .select('fixture_id, score_home, score_away, elapsed, status')
    .in('status', ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])

  return NextResponse.json(data ?? [])
}
