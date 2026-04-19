export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all matches that are currently 'Live'
  const { data } = await supabase
    .from('matches')
    .select('fixture_id, score_home, score_away, elapsed, status')
    .in('status', ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])

  return NextResponse.json(data ?? [])
}
