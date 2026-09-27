'use client'

import { useEffect, useMemo, useState } from 'react'
import { financial, financialThroughGw, gameweeks as lockedGameweeks, members, miniGameSaves } from './league-data'
import { competitions, gallery, miniWinners, luckyConditions } from './content-data'

const LOCKED_THROUGH_GW = 5
const FPL_LEAGUE_ID = 606037
const payout = [120,60,30,0,-30,-30,-30,-30,-30,-30,-30]
const memberOrder = members.map(([name])=>name)
const memberTeam = Object.fromEntries(members)
const galleryGws = Object.keys(gallery).map(Number).sort((a,b)=>a-b)
const totalGallery = Object.values(gallery).reduce((sum,items)=>sum+items.length,0)
const topFinancial = [...financial].sort((a,b)=>b.cash-a.cash)

function mergeGameweeks(futureGameweeks){
  const merged={...lockedGameweeks}
  Object.entries(futureGameweeks||{}).forEach(([gw,rows])=>{
    const n=Number(gw)
    if(n>LOCKED_THROUGH_GW && Array.isArray(rows) && rows.length===members.length) merged[n]=rows
  })
  return merged
}

function deriveLeague(gameweeks){
  const gwNumbers=Object.keys(gameweeks).map(Number).sort((a,b)=>a-b)
  const latestGw=gwNumbers.at(-1)
  const cumulative=memberOrder.map(name=>({
    name,team:memberTeam[name],
    pts:gwNumbers.reduce((sum,gw)=>sum+(gameweeks[gw]?.find(r=>r[0]===name)?.[2]||0),0)
  })).sort((a,b)=>b.pts-a.pts)
  const weeklyWinners=gwNumbers.map(gw=>({gw,name:gameweeks[gw][0][0],pts:gameweeks[gw][0][2]}))
  const winCounts=weeklyWinners.reduce((acc,w)=>{acc[w.name]=(acc[w.name]||0)+1;return acc},{})
  const phaseRows=(gws)=>memberOrder.map(name=>({
    name,team:memberTeam[name],
    pts:gws.reduce((sum,gw)=>sum+(gameweeks[gw]?.find(r=>r[0]===name)?.[2]||0),0)
  })).sort((a,b)=>b.pts-a.pts)
  return {
    gwNumbers,latestGw,cumulative,weeklyWinners,winCounts,
    latestWinner:weeklyWinners.at(-1),seasonLeader:cumulative[0],
    firstChanceRows:phaseRows(gwNumbers.filter(g=>g<=19)),
    secondChanceRows:phaseRows(gwNumbers.filter(g=>g>=20)),
    secondChanceStarted:gwNumbers.some(g=>g>=20),
  }
}

function Money({value}){
  const cls=value>0?'money pos':value<0?'money neg':'money zero'
  return <span className={cls}>{value>0?'+':''}{value}</span>
}

function MiniTable({rows,limit=4,title='Overall'}){
  return <div className="miniTable v3Table">
    <div className="miniTableHead"><span>{title}</span><span>PTS</span></div>
    {rows.slice(0,limit).map((r,i)=><div className="miniTableRow" key={r.name}>
      <span className="place">{i+1}</span><div><b>{r.name}</b><small>{r.team}</small></div><strong>{r.pts}</strong>
    </div>)}
  </div>
}

function AccentCard({item}){
  return <a className={`v3Competition ${item.accent}`} href={`#${item.id}`}>
    <span className="v3CompIcon">{item.icon}</span>
    <b>{item.title}</b><small>{item.status}</small><i>→</i>
  </a>
}

function BarList({items,mode='ownership',total=11}){
  if(!items?.length) return <div className="statsEmpty">ยังไม่มีข้อมูลสำหรับ Gameweek นี้</div>
  return <div className={`barList ${mode}`}>{items.map((item,i)=>{
    const value=mode==='points'?item.points:item.pct
    const width=mode==='points'?Math.min(100,Math.max(10,(item.points||0)*7)):Math.max(10,item.pct||0)
    return <div className="barRow" key={`${item.id}-${i}`}>
      <span className="barRank">{i+1}</span>
      <div className="barMain">
        <div className="barName"><b>{item.player}</b><small>{item.count}/{total} managers</small></div>
        <div className="barTrack"><span style={{width:`${width}%`}}/></div>
      </div>
      <strong>{mode==='points'?`${value} pts`:`${value}%`}</strong>
    </div>
  })}</div>
}

function RuleChips({phase}){
  const first=phase==='first'
  return <div className="chanceRules">
    <b>กติกา {first?'First Chance':'Second Chance'}</b>
    <span>📅 {first?'GW1–GW19':'GW20–GW38'}</span>
    <span>💸 อันดับ 5–11 จ่ายคนละ 100 บาท</span>
    <span>🥇 350 • 🥈 200 • 🥉 150 บาท</span>
    <span>🛡️ อันดับ 4 ไม่รับ / ไม่จ่าย</span>
    {first && <span>🔄 จบ GW19 รีเซ็ตคะแนนเพื่อเริ่ม Second Chance</span>}
    {!first && <span>✨ เริ่มใหม่หลัง Reset ทุกคนมีโอกาสเท่ากัน</span>}
    <span>📌 ใช้กติกาการจัดอันดับของ FPL; คะแนนเท่ากันใช้ลำดับ FPL ตัดสิน</span>
  </div>
}

const TOY_ACCENTS={
  woody:{icon:'🤠',label:'WOODY',detail:'★ SHERIFF'},
  buzz:{icon:'🚀',label:'BUZZ',detail:'MISSION'},
  jessie:{icon:'🤠',label:'JESSIE',detail:'YEE-HAW'},
  bopeep:{icon:'🐑',label:'BO PEEP',detail:'SECOND RUN'},
  potato:{icon:'🥔',label:'POTATO',detail:'LUCKY PARTS'},
  pizza:{icon:'👽',label:'ALIEN',detail:'THE CLAW'},
  army:{icon:'🪖',label:'GREEN ARMY',detail:'RECON'},
  sid:{icon:'🧨',label:"SID'S TOYS",detail:'DATA WORKSHOP'},
  rex:{icon:'🦖',label:'REX',detail:'TIME TRAIL'},
  zurg:{icon:'👾',label:'ZURG',detail:'DARK ARCHIVE'},
  hamm:{icon:'🐷',label:'HAMM',detail:'PIGGY BANK'},
}

