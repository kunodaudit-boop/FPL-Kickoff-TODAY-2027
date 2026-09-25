import { NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'
const FPL_LEAGUE_ID = 606037
const LOCKED_THROUGH_GW = 5

const CANONICAL = [
  { name:'Kun', team:'IREN & NEBIUS FC' },
  { name:'Amp', team:'amplongdo' },
  { name:'Ohm', team:"Wasuwit's Team" },
  { name:'Pee', team:'B3RLIN' },
  { name:'Fluk', team:'3ERLIN' },
  { name:'Oat', team:'KaisungVAT' },
  { name:'Arm', team:'Arm' },
  { name:'Deer', team:'ทีมของวิทยา' },
  { name:'Guide', team:"G9inez's Team" },
  { name:'Jimmy', team:'xROTzx' },
  { name:'Best', team:'USO BEST' },
]

function norm(value=''){
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’']/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,'')
}

async function fplFetch(path, revalidate=300){
  const res = await fetch(`${FPL_BASE}${path}`, {
    next:{ revalidate },
    headers:{ 'Accept':'application/json', 'User-Agent':'FPL-Kickoff-Today-2027/1.0' }
  })
  if(!res.ok) throw new Error(`FPL ${path} -> ${res.status}`)
  return res.json()
}

function mapLeagueEntries(results=[]){
  const byTeam = new Map(CANONICAL.map(m=>[norm(m.team),m]))
  const matched=[]
  const unmatched=[]

  for(const row of results){
    const canonical = byTeam.get(norm(row.entry_name))
    if(canonical){
      matched.push({
        ...canonical,
        entryId:row.entry,
        playerName:row.player_name,
        fplTeam:row.entry_name,
        fplTotal:row.total,
        fplRank:row.rank,
        lastRank:row.last_rank,
      })
    }else{
      unmatched.push({entryId:row.entry,team:row.entry_name,playerName:row.player_name})
    }
  }
  return {matched,unmatched}
}

function playerName(element, elementMap){
  const p=elementMap.get(element)
  return p?.web_name || p?.second_name || `Player ${element}`
}

function pct(count,total){
  if(!total) return 0
  return Math.round((count/total)*100)
}

async function getBase(){
  const [standings,bootstrap] = await Promise.all([
    fplFetch(`/leagues-classic/${FPL_LEAGUE_ID}/standings/?page_standings=1`,120),
    fplFetch('/bootstrap-static/',1800),
  ])
  const {matched,unmatched}=mapLeagueEntries(standings?.standings?.results || [])
  const elementMap=new Map((bootstrap?.elements || []).map(p=>[p.id,p]))
  return {standings,bootstrap,matched,unmatched,elementMap}
}

async function buildSummary(){
  const {standings,bootstrap,matched,unmatched}=await getBase()
  const histories = await Promise.all(matched.map(async m=>{
    try{
      const history=await fplFetch(`/entry/${m.entryId}/history/`,300)
      return {m,history}
    }catch{
      return {m,history:{current:[],chips:[]}}
    }
  }))

  const overviewExtras = histories.map(({m,history})=>{
    const current=history.current || []
    const transfers=current.reduce((sum,r)=>sum+(r.event_transfers||0),0)
    const transferCost=current.reduce((sum,r)=>sum+(r.event_transfers_cost||0),0)
    return {
      name:m.name,
      team:m.team,
      entryId:m.entryId,
      transfers,
      transferCost,
      chips:(history.chips||[]).map(c=>({name:c.name,event:c.event})),
      fplTotal:m.fplTotal,
      fplRank:m.fplRank,
    }
  })

  const allEvents = new Set()
  for(const {history} of histories){
    for(const row of history.current || []) allEvents.add(row.event)
  }
  const futureGameweeks={}
  const missingByGw={}
  for(const gw of [...allEvents].sort((a,b)=>a-b)){
    if(gw<=LOCKED_THROUGH_GW) continue
    const rows=[]
    const missing=[]
    for(const {m,history} of histories){
      const row=(history.current||[]).find(x=>x.event===gw)
      if(row) rows.push([m.name,m.team,row.points])
      else missing.push(m.name)
    }
    if(rows.length===CANONICAL.length){
      rows.sort((a,b)=>b[2]-a[2])
      futureGameweeks[gw]=rows
    }else if(rows.length){
      missingByGw[gw]=missing
    }
  }

  const latestHistoryGw=Math.max(0,...histories.flatMap(({history})=>(history.current||[]).map(r=>r.event)))
  const bootstrapCurrent=(bootstrap.events||[]).find(e=>e.is_current)?.id || 0
  const latestFplGw=Math.max(latestHistoryGw,bootstrapCurrent)

  return {
    ok:true,
    leagueId:FPL_LEAGUE_ID,
    leagueName:standings?.league?.name || 'FPL Kickoff Today 2027',
    matchedCount:matched.length,
    unmatched,
    canAutoScore:matched.length===CANONICAL.length,
    futureGameweeks,
    missingByGw,
    latestFplGw,
    overviewExtras,
    generatedAt:new Date().toISOString(),
  }
}

async function buildGameweek(gw){
  const {matched,unmatched,elementMap}=await getBase()
  if(!matched.length){
    return {ok:false,available:false,gw,matchedCount:0,unmatched}
  }

  const [live,picksRows] = await Promise.all([
    fplFetch(`/event/${gw}/live/`, gw>=6?120:86400).catch(()=>({elements:[]})),
    Promise.all(matched.map(async m=>{
      try{
        const picks=await fplFetch(`/entry/${m.entryId}/event/${gw}/picks/`,gw>=6?180:86400)
        return {m,picks}
      }catch{
        return {m,picks:null}
      }
    }))
  ])

  const livePoints=new Map((live.elements||[]).map(x=>[x.id,x.stats?.total_points||0]))
  const owned=new Map()
  const captains=new Map()
  const managerStats=[]

  for(const {m,picks} of picksRows){
    if(!picks?.picks?.length) continue
    for(const pick of picks.picks){
      owned.set(pick.element,(owned.get(pick.element)||0)+1)
      if(pick.is_captain) captains.set(pick.element,(captains.get(pick.element)||0)+1)
    }
    const captain=picks.picks.find(p=>p.is_captain)
    const bench=picks.picks.filter(p=>p.position>11)
    const benchPoints=bench.reduce((sum,p)=>sum+(livePoints.get(p.element)||0),0)
    const captainRaw=captain ? (livePoints.get(captain.element)||0) : 0
    const captainReturn=captain ? captainRaw*(captain.multiplier||1) : 0
    managerStats.push({
      name:m.name,
      team:m.team,
      points:picks.entry_history?.points ?? null,
      captain:captain ? playerName(captain.element,elementMap) : '—',
      captainPoints:captainReturn,
      captainRaw,
      benchPoints,
      transfers:picks.entry_history?.event_transfers || 0,
      transferCost:picks.entry_history?.event_transfers_cost || 0,
      chip:picks.active_chip || null,
    })
  }
  managerStats.sort((a,b)=>(b.points??-999)-(a.points??-999))

  const managerCount=managerStats.length
  const mostOwned=[...owned.entries()]
    .map(([id,count])=>({id,player:playerName(id,elementMap),count,pct:pct(count,managerCount)}))
    .sort((a,b)=>b.count-a.count || a.player.localeCompare(b.player))
    .slice(0,6)
  const captainPopularity=[...captains.entries()]
    .map(([id,count])=>({id,player:playerName(id,elementMap),count,pct:pct(count,managerCount)}))
    .sort((a,b)=>b.count-a.count || a.player.localeCompare(b.player))
    .slice(0,6)
  const differentials=[...owned.entries()]
    .filter(([,count])=>count<=2)
    .map(([id,count])=>({id,player:playerName(id,elementMap),count,points:livePoints.get(id)||0}))
    .sort((a,b)=>b.points-a.points || a.count-b.count)
    .slice(0,8)

  const scores=managerStats.map(r=>r.points).filter(Number.isFinite)
  const average=scores.length?Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10:null

  return {
    ok:true,
    available:managerStats.length>0,
    gw,
    matchedCount:matched.length,
    unmatched,
    managerCount,
    mostOwned,
    captainPopularity,
    differentials,
    managerStats,
    headline:{
      highest:managerStats[0] || null,
      lowest:managerStats.at(-1) || null,
      average,
      chipsUsed:managerStats.filter(r=>r.chip).length,
    },
    generatedAt:new Date().toISOString(),
  }
}

export async function GET(request){
  try{
    const url=new URL(request.url)
    const gwRaw=url.searchParams.get('gw')
    if(gwRaw){
      const gw=Number(gwRaw)
      if(!Number.isInteger(gw)||gw<1||gw>38){
        return NextResponse.json({ok:false,error:'Invalid gameweek'},{status:400})
      }
      return NextResponse.json(await buildGameweek(gw))
    }
    return NextResponse.json(await buildSummary())
  }catch(error){
    return NextResponse.json({
      ok:false,
      error:'FPL data is temporarily unavailable',
      detail:process.env.NODE_ENV==='development'?String(error?.message||error):undefined,
    },{status:200})
  }
}
