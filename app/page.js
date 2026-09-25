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
  return <div className="barList">{items.map((item,i)=>{
    const value=mode==='points'?item.points:item.pct
    const width=mode==='points'?Math.min(100,Math.max(8,(item.points||0)*7)):Math.max(8,item.pct||0)
    return <div className="barRow" key={`${item.id}-${i}`}>
      <div className="barName"><b>{item.player}</b><small>{item.count}/{total} managers</small></div>
      <div className="barTrack"><span style={{width:`${width}%`}}/></div>
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

function avg(nums){return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0}
function stdev(nums){
  if(nums.length<2) return 0
  const a=avg(nums)
  return Math.sqrt(avg(nums.map(x=>(x-a)**2)))
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

  return <main id="top" className="siteV3">
    <header className="siteHeader v3Header">
      <a className="logo v3Logo" href="#top"><span>♛</span><b>FPL KICKOFF <em>TODAY</em> 2027</b></a>
      <nav className="v3Nav">
        <a className="active" href="#top">⌂ Home</a><a href="#gameweek">📅 GW</a><a href="#full-season">🏆 League</a><a href="#mini-game">🎮 Mini Game</a><a href="#statistics">▥ Statistics</a><a href="#gallery">▧ Gallery</a><a href="#rules">▤ Rules</a><a href="#finance">••• More</a>
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
        <a className="secondaryCard stats" href="#statistics"><span>▥</span><div><b>STATS & INSIGHTS</b><small>Gameweek + Season Overview</small></div><i>→</i></a>
        <a className="secondaryCard gallery" href="#gallery"><span>▧</span><div><b>GALLERY</b><small>GW1–GW{latestGalleryGw} stories</small></div><i>→</i></a>
        <a className="secondaryCard rules" href="#rules"><span>▤</span><div><b>RULES & INFO</b><small>Official rules + prize system</small></div><i>→</i></a>
      </div>
    </section>

    <section className="section detailSection toneGold" id="full-season">
      <div className="sectionTitle"><div><p>🏆 FULL SEASON</p><h2>ศึกใหญ่ทั้งฤดูกาล</h2><span>คะแนน GW1–GW5 ล็อกตามข้อมูลที่กำหนดไว้ • ตั้งแต่ GW6 ต่อด้วย FPL อัตโนมัติ</span></div><strong>฿4,200</strong></div>
      <div className="twoCol v3TwoCol"><MiniTable rows={league.cumulative} limit={11} title={`Overall after GW${league.latestGw}`}/><div className="compactRule"><img src="/rules/full-season.jpeg" alt="Full season rules"/><div><b>Prize</b><span>🥇 2,000 • 🥈 1,200</span><span>🥉 600 • 4th 400</span><span>5–11 จ่ายคนละ 600 บาท</span></div></div></div>
    </section>

    <section className="section detailSection toneBlue" id="gameweek">
      <div className="sectionTitle"><div><p>⚽ GAMEWEEK</p><h2>Weekly Battle</h2><span>เลือกดูผลราย Gameweek ได้ทุกสัปดาห์</span></div><strong>1st +120</strong></div>
      <div className="gwTabs v3Tabs">{league.gwNumbers.map(n=><button key={n} className={gw===n?'active':''} onClick={()=>setGw(n)}>GW{n}</button>)}</div>
      <div className="twoCol v3TwoCol">
        <div className="weeklyTable v3Weekly"><div className="weeklyHead"><span>#</span><span>Manager</span><span>PTS</span></div>{selected.map(([name,team,pts],i)=><div className={`weeklyRow ${i<3?'podium':''}`} key={name}><span>{i+1}</span><div><b>{name}</b><small>{team}</small></div><strong>{pts}</strong></div>)}</div>
        <div className="compactRule"><img src="/rules/gameweek.jpeg" alt="Gameweek rules"/><div><b>Weekly payout</b><span>🥇 +120 • 🥈 +60 • 🥉 +30</span><span>4th = 0</span><span>5–11 = −30</span><span>{gw<=5?'🔒 Locked score':'⚡ FPL score'}</span></div></div>
      </div>
    </section>

    <section className="section chanceSection">
      <article className="chanceV3 first" id="first-chance">
        <div className="chanceHead"><span>🎯</span><div><small>FIRST CHANCE</small><h2>GW1–GW19</h2></div><b>฿700</b></div>
        <div className="chanceBody"><MiniTable rows={league.firstChanceRows}/><div className="chanceRuleWrap"><img src="/rules/first-second-chance.jpeg" alt="First Chance rules" className="firstCrop"/><RuleChips phase="first"/></div></div>
      </article>
      <article className="chanceV3 second" id="second-chance">
        <div className="chanceHead"><span>🔥</span><div><small>SECOND CHANCE</small><h2>GW20–GW38</h2></div><b>฿700</b></div>
        <div className="chanceBody">{league.secondChanceStarted?<MiniTable rows={league.secondChanceRows}/>:<div className="resetBox"><b>RESET AFTER GW19</b><span>ยังไม่เริ่มการแข่งขัน</span><small>คะแนนจะเริ่มนับใหม่ตั้งแต่ GW20</small></div>}<div className="chanceRuleWrap"><img src="/rules/first-second-chance.jpeg" alt="Second Chance rules" className="secondCrop"/><RuleChips phase="second"/></div></div>
      </article>
    </section>

    <section className="section detailSection toneGreen" id="lucky-game">
      <div className="sectionTitle"><div><p>🍀 LUCKY GAME</p><h2>Fortune & Fun</h2><span>5 เงื่อนไข • ใครเข้าเงื่อนไขก่อนรับรางวัลนั้น</span></div><strong>2 / 5 claimed</strong></div>
      <div className="luckyV3">
        <div className="luckyConditions">{luckyConditions.map(c=><div className={c.claimed?'claimed':''} key={c.id}><span>{c.id}</span><div><b>{c.label}</b>{c.claimed&&<small>{c.winner} • {c.detail}</small>}</div><em>{c.claimed?'CLAIMED':'AVAILABLE'}</em></div>)}</div>
        <div className="winnerSpotlight"><img src="/games/lucky-game-gw4.png" alt="Best Lucky Game GW4 winner"/><div><small>WINNER ARCHIVE</small><h3>Best • GW4</h3><p>Matty Cash −1 pt • Lucky Reward #3</p><span>อีกเงื่อนไขที่ถูก Claim: #5 Own Goal — Oat</span></div></div>
      </div>
    </section>

    <section className="section detailSection tonePurple" id="mini-game">
      <div className="sectionTitle"><div><p>🎮 MINI GAME</p><h2>Different Game. Different Week.</h2><span>รูปแบบเปลี่ยนได้ตาม Gameweek — ไม่จำกัดว่าเป็นเกมช่วยผู้แพ้</span></div><strong>FORMAT CHANGES</strong></div>
      <div className="miniTimeline v3Timeline"><div><b>GW1–GW4</b><span>เกมปริศนาทายภาพ</span></div><i>→</i><div><b>GW5</b><span>The Differential</span></div><i>→</i><div><b>NEXT</b><span>New Format</span></div></div>
      <div className="winnerGrid">{miniWinners.map(w=><figure key={w.gw}><img src={w.image} alt={`GW${w.gw} ${w.winner}`}/><figcaption><b>GW{w.gw} • {w.winner}</b><span>{w.answer}</span></figcaption></figure>)}</div>
      <div className="diffResult"><img src="/games/the-diff-gw5.png" alt="The Differential GW5"/><div><small>GW5 • THE DIFFERENTIAL</small><h3>Jimmy 🤝 Guide</h3><p>Iwobi 5 pts vs Mykolenko 5 pts — Tie</p></div></div>
    </section>

    <section className="section statsSectionV3" id="statistics">
      <div className="sectionTitle"><div><p>📊 LEAGUE STATISTICS</p><h2>Stats & Insights</h2><span>ข้อมูล FPL League {FPL_LEAGUE_ID} + คะแนน Hybrid ของลีกเรา</span></div><div className={`apiPill ${fplStatus}`}>{fplStatus==='ready'?`⚡ ${fplSummary?.matchedCount||0}/11 CONNECTED`:fplStatus==='loading'?'CONNECTING…':'FALLBACK MODE'}</div></div>
      <div className="statsMode"><button className={statsMode==='gw'?'active':''} onClick={()=>setStatsMode('gw')}>GAMEWEEK</button><button className={statsMode==='season'?'active':''} onClick={()=>setStatsMode('season')}>SEASON OVERVIEW</button></div>

      {statsMode==='gw' ? <>
        <div className="statsSelector"><span>เลือก Gameweek</span><div className="gwTabs v3Tabs">{statsGwOptions.map(n=><button key={n} className={statsGw===n?'active':''} onClick={()=>setStatsGw(n)}>GW{n}</button>)}</div></div>
        {statsLoading?<div className="statsEmpty big">กำลังโหลดข้อมูล FPL ของ GW{statsGw}…</div>:gwStats?.available?<>
          <div className="statKpis"><article><small>TOP SCORE</small><b>{displayManagerStats[0]?.name||'—'}</b><strong>{displayManagerStats[0]?.points??'—'}</strong></article><article><small>LEAGUE AVG</small><b>GW{statsGw}</b><strong>{gwAverage??'—'}</strong></article><article><small>LOW SCORE</small><b>{displayManagerStats.at(-1)?.name||'—'}</b><strong>{displayManagerStats.at(-1)?.points??'—'}</strong></article><article><small>CHIPS USED</small><b>GW{statsGw}</b><strong>{gwStats.headline?.chipsUsed??0}</strong></article></div>
          <div className="statsGridV3"><article><h3>👥 Most Owned</h3><BarList items={gwStats.mostOwned} total={gwStats.managerCount}/></article><article><h3>© Captain Popularity</h3><BarList items={gwStats.captainPopularity} total={gwStats.managerCount}/></article><article><h3>💎 Differential Watch</h3><BarList items={gwStats.differentials} mode="points" total={gwStats.managerCount}/></article></div>
          <div className="managerStatsWrap"><div className="managerStatsHead"><span>Manager</span><span>GW Pts</span><span>Captain</span><span>Bench</span><span>Transfers</span><span>Chip</span></div>{displayManagerStats.map(row=><div className="managerStatsRow" key={row.name}><div><b>{row.name}</b><small>{row.team}</small></div><strong>{row.points}</strong><span>{row.captain}<small>{row.captainPoints?` • ${row.captainPoints} pts`:''}</small></span><span>{row.benchPoints}</span><span>{row.transfers}{row.transferCost?` (-${row.transferCost})`:''}</span><span className={row.chip?'chipOn':'chipOff'}>{row.chip||'—'}</span></div>)}</div>
        </>:<div className="statsEmpty big">ยังดึง FPL Statistics ของ GW{statsGw} ไม่ได้ แต่คะแนน GW1–GW5 และข้อมูลหลักของเว็บยังอยู่ครบ</div>}
      </> : <>
        <div className="seasonKpis"><article><small>SEASON LEADER</small><b>{league.seasonLeader.name}</b><strong>{league.seasonLeader.pts}</strong></article><article><small>MOST GW WINS</small><b>{mostWins?.[0]||'—'}</b><strong>{mostWins?.[1]||0}</strong></article><article><small>MOST CONSISTENT</small><b>{mostConsistent?.name||'—'}</b><strong>σ {mostConsistent?.consistency??'—'}</strong></article><article><small>SEASON PROGRESS</small><b>Completed</b><strong>{league.latestGw}/38</strong></article></div>
        <div className="seasonStatsTable"><div className="seasonStatsHead"><span>Manager</span><span>Total</span><span>Avg</span><span>Best</span><span>Worst</span><span>Wins</span><span>Form</span><span>Transfers / Hit</span></div>{seasonStats.map((r,i)=><div className="seasonStatsRow" key={r.name}><div><b>#{i+1} {r.name}</b><small>{r.team}</small></div><strong>{r.total}</strong><span>{r.avg}</span><span>{r.best} <small>GW{r.bestGw}</small></span><span>{r.worst} <small>GW{r.worstGw}</small></span><span>{r.wins}</span><span>{r.form}</span><span>{r.transfers} / {r.hit}</span></div>)}</div>
        <p className="statsNote">Score-based stats ใช้ GW1–GW5 ที่ล็อกไว้ และ GW6+ จาก FPL; Transfers / Hits / Chips ดึงจาก FPL โดยตรงเมื่อเชื่อมได้</p>
      </>}
    </section>

    <section className="section gallerySectionV3" id="gallery">
      <div className="sectionTitle"><div><p>🖼️ GALLERY</p><h2>Season Story</h2><span>{totalGallery} artworks • เรื่องราวของแต่ละ Gameweek</span></div><strong>GW1–GW{latestGalleryGw}</strong></div>
      <div className="gwTabs v3Tabs">{galleryGws.map(n=><button key={n} className={galleryGw===n?'active':''} onClick={()=>setGalleryGw(n)}>GW{n}</button>)}</div>
      <div className="galleryGrid">{gallery[galleryGw].map(([file,title])=><figure key={file}><img loading="lazy" src={`/gallery/gw${galleryGw}/${file}`} alt={title}/><figcaption><b>{title}</b><span>GW{galleryGw} • FPL Kickoff Today 2027</span></figcaption></figure>)}</div>
    </section>

    <section className="section rulesSectionV3" id="rules">
      <div className="sectionTitle"><div><p>📜 RULES & INFO</p><h2>Official Rules Archive</h2><span>กติกาเต็มของการแข่งขันทั้งหมด</span></div><strong>OFFICIAL</strong></div>
      <div className="rulesGrid"><figure><img src="/rules/official-overview.jpeg" alt="Overview"/><figcaption><b>Official Overview</b><span>ภาพรวมการแข่งขันและเงินรางวัล</span></figcaption></figure><figure><img src="/rules/gameweek.jpeg" alt="Gameweek"/><figcaption><b>Gameweek</b><span>Weekly payout</span></figcaption></figure><figure><img src="/rules/first-second-chance.jpeg" alt="Chance rules"/><figcaption><b>First / Second Chance</b><span>GW1–19 / GW20–38 + Reset</span></figcaption></figure><figure><img src="/rules/full-season.jpeg" alt="Full Season"/><figcaption><b>Full Season</b><span>End-of-season prize</span></figcaption></figure><figure><img src="/rules/mini-game-legacy.jpeg" alt="Mini Game"/><figcaption><b>Mini Game — Archive</b><span>GW1–GW4 original format</span></figcaption></figure><figure><img src="/rules/lucky-game-current.jpeg" alt="Lucky Game"/><figcaption><b>Lucky Game — Current</b><span>#3 & #5 claimed</span></figcaption></figure></div>
    </section>

    <section className="section financeSection" id="finance">
      <div className="sectionIntroRow"><div><p className="sectionKicker">💰 FINANCE</p><h2>Manager Financial</h2><p>ข้อมูลการเงินของเกม แยกจาก FPL และไม่เผยข้อมูลบัญชีส่วนบุคคล</p></div><div className="officialTag greenTag">THROUGH GW{financialThroughGw}</div></div>
      <div className="financeTop">{topFinancial.slice(0,4).map((p,i)=><article key={p.name}><span>#{i+1}</span><h3>{p.name}</h3><small>{p.team}</small><Money value={p.cash}/></article>)}</div>
      <div className="financeTable"><div className="financeHead"><span>Manager</span><span>Cash Flow</span><span>Lucky Pool</span><span>GW</span><span>Mini</span><span>Lucky</span></div>{topFinancial.map(p=><div className="financeRow" key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/><Money value={p.luckyPool}/><Money value={p.gwWon+p.gwLost}/><Money value={p.mini}/><Money value={p.lucky}/></div>)}</div>
      <details className="statementDetails"><summary>ดู Gameweek Statement GW1–GW{financialThroughGw}</summary><div className="statementTable"><div className="statementHead" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}}><span>Manager</span><span>Total</span>{settlementGws.map(g=><span key={g}>GW{g}</span>)}</div>{statement.map(p=><div className="statementRow" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}} key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/>{p.values.map((v,i)=><span key={i} className="statementCell"><Money value={v}/>{miniGameSaves[settlementGws[i]]===p.name&&<em>SAVE</em>}</span>)}</div>)}</div></details>
      <p className="privacy">🔒 เว็บสาธารณะนี้ไม่แสดงเลขบัญชี ธนาคาร หรือช่องทางการชำระเงินส่วนบุคคล</p>
    </section>

    <footer><div className="footerLogo">FPL <b>KICKOFF TODAY</b> 2027</div><p>SAME GAME. DIFFERENT STORIES. ONE LEAGUE.</p><a href="#top">Back to top ↑</a></footer>
  </main>
}
