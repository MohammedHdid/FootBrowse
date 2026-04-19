export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10);

  // Fetch all matches for today to ensure smooth transitions (Live -> FT)
  const { data } = await supabase
    .from('matches')
    .select('fixture_id, score_home, score_away, elapsed, status')
    .eq('date', today);

  return new NextResponse(JSON.stringify(data ?? []), {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      'Content-Type': 'application/json',
    }
  });
}