function ToyAccent({type,compact=false}){
  const item=TOY_ACCENTS[type]
  if(!item) return null
  return <div className={`toyAccent toy-${type} ${compact?'compact':''}`} aria-hidden="true">
    <span className="toyAccentIcon">{item.icon}</span>
    <span className="toyAccentCopy"><b>{item.label}</b><small>{item.detail}</small></span>
    <i/><i/><i/>
  </div>
}

function avg(nums){return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0}
function stdev(nums){
  if(nums.length<2) return 0
  const a=avg(nums)
  return Math.sqrt(avg(nums.map(x=>(x-a)**2)))
}

const XG_META={
  xg:{
    label:'ซีเล็ง',valueLabel:'ค่าซีเล็ง',tech:'xG',icon:'🎯',per90:'xg90',actual:'goals',actualLabel:'ยิงจริง',tone:'red',
    explain:'โอกาสที่จังหวะยิงจะกลายเป็นประตู'
  },
  xa:{
    label:'หัวจ่าย',valueLabel:'ค่าหัวจ่าย',tech:'xA',icon:'🎁',per90:'xa90',actual:'assists',actualLabel:'แอสซิสต์จริง',tone:'yellow',
    explain:'โอกาสที่การจ่ายบอลจะนำไปสู่ประตู'
  },
  xgi:{
    label:'xGI',valueLabel:'ค่า xGI',tech:'xGI',icon:'⚡',per90:'xgi90',actual:'goalInvolvements',actualLabel:'G+A จริง',tone:'blue',
    explain:'โอกาสมีส่วนร่วมกับประตูรวมจาก xG + xA'
  },
  xgc:{
    label:'สลิ้งแตก',valueLabel:'ค่าสลิ้งแตก',tech:'xGC',icon:'💥',per90:'xgc90',actual:'goalsConceded',actualLabel:'เสียจริง',tone:'purple',
    explain:'โอกาสที่ทีมจะเสียประตู'
  },
  defcon:{
    label:'น้าผู้ใหญ่',valueLabel:'ค่าน้าผู้ใหญ่',tech:'DefCon',icon:'🛡️',per90:'defcon90',actual:'points',actualLabel:'FPL pts',tone:'green',
    explain:'ค่าการมีส่วนร่วมเกมรับที่ FPL บันทึกจากจังหวะเคลียร์ บล็อก ตัดบอล และแท็กเกิล; MID รวม recovery ตามเกณฑ์ FPL'
  },
}

const LAB_COPY={
  king:{label:'ระดับสมเด็จ',icon:'👑',tone:'king',desc:'แพง + ดี'},
  walk:{label:'เดินแรง',icon:'🔥',tone:'walk',desc:'ถูก + ดี'},
  fake:{label:'ตีเก๊',icon:'📉',tone:'fake',desc:'แพง + ไม่ดี'},
  tui:{label:'ตุ่ยดุ้ย',icon:'🫠',tone:'tui',desc:'ถูก + ไม่ดี'},
  hurt:{label:'สะหง่อง',icon:'🤕',tone:'hurt',desc:'ความพร้อมมีปัญหา'},
  xavier:{label:'ซาเวียร์',icon:'🟨',tone:'xavier',desc:'ใบเหลืองสะสม'},
}

function XgRanking({rows,stat}){
  const meta=XG_META[stat]
  return <div className={`xgRanking ${meta.tone}`}>
    <div className="xgTableHead"><span>#</span><span>นักเตะ</span><span>ทีม</span><span>{meta.valueLabel}</span><span>/90</span><span>{meta.actualLabel}</span></div>
    <div className="xgRows">{rows.map((player,i)=>{
      const actual=stat==='xgi'?(player.goals+player.assists):player[meta.actual]
      return <div className="xgRow" key={player.id}>
        <span className="xgRank">{i+1}</span>
        <span className="xgPlayer"><b>{player.name}</b><small>{player.position} • £{player.price.toFixed(1)}m</small></span>
        <span className="xgTeam">{player.team}</span>
        <strong>{Number(player[stat]||0).toFixed(2)}</strong>
        <span className="xgPer90">{Number(player[meta.per90]||0).toFixed(2)}</span>
        <span className="xgActual">{actual??0}</span>
      </div>
    })}</div>
  </div>
}

function LastGwPlayers({data,loading}){
  if(loading) return <div className="statsEmpty big">กำลังรวมรายชื่อนักเตะจาก Last Gameweek…</div>
  if(!data?.available) return <div className="statsEmpty big">ยังดึงรายชื่อนักเตะ Last Gameweek ไม่ได้</div>
  if(data.managerCount!==members.length) return <div className="statsEmpty big">กำลังรอข้อมูล Squad ให้ครบ {members.length}/11 Manager</div>
  return <div className="lastPlayersPanel">
    <div className="lastPlayersHead">
      <div><small>LAST GAMEWEEK</small><h3>ALL PLAYERS — GW{data.gw}</h3><p>Unique squad list จาก Manager ทั้ง 11 คน</p></div>
      <strong>{data.allPlayers?.length||0}<em> UNIQUE PLAYERS</em></strong>
    </div>
    <div className="playerPoolList">{(data.allPlayers||[]).map((player,index)=><div className="playerPoolRow" key={player.id}>
      <span className="playerPoolIndex">{index+1}</span>
      <div className="playerPoolIdentity"><b>{player.name}</b><small>{player.team}</small></div>
      <span className={`positionTag ${String(player.position||'').toLowerCase()}`}>{player.position}</span>
      <div className="playerOwners"><em>{player.managers?.length||0} MANAGER{player.managers?.length===1?'':'S'}</em><span>{(player.managers||[]).join(' · ') || '—'}</span></div>
    </div>)}</div>
  </div>
}

function LabPlayerRow({player,index,mode='ppg'}){
  if(mode==='yellow'){
    return <div className="labMiniRow yellowRow">
      <span>{index+1}</span>
      <div className="labPlayerCore"><b>{player.name}</b><small>{player.team} • {player.position} • £{player.price.toFixed(1)}m</small></div>
      <strong>🟨 {Number(player.yellowCards||0).toFixed(0)} <em>ใบ</em></strong>
    </div>
  }
  const ga=(player.goals||0)+(player.assists||0)
  const showDef=player.position==='DEF'
  const showDefcon=['DEF','MID'].includes(player.position)
  return <div className="labMiniRow labEvidenceRow">
    <span>{index+1}</span>
    <div className="labPlayerCore">
      <b>{player.name}</b>
      <small>{player.team} • {player.position} • £{player.price.toFixed(1)}m</small>
      <div className="labEvidence">
        <i><em>MIN</em><b>{player.minutes||0}</b></i>
        <i><em>PPG</em><b>{Number(player.ppg||0).toFixed(1)}</b></i>
        <i><em>xGI</em><b>{Number(player.xgi||0).toFixed(2)}</b></i>
        <i><em>G+A</em><b>{ga}</b></i>
        {showDefcon&&<i><em>DefCon</em><b>{Number(player.defcon||0).toFixed(0)}</b></i>}
        {showDef&&<><i><em>xGC</em><b>{Number(player.xgc||0).toFixed(2)}</b></i><i><em>CS</em><b>{player.cleanSheets||0}</b></i></>}
      </div>
    </div>
    <strong>{Number(player.ppg||0).toFixed(1)} <em>PPG</em></strong>
  </div>
}

