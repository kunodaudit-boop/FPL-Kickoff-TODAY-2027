'use client'

import { useEffect, useMemo, useState } from 'react'
import { financial, financialThroughGw, gameweeks as lockedGameweeks, members, miniGameSaves } from './league-data'
import { competitions, gallery, miniWinners, luckyConditions } from './content-data'

const LOCKED_THROUGH_GW = 5
const FPL_LEAGUE_ID = 606037
const memberOrder = members.map(([name]) => name)
const memberTeam = Object.fromEntries(members)
const galleryGws = Object.keys(gallery).map(Number).sort((a,b)=>a-b)
const totalGallery = Object.values(gallery).reduce((sum,items)=>sum+items.length,0)
const topFinancial = [...financial].sort((a,b)=>b.cash-a.cash)
const payout = [120,60,30,0,-30,-30,-30,-30,-30,-30,-30]

function mergeGameweeks(futureGameweeks){
  const merged = {...lockedGameweeks}
  Object.entries(futureGameweeks || {}).forEach(([gw,rows])=>{
    const n = Number(gw)
    if(n > LOCKED_THROUGH_GW && Array.isArray(rows) && rows.length === members.length){
      merged[n] = rows
    }
  })
  return merged
}

function deriveLeague(gameweeks){
  const gwNumbers = Object.keys(gameweeks).map(Number).sort((a,b)=>a-b)
  const latestGw = gwNumbers.at(-1)
  const cumulative = memberOrder.map(name => ({
    name,
    team: memberTeam[name],
    pts: gwNumbers.reduce((sum,gw)=>sum+(gameweeks[gw].find(r=>r[0]===name)?.[2]||0),0)
  })).sort((a,b)=>b.pts-a.pts)
  const weeklyWinners = gwNumbers.map(gw=>({gw,name:gameweeks[gw][0][0],pts:gameweeks[gw][0][2]}))
  const winCounts = weeklyWinners.reduce((acc,w)=>{acc[w.name]=(acc[w.name]||0)+1;return acc},{})
  const firstChanceGws = gwNumbers.filter(g=>g<=19)
  const secondChanceGws = gwNumbers.filter(g=>g>=20)
  const phaseRows = (gws) => memberOrder.map(name=>({
    name,
    team:memberTeam[name],
    pts:gws.reduce((sum,gw)=>sum+(gameweeks[gw]?.find(r=>r[0]===name)?.[2]||0),0)
  })).sort((a,b)=>b.pts-a.pts)

  return {
    gwNumbers,
    latestGw,
    cumulative,
    weeklyWinners,
    winCounts,
    latestWinner:weeklyWinners.at(-1),
    seasonLeader:cumulative[0],
    firstChanceRows:phaseRows(firstChanceGws),
    secondChanceRows:phaseRows(secondChanceGws),
    secondChanceGws,
  }
}

function Money({value}){
  const cls = value>0?'money pos':value<0?'money neg':'money zero'
  return <span className={cls}>{value>0?'+':''}{value}</span>
}

function TopTable({rows,limit=4,title='Overall'}){
  return <div className="miniTable">
    <div className="miniTableHead"><span>{title}</span><span>PTS</span></div>
    {rows.slice(0,limit).map((r,i)=><div className="miniTableRow" key={r.name}><span className="place">{i+1}</span><div><b>{r.name}</b><small>{r.team}</small></div><strong>{r.pts}</strong></div>)}
  </div>
}

function CompetitionCard({item}){
  return <a className={`competitionCard ${item.accent}`} href={`#${item.id}`}>
    <div className="competitionIcon">{item.icon}</div>
    <div className="competitionCardCopy"><small>{item.kicker}</small><h3>{item.title}</h3><p>{item.summary}</p></div>
    <div className="competitionStatus">{item.status}</div>
  </a>
}

function SourceBadge({gw,liveReady}){
  if(gw <= LOCKED_THROUGH_GW) return <span className="sourceBadge locked">🔒 LOCKED DATA</span>
  return <span className={`sourceBadge ${liveReady?'live':'waiting'}`}>{liveReady?'⚡ FPL AUTO':'⏳ FPL WAITING'}</span>
}

