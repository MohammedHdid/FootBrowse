import { getDb } from './scripts/utils/db.js'
import { loadEnv } from './scripts/utils/env.js'
loadEnv()

async function main() {
  const db = getDb()
  const { count: mCount } = await db.from('matches').select('*', { count: 'exact', head: true })
  const { count: pCount } = await db.from('players').select('*', { count: 'exact', head: true })
  const { count: tCount } = await db.from('teams').select('*', { count: 'exact', head: true })
  const { count: lCount } = await db.from('leagues').select('*', { count: 'exact', head: true })

  console.log('--- DATABASE BREAKDOWN ---')
  console.log('Matches:', mCount)
  console.log('Players:', pCount)
  console.log('Teams:', tCount)
  console.log('Leagues:', lCount)
}
main()