function LabRankCard({type,players}){
  const copy=LAB_COPY[type]
  return <article className={`labRankCard ${copy.tone}`}>
    <div className="labRankHead"><span>{copy.icon}</span><div><h4>{copy.label}</h4><small>{copy.desc}</small></div></div>
    <div className="labMiniList">{players?.length?players.map((player,i)=><LabPlayerRow player={player} index={i} key={player.id}/>):<div className="labMiniEmpty">ยังไม่มีนักเตะเข้าเงื่อนไข</div>}</div>
  </article>
}

function HurtCard({players}){
  const copy=LAB_COPY.hurt
  return <article className={`labRankCard ${copy.tone} labWideCard`}>
    <div className="labRankHead"><span>{copy.icon}</span><div><h4>{copy.label}</h4><small>{copy.desc}</small></div></div>
    <div className="hurtList">{players?.length?players.map(player=><div className="hurtRow" key={player.id}>
      <div><b>{player.name}</b><small>{player.team} • {player.position} • £{player.price.toFixed(1)}m</small></div>
      <span className={player.flagTone==='red'?'flagRed':'flagYellow'}>{player.flagTone==='red'?'🔴':'🟡'} {player.chanceNext==null?'Flagged':`${player.chanceNext}%`}</span>
      {player.news&&<em>{player.news}</em>}
    </div>):<div className="labMiniEmpty">ไม่มีนักเตะเข้าเงื่อนไขสะหง่องตอนนี้</div>}</div>
  </article>
}

function XavierCard({players}){
  const copy=LAB_COPY.xavier
  return <article className={`labRankCard ${copy.tone} labWideCard`}>
    <div className="labRankHead"><span>{copy.icon}</span><div><h4>{copy.label}</h4><small>{copy.desc}</small></div></div>
    <div className="labMiniList xavierList">{players?.length?players.map((player,i)=><LabPlayerRow player={player} index={i} mode="yellow" key={player.id}/>):<div className="labMiniEmpty">ยังไม่มีข้อมูลใบเหลือง</div>}</div>
    <div className="yellowRules">
      <b>กติกา Premier League</b>
      <span>5 ใบ ภายใน 19 นัดแรกของทีม → แบน 1 นัด</span>
      <span>10 ใบ ภายใน 32 นัดแรกของทีม → แบน 2 นัด</span>
      <span>15 ใบ ภายในฤดูกาล → แบน 3 นัด</span>
      <span>20 ใบ → คณะกรรมการพิจารณาโทษ</span>
      <small>หลังนัดที่ 19 เกณฑ์ 5 ใบหมดผล และหลังนัดที่ 32 เกณฑ์ 10 ใบหมดผล — จำนวนใบเหลืองไม่ได้รีเซ็ตเป็น 0</small>
    </div>
  </article>
}