function BarList({items,empty='ยังไม่มีข้อมูล',mode='ownership',totalManagers=11}){
  if(!items?.length) return <div className="statsEmpty">{empty}</div>
  return <div className="barList">{items.map((item,i)=>{
    const value = mode==='points' ? item.points : item.pct
    const width = mode==='points' ? Math.min(100,Math.max(8,item.points*8)) : Math.max(8,item.pct)
    return <div className="barRow" key={`${item.id}-${i}`}>
      <div className="barName"><b>{item.player}</b><small>{mode==='points'?`${item.count} manager${item.count===1?'':'s'}`:`${item.count}/${totalManagers} managers`}</small></div>
      <div className="barTrack"><span style={{width:`${width}%`}}/></div>
      <strong>{mode==='points'?`${item.points} pts`:`${value}%`}</strong>
    </div>
  })}</div>
}

export default function Home(){
  const [fplData,setFplData] = useState(null)
  const [fplStatus,setFplStatus] = useState('loading')
  const effectiveGameweeks = useMemo(()=>mergeGameweeks(fplData?.futureGameweeks),[fplData])
  const league = useMemo(()=>deriveLeague(effectiveGameweeks),[effectiveGameweeks])
  const [gw,setGw] = useState(league.latestGw)
  const [galleryGw,setGalleryGw] = useState(galleryGws.at(-1))

  useEffect(()=>{
    let active = true
    fetch('/api/fpl',{cache:'no-store'})
      .then(r=>r.json())
      .then(data=>{
        if(!active) return
        setFplData(data)
        setFplStatus(data?.ok?'ready':'fallback')
      })
      .catch(()=>{ if(active) setFplStatus('fallback') })
    return ()=>{active=false}
  },[])

  useEffect(()=>{ setGw(league.latestGw) },[league.latestGw])

  const selected = effectiveGameweeks[gw] || effectiveGameweeks[league.latestGw]
  const stats = fplData?.stats
  const liveReady = Boolean(fplData?.ok && fplData?.canAutoScore)
  const latestGalleryGw = galleryGws.at(-1)
  const latestGalleryItem = gallery[latestGalleryGw]?.[2] || gallery[latestGalleryGw]?.[0]
  const winCounts = Object.entries(league.winCounts).sort((a,b)=>b[1]-a[1])
  const mostWins = winCounts[0]

  const settlementGws = league.gwNumbers.filter(g=>g<=financialThroughGw)
  const statement = useMemo(()=>memberOrder.map(name=>{
    const values = settlementGws.map(g=>{
      const rank=effectiveGameweeks[g].findIndex(r=>r[0]===name)
      let value=payout[rank]??0
      if(miniGameSaves[g]===name && value<0) value=0
      return value
    })
    return {name,team:memberTeam[name],cash:values.reduce((a,b)=>a+b,0),values}
  }).sort((a,b)=>b.cash-a.cash),[effectiveGameweeks,settlementGws.join(',')])

  return <main id="top">
    <header className="siteHeader">
      <a className="logo" href="#top"><span className="lion">♛</span><b>FPL KICKOFF TODAY</b><em>2027</em></a>
      <nav className="navLinks">
        <a href="#competitions">Competitions</a><a href="#gameweek">GW</a><a href="#statistics">Statistics</a><a href="#gallery">Gallery</a><a href="#rules">Rules</a><a href="#finance">Finance</a>
      </nav>
      <span className="closedBadge">🔒 CLOSED LEAGUE</span>
    </header>

    <section className="hero heroV2">
      <div className="cloud c1"/><div className="cloud c2"/>
      <div className="heroText">
        <p className="eyebrow">SAMUT PRAKAN • PRIVATE FPL LEAGUE</p>
        <h1><span>FPL</span><b>KICKOFF</b><strong>TODAY</strong><em>2027</em></h1>
        <p className="heroSlogan">NEW SEASON. NEW DREAMS. SAME GOAL. <b>THE CROWN.</b></p>
        <div className="heroBadges"><span>👥 11 Managers</span><span>📅 GW1–GW{league.latestGw}</span><span>🏆 6 Competitions</span></div>
      </div>
      <div className="heroTrophy" aria-hidden="true">🏆</div>
      <div className="heroBottom">
        <article className="latestCard">
          <div className="cardLabel">LATEST STORY • GW{latestGalleryGw}</div>
          <img src={`/gallery/gw${latestGalleryGw}/${latestGalleryItem[0]}`} alt={`GW${latestGalleryGw} highlight`} />
          <div className="latestOverlay"><b>{latestGalleryItem[1]}</b><span>Season story • GW{latestGalleryGw}</span></div>
        </article>
        <article className="dashboardCard leaderboardCard">
          <div className="dashboardTitle"><b>🏆 LEAGUE TABLE</b><span>Top 4</span></div>
          <TopTable rows={league.cumulative}/>
          <div className="cardSource"><SourceBadge gw={league.latestGw} liveReady={liveReady}/></div>
        </article>
        <article className="dashboardCard miniHeroCard">
          <div className="dashboardTitle"><b>🎮 MINI GAME</b><span>GW5</span></div>
          <img src="/gallery/gw5/the-differential-picks.jpeg" alt="The Differential GW5" />
          <div className="miniHeroCopy"><b>The Differential</b><span>Jimmy 🤝 Guide • 5 pts</span></div>
          <a className="textLink" href="#mini-game">See Mini Game →</a>
        </article>
      </div>
      <div className="quickTiles">
        <a href="#full-season"><span>🏆</span><b>Full Season</b><small>{league.seasonLeader.name} leads • {league.seasonLeader.pts}</small></a>
        <a href="#gameweek"><span>⚽</span><b>Gameweek</b><small>GW{league.latestGw}: {league.latestWinner.name} • {league.latestWinner.pts}</small></a>
        <a href="#statistics"><span>📊</span><b>Statistics</b><small>FPL League {FPL_LEAGUE_ID} • live insights</small></a>
        <a href="#gallery"><span>🖼️</span><b>Gallery</b><small>GW1–GW{latestGalleryGw} season stories</small></a>
      </div>
    </section>

    <section className="section competitionSection" id="competitions">
      <div className="sectionIntroRow"><div><p className="sectionKicker">6 WAYS TO WIN</p><h2>การแข่งขันทั้งหมด</h2><p>แต่ละรายการมีสี บุคลิก กติกา ตารางคะแนน และรางวัลของตัวเองอย่างชัดเจน</p></div><div className="seasonProgress"><b>{league.latestGw}</b><span>/ 38 GW</span><small>Season progress</small></div></div>
      <div className="competitionGrid">{competitions.map(c=><CompetitionCard key={c.id} item={c}/>)}</div>
    </section>

    <section className="section competitionDetail goldPanel themeFull" id="full-season">
      <div className="detailHeading"><div><p className="sectionKicker">🏆 FULL SEASON</p><h2>ศึกใหญ่ทั้งฤดูกาล</h2><p>GW1–GW5 ใช้คะแนนที่เราล็อกไว้ • GW6 เป็นต้นไปต่อคะแนนจาก FPL อัตโนมัติ</p></div><div className="prizePill">Prize Pool ฿4,200</div></div>
      <div className="dataPolicy"><b>HYBRID SCORE SYSTEM</b><span>🔒 GW1–GW5 Locked</span><i>+</i><span>⚡ GW6+ FPL Auto</span></div>
      <div className="twoCol"><div><TopTable rows={league.cumulative} limit={11} title={`Overall after GW${league.latestGw}`}/></div><div className="ruleVisual"><img src="/rules/full-season.jpeg" alt="Full Season official rules"/><div className="ruleFacts"><b>รางวัล</b><span>🥇 ฿2,000</span><span>🥈 ฿1,200</span><span>🥉 ฿600</span><span>4th ฿400</span></div></div></div>
    </section>

    <section className="section competitionDetail bluePanel themeGw" id="gameweek">
      <div className="detailHeading"><div><p className="sectionKicker">⚽ GAMEWEEK</p><h2>Weekly Battle</h2><p>คะแนนย้อนหลัง GW1–5 ไม่เปลี่ยน และ Gameweek ใหม่จะต่อจาก FPL เมื่อข้อมูลครบทั้ง 11 คน</p></div><div><div className="prizePill">1st +120 • 2nd +60 • 3rd +30</div><SourceBadge gw={gw} liveReady={liveReady}/></div></div>
      <div className="gwTabs">{league.gwNumbers.map(n=><button key={n} className={gw===n?'active':''} onClick={()=>setGw(n)}>GW{n}</button>)}</div>
      <div className="twoCol">
        <div className="weeklyTable"><div className="weeklyHead"><span>#</span><span>Manager</span><span>Points</span></div>{selected.map(([name,team,pts],i)=><div className={`weeklyRow ${i<3?'podium':''}`} key={name}><span>{i+1}</span><div><b>{name}</b><small>{team}</small></div><strong>{pts}</strong></div>)}</div>
        <div className="ruleVisual"><img src="/rules/gameweek.jpeg" alt="Gameweek official rules"/><div className="ruleFacts compactFacts"><b>GW{gw} Leader</b><strong>{selected[0][0]} • {selected[0][2]} pts</strong><span>อันดับ 4 = ฿0</span><span>อันดับ 5–11 = −฿30</span></div></div>
      </div>
    </section>

    <section className="section splitChance">
      <article className="chanceCard first" id="first-chance"><div className="chanceTop"><span>🎯</span><div><p>FIRST CHANCE</p><h2>GW1–GW19</h2></div></div><p>ครึ่งฤดูกาลแรก ใช้ระบบคะแนน Hybrid เดียวกับ Full Season</p><TopTable rows={league.firstChanceRows}/><div className="chancePrize"><b>฿700</b><span>350 / 200 / 150</span></div></article>
      <article className="chanceCard second" id="second-chance"><div className="chanceTop"><span>🔥</span><div><p>SECOND CHANCE</p><h2>GW20–GW38</h2></div></div>{league.secondChanceGws.length===0 ? <div className="notStarted"><b>RESET AFTER GW19</b><span>ยังไม่เริ่มการแข่งขัน</span><small>ทุกคนกลับมาเริ่มใหม่ด้วยโอกาสเท่ากัน</small></div> : <TopTable rows={league.secondChanceRows}/>}<div className="chancePrize"><b>฿700</b><span>350 / 200 / 150</span></div></article>
    </section>

    <section className="section competitionDetail luckyPanel themeLucky" id="lucky-game">
      <div className="detailHeading"><div><p className="sectionKicker">🍀 LUCKY GAME</p><h2>5 Lucky Rewards</h2><p>เกมดวงสำหรับเหตุการณ์พิเศษตลอดฤดูกาล</p></div><div className="prizePill">฿220 / Reward</div></div>
      <div className="luckyLayout"><div className="luckyList">{luckyConditions.map(c=><div className={c.claimed?'claimed':''} key={c.id}><span>{c.id}</span><b>{c.label}</b><em>{c.claimed?'CLAIMED':'AVAILABLE'}</em></div>)}</div><div className="ruleVisual"><img src="/rules/lucky-game-current.jpeg" alt="Lucky Game current status"/><div className="ruleFacts"><b>Current status</b><span>Claimed: #3 & #5</span><span>Remaining: #1, #2, #4</span></div></div></div>
    </section>

    <section className="section competitionDetail miniPanel themeMini" id="mini-game">
      <div className="detailHeading"><div><p className="sectionKicker">🎮 MINI GAME</p><h2>Different Game. Different Week.</h2><p>รูปแบบเปลี่ยนได้ตลอด — GW1–4 เกมปริศนา, GW5 The Differential และอนาคตอาจเป็นเกมใหม่</p></div><div className="prizePill">FORMAT CHANGES</div></div>
      <div className="miniTimeline"><div><b>GW1–GW4</b><span>เกมปริศนาทายภาพ</span><small>ช่วงนี้ออกแบบเป็นเกมช่วยผู้แพ้ประจำสัปดาห์</small></div><i>→</i><div><b>GW5</b><span>The Differential</span><small>เปิดให้ทุกคนเล่นได้</small></div><i>→</i><div><b>NEXT</b><span>New Format</span><small>เปลี่ยนได้ตามไอเดียของลีก</small></div></div>
      <div className="winnerGrid">{miniWinners.map(w=><figure key={w.gw}><img src={w.image} alt={`GW${w.gw} Mini Game winner ${w.winner}`}/><figcaption><b>GW{w.gw} • {w.winner}</b><span>Answer: {w.answer}</span></figcaption></figure>)}</div>
      <div className="diffResult"><img src="/games/the-diff-gw5.png" alt="The Differential GW5 result"/><div><small>GW5 • THE DIFFERENTIAL</small><h3>Jimmy 🤝 Guide</h3><p>Iwobi 5 pts vs Mykolenko 5 pts — Tie</p></div></div>
    </section>

    <section className="section statsSection" id="statistics">
      <div className="sectionIntroRow"><div><p className="sectionKicker">📊 FPL LIVE DATA</p><h2>League Statistics</h2><p>สถิติจาก FPL League {FPL_LEAGUE_ID} ใช้เพื่อวิเคราะห์ลีกทันที โดยไม่เขียนทับคะแนน GW1–GW5 ที่ล็อกไว้</p></div><div className={`apiBadge ${fplStatus}`}><b>{fplStatus==='ready'?'LIVE CONNECTED':fplStatus==='loading'?'CONNECTING…':'FALLBACK MODE'}</b><span>{fplData?.matchedCount ?? 0}/11 managers linked</span></div></div>

      <div className="statsPolicy">
        <div><span>🔒</span><b>Score History</b><small>GW1–GW5 ใช้ข้อมูลที่คุณกำหนดเท่านั้น</small></div>
        <div><span>⚡</span><b>Future Scores</b><small>GW6+ ดึงจาก FPL เมื่อข้อมูลครบทั้ง 11 คน</small></div>
        <div><span>📡</span><b>Statistics</b><small>Captain, Bench, Chips, Transfers, Ownership ใช้ FPL ได้ทันที</small></div>
      </div>

      {stats?.available ? <>
        <div className="statsHeadline"><div><small>STAT GAMEWEEK</small><strong>GW{stats.gw}</strong></div><div><small>MOST GW WINS</small><strong>{mostWins?.[0] || '—'} <em>{mostWins?.[1] || 0}</em></strong></div><div><small>SEASON LEADER</small><strong>{league.seasonLeader.name} <em>{league.seasonLeader.pts}</em></strong></div><div><small>AUTO SCORE</small><strong>{fplData?.canAutoScore?'READY':'WAITING'}</strong></div></div>
        <div className="statsGrid">
          <article className="statsCard owned"><div className="statsCardHead"><span>👥</span><div><b>Most Owned</b><small>ผู้เล่นที่อยู่ในทีมเพื่อนเรามากที่สุด • GW{stats.gw}</small></div></div><BarList items={stats.mostOwned} totalManagers={stats.managerCount || 11}/></article>
          <article className="statsCard captain"><div className="statsCardHead"><span>©️</span><div><b>Captain Popularity</b><small>กัปตันยอดนิยมในลีก • GW{stats.gw}</small></div></div><BarList items={stats.captainPopularity} totalManagers={stats.managerCount || 11}/></article>
          <article className="statsCard diff"><div className="statsCardHead"><span>💎</span><div><b>Differential Watch</b><small>ถือไม่เกิน 2 คน เรียงตามแต้ม GW{stats.gw}</small></div></div><BarList items={stats.differentials} mode="points" totalManagers={stats.managerCount || 11}/></article>
        </div>
        <div className="managerStatsWrap">
          <div className="managerStatsHead"><span>Manager</span><span>GW Pts</span><span>Captain</span><span>Bench</span><span>Transfers</span><span>Chip</span></div>
          {stats.managerStats.map(row=><div className="managerStatsRow" key={row.name}><div><b>{row.name}</b><small>{row.team}</small></div><strong>{row.points}</strong><span>{row.captain}<small>{row.captainPoints ? ` • ${row.captainPoints} pts` : ''}</small></span><span>{row.benchPoints}</span><span>{row.transfers}{row.transferCost?` (-${row.transferCost})`:''}</span><span className={row.chip?'chipOn':'chipOff'}>{row.chip || '—'}</span></div>)}
        </div>
      </> : <div className="statsUnavailable"><b>{fplStatus==='loading'?'กำลังเชื่อม FPL…':'เว็บหลักยังใช้งานได้ตามปกติ'}</b><p>{fplStatus==='loading'?'กำลังโหลดข้อมูลลีกและสถิติ':'ถ้า FPL API ใช้งานไม่ได้ชั่วคราว คะแนน GW1–GW5, Rules, Gallery, Finance และ Mini Game จะยังแสดงจากข้อมูลในเว็บเหมือนเดิม'}</p></div>}
      {fplData?.unmatched?.length>0 && <div className="matchWarning"><b>⚠️ พบทีม FPL ที่ยังจับคู่ชื่อไม่ได้</b><span>{fplData.unmatched.map(x=>x.team).join(', ')}</span></div>}
    </section>

    <section className="section gallerySection themeGallery" id="gallery">
      <div className="sectionIntroRow"><div><p className="sectionKicker">🖼️ FPL ARCHIVE</p><h2>Season Story</h2><p>โปสเตอร์ เหตุการณ์สำคัญ และเรื่องราวของแต่ละ Gameweek</p></div><div className="galleryCount">{totalGallery}<br/><span>Story artworks</span></div></div>
      <div className="gwTabs galleryTabs">{galleryGws.map(n=><button key={n} className={galleryGw===n?'active':''} onClick={()=>setGalleryGw(n)}>GW{n}</button>)}</div>
      <div className="galleryGrid">{gallery[galleryGw].map(([file,title])=><figure key={file}><img loading="lazy" src={`/gallery/gw${galleryGw}/${file}`} alt={title}/><figcaption><b>{title}</b><span>GW{galleryGw} • FPL Kickoff Today 2027</span></figcaption></figure>)}</div>
    </section>

    <section className="section rulesSection themeRules" id="rules">
      <div className="sectionIntroRow"><div><p className="sectionKicker">📜 OFFICIAL RULES</p><h2>Rules Archive</h2><p>กติกาหลัก + เวอร์ชันปัจจุบัน เก็บประวัติไว้ชัดเจน</p></div><div className="officialTag">OFFICIAL</div></div>
      <div className="rulesGrid">
        <figure><img src="/rules/official-overview.jpeg" alt="Official rules overview"/><figcaption><b>Official Overview</b><span>ภาพรวมการแข่งขันและเงินรางวัล</span></figcaption></figure>
        <figure><img src="/rules/gameweek.jpeg" alt="Gameweek rules"/><figcaption><b>Gameweek</b><span>Weekly payout + Mini Game Save รุ่นเดิม</span></figcaption></figure>
        <figure><img src="/rules/first-second-chance.jpeg" alt="First and Second Chance rules"/><figcaption><b>First / Second Chance</b><span>GW1–19 / GW20–38</span></figcaption></figure>
        <figure><img src="/rules/full-season.jpeg" alt="Full season rules"/><figcaption><b>Full Season</b><span>End-of-season prize system</span></figcaption></figure>
        <figure><img src="/rules/mini-game-legacy.jpeg" alt="Old Mini Game rules"/><figcaption><b>Mini Game — GW1–GW4</b><span>Archived format: เกมช่วยผู้แพ้</span></figcaption></figure>
        <figure><img src="/rules/lucky-game-current.jpeg" alt="Lucky Game current rules"/><figcaption><b>Lucky Game — Current</b><span>สถานะล่าสุด #3 และ #5 ถูกใช้แล้ว</span></figcaption></figure>
      </div>
    </section>

    <section className="section financeSection" id="finance">
      <div className="sectionIntroRow"><div><p className="sectionKicker">💰 FINANCE</p><h2>Manager Financial</h2><p>การเงินยังเป็นข้อมูล Custom ของลีก และไม่ให้ FPL API เปลี่ยนแปลงอัตโนมัติ</p></div><div className="officialTag greenTag">THROUGH GW{financialThroughGw}</div></div>
      <div className="financeTop">{topFinancial.slice(0,4).map((p,i)=><article key={p.name}><span>#{i+1}</span><h3>{p.name}</h3><small>{p.team}</small><Money value={p.cash}/></article>)}</div>
      <div className="financeTable"><div className="financeHead"><span>Manager</span><span>Cash Flow</span><span>Lucky Pool</span><span>GW</span><span>Mini</span><span>Lucky</span></div>{topFinancial.map(p=><div className="financeRow" key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/><Money value={p.luckyPool}/><Money value={p.gwWon+p.gwLost}/><Money value={p.mini}/><Money value={p.lucky}/></div>)}</div>
      <details className="statementDetails"><summary>ดู Gameweek Statement GW1–GW{financialThroughGw}</summary><div className="statementTable"><div className="statementHead" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}}><span>Manager</span><span>Total</span>{settlementGws.map(g=><span key={g}>GW{g}</span>)}</div>{statement.map(p=><div className="statementRow" style={{gridTemplateColumns:`1.4fr .7fr repeat(${settlementGws.length},.7fr)`}} key={p.name}><div><b>{p.name}</b><small>{p.team}</small></div><Money value={p.cash}/>{p.values.map((v,i)=><span key={i} className="statementCell"><Money value={v}/>{miniGameSaves[settlementGws[i]]===p.name&&<em>SAVE</em>}</span>)}</div>)}</div></details>
      <p className="privacy">🔒 เว็บสาธารณะนี้ไม่แสดงเลขบัญชี ธนาคาร หรือช่องทางการชำระเงินส่วนบุคคล</p>
    </section>

    <footer><div className="footerLogo">FPL <b>KICKOFF TODAY</b> 2027</div><p>SAME GAME. DIFFERENT STORIES. ONE LEAGUE.</p><a href="#top">Back to top ↑</a></footer>
  </main>
}
