/**
 * Deterministic slug generator for leagues, teams, and other named entities.
 *
 * Rules:
 * - Lowercase
 * - Accents/diacritics stripped (é → e, ü → u, etc.)
 * - Non-alphanumeric characters replaced with hyphens
 * - Consecutive hyphens collapsed to one
 * - Leading/trailing hyphens trimmed
 *
 * Examples:
 *   "Premier League"        → "premier-league"
 *   "La Liga"               → "la-liga"
 *   "UEFA Champions League" → "uefa-champions-league"
 *   "Ligue 1"               → "ligue-1"
 *   "Borussia Dortmund"     → "borussia-dortmund"
 */
export function generateSlug(name: string): string {
  return name
    .normalize('NFD')                      // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')       // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')          // non-alphanumeric → hyphen
    .replace(/-{2,}/g, '-')               // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')             // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// CLI self-test
// ---------------------------------------------------------------------------

if (require.main === module) {
  const cases: Array<[string, string]> = [
    ['Premier League', 'premier-league'],
    ['La Liga', 'la-liga'],
    ['UEFA Champions League', 'uefa-champions-league'],
    ['Ligue 1', 'ligue-1'],
    ['Borussia Dortmund', 'borussia-dortmund'],
    ['São Paulo FC', 'sao-paulo-fc'],
    ['FC Bayern München', 'fc-bayern-munchen'],
    ['  Extra  Spaces  ', 'extra-spaces'],
  ]

  let passed = 0
  for (const [input, expected] of cases) {
    const result = generateSlug(input)
    const ok = result === expected
    console.log(`${ok ? '✓' : '✗'} "${input}" → "${result}"${ok ? '' : ` (expected "${expected}")`}`)
    if (ok) passed++
  }
  console.log(`\n${passed}/${cases.length} tests passed`)
  if (passed < cases.length) process.exit(1)
}