export default function Home(){
  const [fplSummary,setFplSummary]=useState(null)
  const [fplStatus,setFplStatus]=useState('loading')
  const effectiveGameweeks=useMemo(()=>mergeGameweeks(fplSummary?.futureGameweeks),[fplSummary])
  const league=useMemo(()=>deriveLeague(effectiveGameweeks),[effectiveGameweeks])
  const [gw,setGw]=useState(league.latestGw)
  const [galleryGw,setGalleryGw]=useState(galleryGws.at(-1))
  const [statsMode,setStatsMode]=useState('gw')
  const [statsGw,setStatsGw]=useState(league.latestGw)
  const [gwStats,setGwStats]=useState(null)
  const [statsLoading,setStatsLoading]=useState(false)
  const [lastGwData,setLastGwData]=useState(null)
  const [lastGwLoading,setLastGwLoading]=useState(false)
  const [xgData,setXgData]=useState(null)
  const [xgLoading,setXgLoading]=useState(true)
  const [xgStat,setXgStat]=useState('xg')
  const [xgPosition,setXgPosition]=useState('FWD')
  const [lightbox,setLightbox]=useState(null)

  useEffect(()=>{
    let active=true
    fetch('/api/fpl',{cache:'no-store'}).then(r=>r.json()).then(data=>{
      if(!active)return
      setFplSummary(data)
      setFplStatus(data?.ok?'ready':'fallback')
    }).catch(()=>active&&setFplStatus('fallback'))
    return()=>{active=false}
  },[])

  useEffect(()=>{
    setGw(league.latestGw)
    setStatsGw(current=>Math.max(current,league.latestGw))
  },[league.latestGw])

  useEffect(()=>{
    if(statsMode!=='gw') return
    let active=true
    setStatsLoading(true)
    fetch(`/api/fpl?gw=${statsGw}`,{cache:'no-store'}).then(r=>r.json()).then(data=>{
      if(active)setGwStats(data)
    }).catch(()=>active&&setGwStats(null)).finally(()=>active&&setStatsLoading(false))
    return()=>{active=false}
  },[statsMode,statsGw])


  useEffect(()=>{
    const lastGw=fplSummary?.latestFinishedGw
    if(!lastGw) return
    let active=true
    setLastGwLoading(true)
    fetch(`/api/fpl?gw=${lastGw}`,{cache:'no-store'}).then(r=>r.json()).then(data=>{
      if(active)setLastGwData(data)
    }).catch(()=>active&&setLastGwData(null)).finally(()=>active&&setLastGwLoading(false))
    return()=>{active=false}
  },[fplSummary?.latestFinishedGw])

  useEffect(()=>{
    let active=true
    setXgLoading(true)
    fetch('/api/fpl?mode=xg',{cache:'no-store'}).then(r=>r.json()).then(data=>{
      if(active)setXgData(data)
    }).catch(()=>active&&setXgData(null)).finally(()=>active&&setXgLoading(false))
    return()=>{active=false}
  },[])

  const selected=effectiveGameweeks[gw]||effectiveGameweeks[league.latestGw]
  const latestGalleryGw=galleryGws.at(-1)
  const latestGalleryItem=gallery[latestGalleryGw]?.[2]||gallery[latestGalleryGw]?.[0]
  const mostWins=Object.entries(league.winCounts).sort((a,b)=>b[1]-a[1])[0]
  const liveReady=Boolean(fplSummary?.ok&&fplSummary?.canAutoScore)

  const settlementGws=league.gwNumbers.filter(g=>g<=financialThroughGw)
  const statement=useMemo(()=>memberOrder.map(name=>{
    const values=settlementGws.map(g=>{
      const rank=effectiveGameweeks[g].findIndex(r=>r[0]===name)
      let value=payout[rank]??0
      if(miniGameSaves[g]===name&&value<0)value=0
      return value
    })
    return {name,team:memberTeam[name],cash:values.reduce((a,b)=>a+b,0),values}
  }).sort((a,b)=>b.cash-a.cash),[effectiveGameweeks,settlementGws.join(',')])

  const statsGwOptions=Array.from({length:Math.max(league.latestGw,fplSummary?.latestFplGw||0,5)},(_,i)=>i+1)
  const lockedRows=effectiveGameweeks[statsGw]||[]
  const displayManagerStats=(gwStats?.managerStats||[]).map(row=>{
    const locked=lockedRows.find(r=>r[0]===row.name)
    return {...row,points:locked?locked[2]:row.points}
  }).sort((a,b)=>(b.points??-999)-(a.points??-999))
  const gwScores=displayManagerStats.map(r=>r.points).filter(Number.isFinite)
  const gwAverage=gwScores.length?Math.round(avg(gwScores)*10)/10:null

  const extras=Object.fromEntries((fplSummary?.overviewExtras||[]).map(x=>[x.name,x]))
  const seasonStats=memberOrder.map(name=>{
    const scores=league.gwNumbers.map(g=>effectiveGameweeks[g]?.find(r=>r[0]===name)?.[2]).filter(Number.isFinite)
    const bestScore=Math.max(...scores)
    const worstScore=Math.min(...scores)
    const bestIndex=scores.indexOf(bestScore)
    const worstIndex=scores.indexOf(worstScore)
    const form=scores.slice(-5)
    const x=extras[name]||{}
    return {
      name,team:memberTeam[name],total:scores.reduce((a,b)=>a+b,0),avg:Math.round(avg(scores)*10)/10,
      best:bestScore,bestGw:league.gwNumbers[bestIndex],worst:worstScore,worstGw:league.gwNumbers[worstIndex],
      wins:league.winCounts[name]||0,form:Math.round(avg(form)*10)/10,consistency:Math.round(stdev(scores)*10)/10,
      transfers:x.transfers??'—',hit:x.transferCost??'—',chips:x.chips||[]
    }
  }).sort((a,b)=>b.total-a.total)
  const mostConsistent=[...seasonStats].filter(x=>league.gwNumbers.length>=3).sort((a,b)=>a.consistency-b.consistency)[0]

  const expectedPlayers=xgData?.players||[]
  const effectiveXgPosition=xgStat==='xgc'?'DEF':xgStat==='defcon'?(xgPosition==='DEF'?'DEF':'MID'):xgPosition
  const xgTop20=useMemo(()=>expectedPlayers
    .filter(p=>p.position===effectiveXgPosition)
    .sort((a,b)=>(b[xgStat]||0)-(a[xgStat]||0) || (b.minutes||0)-(a.minutes||0))
    .slice(0,20),[expectedPlayers,effectiveXgPosition,xgStat])

  const labRankings=useMemo(()=>{
    const finishedGw=xgData?.latestFinishedGw||league.latestGw||1
    const regularMinutes=Math.max(180,Math.floor(finishedGw*90*.65))
    const regular=expectedPlayers.filter(p=>p.minutes>=regularMinutes)
    const isExpensive=(p)=>p.position==='DEF'?p.price>5.5:['MID','FWD'].includes(p.position)?p.price>7.5:false
    const expensive=regular.filter(isExpensive)
    const cheap=regular.filter(p=>!isExpensive(p))
    const impactScore=(p)=>{
      const attacking=(p.xgi90||0)*2.6
      const defensive=p.position==='DEF'?((p.defcon90||0)*.055 + (p.cleanSheets||0)*.12):p.position==='MID'?((p.defcon90||0)*.035):0
      return (p.ppg||0)+attacking+defensive
    }
    const best=(arr)=>[...arr].sort((a,b)=>impactScore(b)-impactScore(a) || b.ppg-a.ppg || b.minutes-a.minutes).slice(0,3)
    const worst=(arr)=>[...arr].sort((a,b)=>impactScore(a)-impactScore(b) || a.ppg-b.ppg || b.minutes-a.minutes).slice(0,3)
    const hurt=expectedPlayers
      .filter(p=>{
        const red=['i','s','u','n'].includes(p.status)||p.chanceNext===0
        const yellow=p.status==='d'&&p.chanceNext!=null&&p.chanceNext<50
        return red||yellow
      })
      .map(p=>({...p,flagTone:((['i','s','u','n'].includes(p.status)||p.chanceNext===0)?'red':'yellow')}))
      .sort((a,b)=>(a.chanceNext??-1)-(b.chanceNext??-1) || a.name.localeCompare(b.name))
    const xavier=[...expectedPlayers]
      .filter(p=>(p.yellowCards||0)>0)
      .sort((a,b)=>b.yellowCards-a.yellowCards || b.minutes-a.minutes || a.name.localeCompare(b.name))
      .slice(0,3)
    return {regularMinutes,king:best(expensive),walk:best(cheap),fake:worst(expensive),tui:worst(cheap),hurt,xavier}
  },[expectedPlayers,xgData?.latestFinishedGw,league.latestGw])

  return <main id="top" className="siteV3">
    <header className="siteHeader v3Header">
      <a className="logo v3Logo" href="#top"><span>♛</span><b>FPL KICKOFF <em>TODAY</em> 2027</b></a>
      <nav className="v3Nav">
        <a className="active" href="#top">⌂ Home</a><a href="#gameweek">📅 GW</a><a href="#full-season">🏆 League</a><a href="#mini-game">🎮 Mini Game</a><a href="#statistics">▥ Statistics</a><a className="labNav" href="#admin-inside">🧨 ADMIN INSIDE</a><a href="#gallery">▧ Gallery</a><a href="#rules">▤ Rules</a><a href="#finance">••• More</a>
      </nav>
    </header>

    <section className="masterHero" aria-label="FPL Kickoff Today 2027">
      <div className="heroStatus"><span>🔒 CLOSED LEAGUE</span><span>11 MANAGERS</span><span>GW1–GW{league.latestGw}</span></div>
    </section>

    <section className="homeDashboard">
      <div className="homeTopGrid">
        <article className="featureCard latestFeature">
          <div className="featureHead"><b>⚽ LATEST GAMEWEEK</b><span>GW{league.latestGw}</span></div>
          <img src={`/gallery/gw${latestGalleryGw}/${latestGalleryItem[0]}`} alt={latestGalleryItem[1]}/>
          <div className="featureOverlay"><small>GW{league.latestGw} WINNER</small><strong>{league.latestWinner.name} • {league.latestWinner.pts} pts</strong><a href="#gameweek">View GW →</a></div>
        </article>
        <article className="featureCard tableFeature">
          <div className="featureHead"><b>🏆 LEAGUE TABLE (TOP 4)</b><a href="#full-season">See Full Table →</a></div>
          <MiniTable rows={league.cumulative}/>
          <div className="hybridTag"><span>GW1–5 🔒</span><span>GW6+ {liveReady?'⚡ FPL AUTO':'⏳ READY'}</span></div>
        </article>
        <article className="featureCard miniFeature">
          <div className="featureHead"><b>🎮 MINI GAME • GW5</b><a href="#mini-game">See Result →</a></div>
          <img src="/gallery/gw5/gibbs-white-mania.jpeg" alt="GW5 Mini Game"/>
          <div className="featureOverlay"><small>THE DIFFERENTIAL</small><strong>Jimmy 🤝 Guide • 5 pts</strong><a href="#mini-game">View Mini Game →</a></div>
        </article>
      </div>

      <div className="competitionStrip" id="competitions">{competitions.map(item=><AccentCard item={item} key={item.id}/>)}</div>
      <div className="secondaryStrip">
        <a className="secondaryCard stats" href="#statistics"><span>▥</span><div><b>STATS & INSIGHTS</b><small>Gameweek + Season + Last GW players</small></div><i>→</i></a>
        <a className="secondaryCard lab" href="#admin-inside"><span>🧨</span><div><b>ADMIN INSIDE</b><small>FPL data • fun language</small></div><i>→</i></a>
        <a className="secondaryCard gallery" href="#gallery"><span>▧</span><div><b>GALLERY</b><small>GW1–GW{latestGalleryGw} stories</small></div><i>→</i></a>
        <a className="secondaryCard rules" href="#rules"><span>▤</span><div><b>RULES & INFO</b><small>Official rules + prize system</small></div><i>→</i></a>
      </div>
    </section>

    <section className="section detailSection toneGold toyWoodySection" id="full-season">
      <ToyAccent type="woody"/>
      <div className="sectionTitle"><div><p>🏆 FULL SEASON</p><h2>ศึกใหญ่ทั้งฤดูกาล</h2><span>คะแนน GW1–GW5 ล็อกตามข้อมูลที่กำหนดไว้ • ตั้งแต่ GW6 ต่อด้วย FPL อัตโนมัติ</span></div><strong>฿4,200</strong></div>
      <div className="twoCol v3TwoCol"><MiniTable rows={league.cumulative} limit={11} title={`Overall after GW${league.latestGw}`}/><div className="compactRule"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/full-season.jpeg',alt:'Full season rules'})}><img className="ruleMedia" src="/rules/full-season.jpeg" alt="Full season rules"/></button><div><b>Prize</b><span>🥇 2,000 • 🥈 1,200</span><span>🥉 600 • 4th 400</span><span>5–11 จ่ายคนละ 600 บาท</span></div></div></div>
    </section>

    <section className="section detailSection toneBlue toyBuzzSection" id="gameweek">
      <ToyAccent type="buzz"/>
      <div className="sectionTitle"><div><p>⚽ GAMEWEEK</p><h2>Weekly Battle</h2><span>เลือกดูผลราย Gameweek ได้ทุกสัปดาห์</span></div><strong>1st +120</strong></div>
      <div className="gwTabs v3Tabs">{league.gwNumbers.map(n=><button key={n} className={gw===n?'active':''} onClick={()=>setGw(n)}>GW{n}</button>)}</div>
      <div className="twoCol v3TwoCol">
        <div className="weeklyTable v3Weekly"><div className="weeklyHead"><span>#</span><span>Manager</span><span>PTS</span></div>{selected.map(([name,team,pts],i)=><div className={`weeklyRow ${i<3?'podium':''}`} key={name}><span>{i+1}</span><div><b>{name}</b><small>{team}</small></div><strong>{pts}</strong></div>)}</div>
        <div className="compactRule"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/gameweek.jpeg',alt:'Gameweek rules'})}><img className="ruleMedia" src="/rules/gameweek.jpeg" alt="Gameweek rules"/></button><div><b>Weekly payout</b><span>🥇 +120 • 🥈 +60 • 🥉 +30</span><span>4th = 0</span><span>5–11 = −30</span><span>{gw<=5?'🔒 Locked score':'⚡ FPL score'}</span></div></div>
      </div>
    </section>

    <section className="section chanceSection">
      <article className="chanceV3 first toyJessieSection" id="first-chance">
        <ToyAccent type="jessie" compact/>
        <div className="chanceHead"><span>🎯</span><div><small>FIRST CHANCE</small><h2>GW1–GW19</h2></div><b>฿700</b></div>
        <div className="chanceBody"><MiniTable rows={league.firstChanceRows}/><div className="chanceRuleWrap"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/first-second-chance.jpeg',alt:'First / Second Chance rules'})}><img className="ruleMedia" src="/rules/first-second-chance.jpeg" alt="First Chance rules"/></button><RuleChips phase="first"/></div></div>
      </article>
      <article className="chanceV3 second toyBoPeepSection" id="second-chance">
        <ToyAccent type="bopeep" compact/>
        <div className="chanceHead"><span>🔥</span><div><small>SECOND CHANCE</small><h2>GW20–GW38</h2></div><b>฿700</b></div>
        <div className="chanceBody">{league.secondChanceStarted?<MiniTable rows={league.secondChanceRows}/>:<div className="resetBox"><b>RESET AFTER GW19</b><span>ยังไม่เริ่มการแข่งขัน</span><small>คะแนนจะเริ่มนับใหม่ตั้งแต่ GW20</small></div>}<div className="chanceRuleWrap"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/first-second-chance.jpeg',alt:'First / Second Chance rules'})}><img className="ruleMedia" src="/rules/first-second-chance.jpeg" alt="Second Chance rules"/></button><RuleChips phase="second"/></div></div>
      </article>
    </section>

    <section className="section detailSection toneGreen toyPotatoSection" id="lucky-game">
      <ToyAccent type="potato"/>
      <div className="sectionTitle"><div><p>🍀 LUCKY GAME</p><h2>Fortune & Fun</h2><span>5 เงื่อนไข • ใครเข้าเงื่อนไขก่อนรับรางวัลนั้น</span></div><strong>2 / 5 claimed</strong></div>
      <div className="luckyV3">
        <div className="luckyConditions">{luckyConditions.map(c=><div className={c.claimed?'claimed':''} key={c.id}><span>{c.id}</span><div><b>{c.label}</b>{c.claimed&&<small>{c.winner} • {c.detail}</small>}</div><em>{c.claimed?'CLAIMED':'AVAILABLE'}</em></div>)}</div>
        <div className="winnerSpotlight"><img src="/games/lucky-game-gw4.png" alt="Best Lucky Game GW4 winner"/><div><small>WINNER ARCHIVE</small><h3>Best • GW4</h3><p>Matty Cash −1 pt • Lucky Reward #3</p><span>อีกเงื่อนไขที่ถูก Claim: #5 Own Goal — Oat</span></div></div>
      </div>
    </section>

    <section className="section detailSection tonePurple toyPizzaSection" id="mini-game">
      <ToyAccent type="pizza"/>
      <div className="sectionTitle"><div><p>🎮 MINI GAME</p><h2>Different Game. Different Week.</h2><span>รูปแบบเปลี่ยนได้ตาม Gameweek — ไม่จำกัดว่าเป็นเกมช่วยผู้แพ้</span></div><strong>FORMAT CHANGES</strong></div>
      <div className="miniTimeline v3Timeline"><div><b>GW1–GW4</b><span>เกมปริศนาทายภาพ</span></div><i>→</i><div><b>GW5</b><span>The Differential</span></div><i>→</i><div><b>NEXT</b><span>New Format</span></div></div>
      <div className="winnerGrid">{miniWinners.map(w=><figure key={w.gw}><img src={w.image} alt={`GW${w.gw} ${w.winner}`}/><figcaption><b>GW{w.gw} • {w.winner}</b><span>{w.answer}</span></figcaption></figure>)}</div>
      <div className="diffResult"><img src="/games/the-diff-gw5.png" alt="The Differential GW5"/><div><small>GW5 • THE DIFFERENTIAL</small><h3>Jimmy 🤝 Guide</h3><p>Iwobi 5 pts vs Mykolenko 5 pts — Tie</p></div></div>
    </section>

    <section className="section statsSectionV3 toyArmySection" id="statistics">
      <ToyAccent type="army"/>
      <div className="sectionTitle statsTitleV4"><div><p>📊 LEAGUE STATISTICS</p><h2>Stats & Insights</h2><span>ข้อมูล FPL League {FPL_LEAGUE_ID} + คะแนน Hybrid ของลีกเรา</span></div><div className={`apiPill ${fplStatus}`}>{fplStatus==='ready'?`⚡ ${fplSummary?.matchedCount||0}/11 CONNECTED`:fplStatus==='loading'?'CONNECTING…':'FALLBACK MODE'}</div></div>

      <div className="statsToolbar">
        <div className="statsMode"><button className={statsMode==='gw'?'active':''} onClick={()=>setStatsMode('gw')}><span>📅</span> GAMEWEEK</button><button className={statsMode==='season'?'active':''} onClick={()=>setStatsMode('season')}><span>📈</span> SEASON OVERVIEW</button></div>
        {statsMode==='gw' && <div className="statsSelector"><span>เลือก Gameweek</span><div className="gwTabs v3Tabs statsGwTabs">{statsGwOptions.map(n=><button key={n} className={statsGw===n?'active':''} onClick={()=>setStatsGw(n)}>GW{n}</button>)}</div></div>}
      </div>

      {statsMode==='gw' ? <>
        {statsLoading?<div className="statsEmpty big">กำลังโหลดข้อมูล FPL ของ GW{statsGw}…</div>:gwStats?.available?<>
          <div className="statKpis statKpisV4">
            <article className="kpiTop"><span className="kpiIcon">🏅</span><div><small>TOP SCORE</small><b>{displayManagerStats[0]?.name||'—'}</b></div><strong>{displayManagerStats[0]?.points??'—'}<em>pts</em></strong></article>
            <article className="kpiAvg"><span className="kpiIcon">📊</span><div><small>LEAGUE AVG</small><b>GW{statsGw}</b></div><strong>{gwAverage??'—'}<em>pts</em></strong></article>
            <article className="kpiLow"><span className="kpiIcon">🧊</span><div><small>LOW SCORE</small><b>{displayManagerStats.at(-1)?.name||'—'}</b></div><strong>{displayManagerStats.at(-1)?.points??'—'}<em>pts</em></strong></article>
            <article className="kpiChip"><span className="kpiIcon">🎴</span><div><small>CHIPS USED</small><b>GW{statsGw}</b></div><strong>{gwStats.headline?.chipsUsed??0}<em>used</em></strong></article>
          </div>

          <div className="statsGridV3 statsInsightGrid">
            <article className="insightCard owned"><div className="insightHead"><span>👥</span><div><h3>Most Owned</h3><small>นักเตะที่มีคนถือมากที่สุดในลีก</small></div></div><BarList items={gwStats.mostOwned} total={gwStats.managerCount}/></article>
            <article className="insightCard captain"><div className="insightHead"><span>©</span><div><h3>Captain Popularity</h3><small>ตัวเลือกกัปตันของผู้จัดการ 11 คน</small></div></div><BarList items={gwStats.captainPopularity} total={gwStats.managerCount}/></article>
            <article className="insightCard differential"><div className="insightHead"><span>💎</span><div><h3>Differential Watch</h3><small>คนน้อยถือ แต่ทำแต้มได้เด่น</small></div></div><BarList items={gwStats.differentials} mode="points" total={gwStats.managerCount}/></article>
          </div>

          <div className="managerStatsPanel">
            <div className="managerStatsTitle"><div><small>MANAGER BREAKDOWN</small><h3>GW{statsGw} Performance</h3></div><span>{displayManagerStats.length} managers</span></div>
            <div className="managerStatsWrap">
              <div className="managerStatsHead"><span># / Manager</span><span>GW Pts</span><span>Captain</span><span>Bench</span><span>Transfers</span><span>Chip</span></div>
              {displayManagerStats.map((row,i)=><div className="managerStatsRow" key={row.name}>
                <div className="managerIdentity"><i>{i+1}</i><div><b>{row.name}</b><small>{row.team}</small></div></div>
                <strong className="managerPoints">{row.points}<small>PTS</small></strong>
                <span className="managerMetric captainMetric"><em>Captain</em><b>{row.captain||'—'}</b><small>{row.captainPoints?`${row.captainPoints} pts`:''}</small></span>
                <span className="managerMetric"><em>Bench</em><b>{row.benchPoints??'—'}</b><small>pts</small></span>
                <span className="managerMetric"><em>Transfers</em><b>{row.transfers??'—'}</b><small>{row.transferCost?`−${row.transferCost} hit`:'No hit'}</small></span>
                <span className={`chipBadge ${row.chip?'chipOn':'chipOff'}`}><em>Chip</em><b>{row.chip||'—'}</b></span>
              </div>)}
            </div>
          </div>
        </>:<div className="statsEmpty big">ยังดึง FPL Statistics ของ GW{statsGw} ไม่ได้ แต่คะแนน GW1–GW5 และข้อมูลหลักของเว็บยังอยู่ครบ</div>}
      </> : <>
        <div className="seasonKpis seasonKpisV4">
          <article><span>👑</span><div><small>SEASON LEADER</small><b>{league.seasonLeader.name}</b></div><strong>{league.seasonLeader.pts}<em>pts</em></strong></article>
          <article><span>🏆</span><div><small>MOST GW WINS</small><b>{mostWins?.[0]||'—'}</b></div><strong>{mostWins?.[1]||0}<em>wins</em></strong></article>
          <article><span>🎯</span><div><small>MOST CONSISTENT</small><b>{mostConsistent?.name||'—'}</b></div><strong>{mostConsistent?.consistency??'—'}<em>σ</em></strong></article>
          <article><span>🗓️</span><div><small>SEASON PROGRESS</small><b>Completed</b></div><strong>{league.latestGw}<em>/38</em></strong></article>
        </div>

        <div className="seasonOverviewPanel">
          <div className="managerStatsTitle"><div><small>SEASON SNAPSHOT</small><h3>Manager Overview</h3></div><span>GW1–GW{league.latestGw}</span></div>
          <div className="seasonCards">{seasonStats.map((r,i)=><article className="seasonManagerCard" key={r.name}>
            <div className="seasonManagerTop"><span className="seasonRank">#{i+1}</span><div><b>{r.name}</b><small>{r.team}</small></div><strong>{r.total}<em>PTS</em></strong></div>
            <div className="seasonMetricGrid"><span><small>AVG</small><b>{r.avg}</b></span><span><small>BEST</small><b>{r.best}</b><em>GW{r.bestGw}</em></span><span><small>WORST</small><b>{r.worst}</b><em>GW{r.worstGw}</em></span><span><small>GW WINS</small><b>{r.wins}</b></span><span><small>FORM</small><b>{r.form}</b><em>last 5</em></span><span><small>TRANSFERS / HIT</small><b>{r.transfers} / {r.hit}</b></span></div>
          </article>)}</div>
        </div>
        <p className="statsNote">Score-based stats ใช้ GW1–GW5 ที่ล็อกไว้ และ GW6+ จาก FPL; Transfers / Hits / Chips ดึงจาก FPL โดยตรงเมื่อเชื่อมได้</p>
      </>}

      <div className="statsSubDivider"><span>👥</span><div><small>LAST GW PLAYER LIST</small><h3>รายชื่อนักเตะทั้งหมดที่ 11 Manager มี</h3></div></div>
      <LastGwPlayers data={lastGwData} loading={lastGwLoading}/>
    </section>

    <section className="section xgLabSection toySidSection" id="admin-inside">
      <ToyAccent type="sid"/>
      <div className="xgHero">
        <div className="xgHost">
          <div className="kunPhotoFrame"><img src="/xg-lab/kun-host.jpeg" alt="Kun — ADMIN INSIDE host"/></div>
          <div className="speechBubble">ก่อน <b>Transfer</b><br/>อย่าเผลอใจ</div>
        </div>
        <div className="xgBrand"><small>FPL DATA • FUN LANGUAGE</small><h2><span>ADMIN</span> INSIDE</h2><strong>by Kun</strong><p>หลังบ้านของ Admin • ชำแหละข้อมูลก่อน Transfer</p></div>
        <div className="xgLegend">
          <span className="red">🎯 <b>ซีเล็ง</b><small>xG</small></span>
          <span className="yellow">🎁 <b>หัวจ่าย</b><small>xA</small></span>
          <span className="blue">⚡ <b>xGI</b><small>xGI</small></span>
          <span className="purple">💥 <b>สลิ้งแตก</b><small>xGC</small></span>
          <span className="green">🛡️ <b>น้าผู้ใหญ่</b><small>DefCon</small></span>
        </div>
      </div>

      <div className="xgControls">
        <div className="xgStatTabs">{Object.entries(XG_META).map(([key,meta])=><button key={key} className={`${meta.tone} ${xgStat===key?'active':''}`} onClick={()=>{setXgStat(key);if(key==='xgc')setXgPosition('DEF');if(key==='defcon'&&!['MID','DEF'].includes(xgPosition))setXgPosition('MID')}}><span>{meta.icon}</span><b>{meta.label}</b><small>{meta.tech}</small></button>)}</div>
        {xgStat==='xgc'?<div className="xgPositionTabs defOnly"><span>POSITION</span><b>DEF ONLY</b></div>:xgStat==='defcon'?<div className="xgPositionTabs"><span>POSITION</span>{['MID','DEF'].map(pos=><button key={pos} className={xgPosition===pos?'active':''} onClick={()=>setXgPosition(pos)}>{pos}</button>)}</div>:<div className="xgPositionTabs"><span>POSITION</span>{['FWD','MID','DEF'].map(pos=><button key={pos} className={xgPosition===pos?'active':''} onClick={()=>setXgPosition(pos)}>{pos}</button>)}</div>}
      </div>

      <div className={`xgExplain ${XG_META[xgStat].tone}`}><span>{XG_META[xgStat].icon}</span><div><b>{XG_META[xgStat].valueLabel} ({XG_META[xgStat].tech})</b><p>{XG_META[xgStat].explain}</p></div></div>

      <div className={`xgRankingPanel ${XG_META[xgStat].tone}`}>
        <div className="xgRankingTitle"><div><small>TOP 20 • {effectiveXgPosition}</small><h3>{XG_META[xgStat].icon} {XG_META[xgStat].label}</h3></div><span>{XG_META[xgStat].tech} + /90</span></div>
        {xgLoading?<div className="xgLoading">กำลังโหลด Expected Stats จาก FPL…</div>:xgData?.ok?<XgRanking rows={xgTop20} stat={xgStat}/>:<div className="xgLoading">ตอนนี้ดึงข้อมูล xG จาก FPL ไม่ได้</div>}
      </div>

      <div className="labStatusBlock">
        <div className="labStatusTitle"><div><small>ADMIN STATUS</small><h3>ศัพท์ประจำ ADMIN</h3></div><span>อัปเดตตามข้อมูล FPL</span></div>
        <div className="labRankGrid">
          <LabRankCard type="king" players={labRankings.king}/>
          <LabRankCard type="walk" players={labRankings.walk}/>
          <LabRankCard type="fake" players={labRankings.fake}/>
          <LabRankCard type="tui" players={labRankings.tui}/>
          <HurtCard players={labRankings.hurt}/>
          <XavierCard players={labRankings.xavier}/>
        </div>
      </div>
      <p className="xgFootnote">Stats เป็น Season-to-date จาก FPL • ค่า /90 คำนวณจากนาทีที่ลงเล่น • ไม่รวม GK • 4 ฉายาหลักใช้เฉพาะนักเตะที่มีนาทีลงเล่นเพียงพอ และแสดง Stat ประกอบว่าทำไมถึงติดอันดับ</p>
    </section>

    <section className="section gallerySectionV3 toyRexSection" id="gallery">
      <ToyAccent type="rex"/>
      <div className="sectionTitle"><div><p>🖼️ GALLERY</p><h2>Season Story</h2><span>{totalGallery} artworks • เรื่องราวของแต่ละ Gameweek</span></div><strong>GW1–GW{latestGalleryGw}</strong></div>
      <div className="rexJourney" aria-hidden="true"><span>🌋<small>GW1 • PAST</small></span><i/><span className="rexNow">🦖<small>NOW • GW{galleryGw}</small></span><i/><span>✨<small>FUTURE • GW38</small></span></div>
      <div className="gwTabs v3Tabs">{galleryGws.map(n=><button key={n} className={galleryGw===n?'active':''} onClick={()=>setGalleryGw(n)}>GW{n}</button>)}</div>
      <div className="galleryGrid">{gallery[galleryGw].map(([file,title])=><figure key={file}><img loading="lazy" src={`/gallery/gw${galleryGw}/${file}`} alt={title}/><figcaption><b>{title}</b><span>GW{galleryGw} • FPL Kickoff Today 2027</span></figcaption></figure>)}</div>
    </section>

    <section className="section rulesSectionV3 toyZurgSection" id="rules">
      <ToyAccent type="zurg"/>
      <div className="sectionTitle"><div><p>📜 RULES & INFO</p><h2>Official Rules Archive</h2><span>กติกาเต็มของการแข่งขันทั้งหมด</span></div><strong>OFFICIAL</strong></div>
      <div className="rulesGrid"><figure><img src="/rules/official-overview.jpeg" alt="Overview"/><figcaption><b>Official Overview</b><span>ภาพรวมการแข่งขันและเงินรางวัล</span></figcaption></figure><figure><img src="/rules/gameweek.jpeg" alt="Gameweek"/><figcaption><b>Gameweek</b><span>Weekly payout</span></figcaption></figure><figure><img src="/rules/first-second-chance.jpeg" alt="Chance rules"/><figcaption><b>First / Second Chance</b><span>GW1–19 / GW20–38 + Reset</span></figcaption></figure><figure><img src="/rules/full-season.jpeg" alt="Full Season"/><figcaption><b>Full Season</b><span>End-of-season prize</span></figcaption></figure><figure><img src="/rules/mini-game-legacy.jpeg" alt="Mini Game"/><figcaption><b>Mini Game — Archive</b><span>GW1–GW4 original format</span></figcaption></figure><figure><img src="/rules/lucky-game-current.jpeg" alt="Lucky Game"/><figcaption><b>Lucky Game — Current</b><span>#3 & #5 claimed</span></figcaption></figure></div>
    </section>

    <section className="section financeSection toyHammSection" id="finance">
      <ToyAccent type="hamm"/>
      <div className="sectionIntroRow"><div><p className="sectionKicker">💰 FINANCE</p><h2>Manager Financial</h2><p>ข้อมูลการเงินของเกม แยกจาก FPL และไม่เผยข้อมูลบัญชีส่วนบุคคล</p></div><div className="officialTag greenTag">THROUGH GW{financialThroughGw}</div></div>
      <div className="financeTop">{topFinancial.slice(0,4).map((p,i)=><article key={p.name}><span>#{i+1}</span><h3>{p.name}</h3><small>{p.team}</small><Money value={p.cash}/></article>)}</div>
      <div className="financeTable"><div className="financeHead"><span>Manager</span><span>Cash Flow</span><span>Lucky Pool</span><span>GW</span><span>Mini</span><span>Lucky</span></div>{topFinancial.map(p=><div className="financeRow" key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/><Money value={p.luckyPool}/><Money value={p.gwWon+p.gwLost}/><Money value={p.mini}/><Money value={p.lucky}/></div>)}</div>
      <details className="statementDetails"><summary>ดู Gameweek Statement GW1–GW{financialThroughGw}</summary><div className="statementTable"><div className="statementHead" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}}><span>Manager</span><span>Total</span>{settlementGws.map(g=><span key={g}>GW{g}</span>)}</div>{statement.map(p=><div className="statementRow" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}} key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/>{p.values.map((v,i)=><span key={i} className="statementCell"><Money value={v}/>{miniGameSaves[settlementGws[i]]===p.name&&<em>SAVE</em>}</span>)}</div>)}</div></details>
      <p className="privacy">🔒 เว็บสาธารณะนี้ไม่แสดงเลขบัญชี ธนาคาร หรือช่องทางการชำระเงินส่วนบุคคล</p>
    </section>

    <footer><div className="footerLogo">FPL <b>KICKOFF TODAY</b> 2027</div><p>SAME GAME. DIFFERENT STORIES. ONE LEAGUE.</p><a href="#top">Back to top ↑</a></footer>
    {lightbox&&<div className="imageLightbox" role="dialog" aria-modal="true" aria-label={lightbox.alt} onClick={()=>setLightbox(null)}><button aria-label="Close" onClick={()=>setLightbox(null)}>×</button><img src={lightbox.src} alt={lightbox.alt} onClick={e=>e.stopPropagation()}/></div>}
  </main>
}
