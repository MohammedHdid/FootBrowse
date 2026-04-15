import fs from 'node:fs'
import path from 'node:path'
import type { SyncedPlayer } from './types'

const filePath = path.join(process.cwd(), 'data', 'club-players.json')

let _clubPlayers: SyncedPlayer[] | null = null

export function getAllClubPlayers(): SyncedPlayer[] {
  if (_clubPlayers) return _clubPlayers
  if (!fs.existsSync(filePath)) return []
  _clubPlayers = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SyncedPlayer[]
  return _clubPlayers
}

export function getClubPlayer(slug: string): SyncedPlayer | undefined {
  return getAllClubPlayers().find((p) => p.slug === slug)
}

/** Returns all players for a club team from club-players.json */
export function getClubTeamPlayers(teamSlug: string): SyncedPlayer[] {
  return getAllClubPlayers().filter((p) => p.teamSlug === teamSlug)
}
