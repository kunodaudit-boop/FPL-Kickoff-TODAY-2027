import { NextResponse } from 'next/server'
import { members } from '../../league-data'

export const revalidate = 300

const LEAGUE_ID = 606037
const FPL_BASE = 'https://fantasy.premierleague.com/api'
const LOCKED_THROUGH_GW = 5

function normalizeTeam(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9ก-๙]+/gi, '')
}

async function fetchFpl(path, revalidateSeconds = 300) {
  const response = await fetch(`${FPL_BASE}${path}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'FPL-Kickoff-Today-2027/2.0',
    },
    next: { revalidate: revalidateSeconds },
  })

  if (!response.ok) {
    throw new Error(`FPL ${response.status} for ${path}`)
  }
  return response.json()
}

async function safeFetch(path, revalidateSeconds = 300) {
  try {
    return await fetchFpl(path, revalidateSeconds)
  } catch {
    return null
  }
}

async function getLeagueStandings() {
  let page = 1
  let league = null
  const results = []

  while (page <= 5) {
    const data = await fetchFpl(`/leagues-classic/${LEAGUE_ID}/standings/?page_standings=${page}`, 300)
    if (!league) league = data.league || null
    results.push(...(data.standings?.results || []))
    if (!data.standings?.has_next) break
    page += 1
  }

  return { league, results }
}

function buildFutureGameweeks(historyRows, canAutoScore) {
  if (!canAutoScore) return {}

  const memberIndex = new Map(members.map(([name], index) => [name, index]))
  const byGw = new Map()

  for (const manager of historyRows) {
    for (const row of manager.history?.current || []) {
      if (row.event <= LOCKED_THROUGH_GW) continue
      if (!byGw.has(row.event)) byGw.set(row.event, [])
      byGw.get(row.event).push([
        manager.name,
        manager.team,
        Number(row.points || 0),
        Number(row.rank || 0),
      ])
    }
  }

  const output = {}
  for (const [gw, rows] of byGw.entries()) {
    if (rows.length !== members.length) continue
    rows.sort((a, b) => b[2] - a[2] || a[3] - b[3] || (memberIndex.get(a[0]) ?? 99) - (memberIndex.get(b[0]) ?? 99))
    output[gw] = rows.map(([name, team, points]) => [name, team, points])
  }
  return output
}

function topCounts(countMap, elementMap, livePoints, managerCount, limit = 8) {
  return [...countMap.entries()]
    .map(([id, count]) => {
      const element = elementMap.get(Number(id))
      return {
        id: Number(id),
        player: element?.web_name || `Player ${id}`,
        count,
        pct: managerCount ? Math.round((count / managerCount) * 100) : 0,
        points: livePoints.get(Number(id)) || 0,
      }
    })
    .sort((a, b) => b.count - a.count || b.points - a.points || a.player.localeCompare(b.player))
    .slice(0, limit)
}

async function buildStatistics({ matched, bootstrap, historyRows }) {
  const events = bootstrap.events || []
  const currentEvent = events.find((event) => event.is_current)
  const finishedEvents = events.filter((event) => event.finished || event.data_checked)
  const lastHistoryEvent = Math.max(
    0,
    ...historyRows.flatMap((manager) => (manager.history?.current || []).map((row) => Number(row.event || 0)))
  )
  const statGw = currentEvent?.id || finishedEvents.at(-1)?.id || lastHistoryEvent

  if (!statGw || matched.length === 0) {
    return { gw: statGw || null, available: false, managerStats: [], mostOwned: [], captainPopularity: [], differentials: [] }
  }

  const [live, ...picksPayloads] = await Promise.all([
    safeFetch(`/event/${statGw}/live/`, 120),
    ...matched.map((manager) => safeFetch(`/entry/${manager.entry}/event/${statGw}/picks/`, 180)),
  ])

  const elementMap = new Map((bootstrap.elements || []).map((element) => [element.id, element]))
  const livePoints = new Map((live?.elements || []).map((element) => [element.id, Number(element.stats?.total_points || 0)]))
  const ownership = new Map()
  const captains = new Map()
  const managerStats = []

  matched.forEach((manager, index) => {
    const payload = picksPayloads[index]
    if (!payload?.picks) return

    payload.picks.forEach((pick) => ownership.set(pick.element, (ownership.get(pick.element) || 0) + 1))
    const captainPick = payload.picks.find((pick) => pick.is_captain)
    const vicePick = payload.picks.find((pick) => pick.is_vice_captain)
    if (captainPick) captains.set(captainPick.element, (captains.get(captainPick.element) || 0) + 1)

    const captain = captainPick ? elementMap.get(captainPick.element) : null
    const vice = vicePick ? elementMap.get(vicePick.element) : null
    const captainBasePoints = captainPick ? (livePoints.get(captainPick.element) || 0) : 0
    const captainMultiplier = Number(captainPick?.multiplier || 0)

    managerStats.push({
      name: manager.name,
      team: manager.team,
      entry: manager.entry,
      points: Number(payload.entry_history?.points || 0),
      captain: captain?.web_name || '—',
      vice: vice?.web_name || '—',
      captainPoints: captainBasePoints * captainMultiplier,
      benchPoints: Number(payload.entry_history?.points_on_bench || 0),
      transfers: Number(payload.entry_history?.event_transfers || 0),
      transferCost: Number(payload.entry_history?.event_transfers_cost || 0),
      chip: payload.active_chip || null,
    })
  })

  const managerCount = managerStats.length
  const differentials = [...ownership.entries()]
    .map(([id, count]) => ({
      id: Number(id),
      player: elementMap.get(Number(id))?.web_name || `Player ${id}`,
      count,
      pct: managerCount ? Math.round((count / managerCount) * 100) : 0,
      points: livePoints.get(Number(id)) || 0,
    }))
    .filter((item) => item.count <= 2)
    .sort((a, b) => b.points - a.points || a.count - b.count)
    .slice(0, 6)

  return {
    gw: statGw,
    available: managerStats.length > 0,
    managerCount,
    managerStats: managerStats.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    mostOwned: topCounts(ownership, elementMap, livePoints, managerCount, 6),
    captainPopularity: topCounts(captains, elementMap, livePoints, managerCount, 6),
    differentials,
  }
}

export async function GET() {
  try {
    const [{ league, results: standings }, bootstrap] = await Promise.all([
      getLeagueStandings(),
      fetchFpl('/bootstrap-static/', 900),
    ])

    const fixedByTeam = new Map(
      members.map(([name, team]) => [normalizeTeam(team), { name, team }])
    )

    const matched = standings
      .map((row) => {
        const fixed = fixedByTeam.get(normalizeTeam(row.entry_name))
        if (!fixed) return null
        return {
          ...fixed,
          entry: Number(row.entry),
          fplTeam: row.entry_name,
          playerName: row.player_name,
          fplRank: Number(row.rank || 0),
          fplTotal: Number(row.total || 0),
          fplEventTotal: Number(row.event_total || 0),
        }
      })
      .filter(Boolean)

    const unmatched = standings
      .filter((row) => !fixedByTeam.has(normalizeTeam(row.entry_name)))
      .map((row) => ({ entry: row.entry, team: row.entry_name, playerName: row.player_name }))

    const historyRows = await Promise.all(
      matched.map(async (manager) => ({
        ...manager,
        history: await safeFetch(`/entry/${manager.entry}/history/`, 300),
      }))
    )

    const canAutoScore = matched.length === members.length && historyRows.every((manager) => manager.history)
    const futureGameweeks = buildFutureGameweeks(historyRows, canAutoScore)
    const stats = await buildStatistics({ matched, bootstrap, historyRows })

    return NextResponse.json({
      ok: true,
      leagueId: LEAGUE_ID,
      leagueName: league?.name || 'FPL Kickoff Today 2027',
      lockedThroughGw: LOCKED_THROUGH_GW,
      matchedCount: matched.length,
      expectedCount: members.length,
      canAutoScore,
      unmatched,
      futureGameweeks,
      stats,
      generatedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      leagueId: LEAGUE_ID,
      lockedThroughGw: LOCKED_THROUGH_GW,
      error: error instanceof Error ? error.message : 'Unable to reach FPL data',
      generatedAt: new Date().toISOString(),
    }, { status: 200 })
  }
}
