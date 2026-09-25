'use client'

import { useMemo, useState } from 'react'
import { financial, financialThroughGw, gameweeks, members, miniGameSaves } from './league-data'

const gwNumbers = Object.keys(gameweeks).map(Number).sort((a,b) => a-b)
const latestGw = gwNumbers[gwNumbers.length - 1]
const memberOrder = members.map(([name]) => name)
const memberTeam = Object.fromEntries(members)

const cumulative = memberOrder.map((name) => {
  const pts = gwNumbers.reduce((sum, gw) => sum + (gameweeks[gw].find(r => r[0] === name)?.[2] || 0), 0)
  return {name, team:memberTeam[name], pts}
}).sort((a,b) => b.pts-a.pts)

const weeklyWinners = gwNumbers.map((gw) => ({gw, name:gameweeks[gw][0][0], team:gameweeks[gw][0][1], pts:gameweeks[gw][0][2]}))

const winCounts = weeklyWinners.reduce((acc, winner) => {
  acc[winner.name] = (acc[winner.name] || 0) + 1
  return acc
}, {})
const mostWins = Object.entries(winCounts).sort((a,b) => b[1]-a[1])[0]

const weeklyPayout = [120, 60, 30, 0, -30, -30, -30, -30, -30, -30, -30]
const statement = memberOrder.map((name) => {
  const gws = gwNumbers.map((gw) => {
    const rank = gameweeks[gw].findIndex(row => row[0] === name)
    let value = weeklyPayout[rank] ?? 0
    if (miniGameSaves[gw] === name && value < 0) value = 0
    return value
  })
  return {name, team:memberTeam[name], cash:gws.reduce((a,b)=>a+b,0), gws}
}).sort((a,b) => b.cash-a.cash)

function Money({value}) {
  const cls = value > 0 ? 'money pos' : value < 0 ? 'money neg' : 'money zero'
  return <span className={cls}>{value > 0 ? '+' : ''}{value}</span>
}

function Kpi({label,value,note}) {
  return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

export default function Home(){
  const [gw, setGw] = useState(latestGw)
  const selected = gameweeks[gw]
  const topFinancial = useMemo(() => [...financial].sort((a,b)=>b.cash-a.cash),[])
  const seasonLeader = cumulative[0]
  const currentWinner = weeklyWinners.find(w=>w.gw===latestGw)
  const topCash = topFinancial[0]

  return <main>
    <header className="hero" id="top">
      <nav className="nav">
        <div className="brand"><b>FPL</b><span>KICKOFF TODAY</span><em>2027</em></div>
        <div className="navlinks"><a href="#gameweeks">Gameweeks</a><a href="#finance">Finance</a><a href="#games">Mini Games</a><a href="#gallery">Gallery</a></div>
      </nav>

      <div className="heroCopy">
        <div>
          <p className="eyebrow">PRIVATE LEAGUE DASHBOARD • VERIFIED THROUGH GW{latestGw}</p>
          <h1>One league.<br/><i>All the chaos.</i></h1>
          <p className="lead">คะแนน Gameweek, เงินได้เสีย, Mini Game และ Gallery ของ FPL Kickoff Today 2027 รวมไว้ในหน้าเดียว โดยไม่แสดงข้อมูลบัญชีธนาคารบนเว็บสาธารณะ</p>
        </div>
        <div className="heroCard">
          <p>LEADER AFTER {latestGw} GWs</p>
          <strong>{seasonLeader.name}</strong>
          <span>{seasonLeader.team}</span>
          <div className="heroScore">{seasonLeader.pts}<small> pts</small></div>
          <div className="heroMeta"><b>GW{latestGw} winner</b><span>{currentWinner.name} • {currentWinner.pts} pts</span></div>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Managers" value={String(members.length)} note="complete roster"/>
        <Kpi label="Completed" value={`GW1–GW${latestGw}`} note="weekly points verified"/>
        <Kpi label={`Top cash flow • GW${financialThroughGw}`} value={`${topCash.cash > 0 ? '+' : ''}${topCash.cash}`} note={topCash.name}/>
        <Kpi label="Most GW wins" value={String(mostWins?.[1] || 0)} note={mostWins?.[0] || '—'}/>
      </div>
    </header>

    <section className="section" id="gameweeks">
      <div className="sectionTitle"><div><p className="eyebrow">WEEKLY SCOREBOARD</p><h2>Gameweek Results</h2></div><span className="verified">✓ คะแนน GW ยึดตาม Master Data</span></div>
      <div className="gwTabs">{gwNumbers.map(n=><button key={n} onClick={()=>setGw(n)} className={gw===n?'active':''}>GW{n}</button>)}</div>
      <div className="scoreGrid">
        <div className="resultsCard">
          <div className="tableHead"><span>#</span><span>Manager / Team</span><span>Points</span></div>
          {selected.map(([name,team,pts],i)=><div className={`resultRow ${i<3?'podium':''}`} key={name}><span className="rank">{i+1}</span><div><b>{name}</b><small>{team}</small></div><strong>{pts}</strong></div>)}
        </div>
        <aside className="winnerCard">
          <span className="crown">♛</span><p>GAMEWEEK {gw}</p><h3>{selected[0][0]}</h3><small>{selected[0][1]}</small><div className="winnerPts">{selected[0][2]}<span>pts</span></div>
          <div className="podiumLine"><span>2ND <b>{selected[1][0]}</b></span><span>3RD <b>{selected[2][0]}</b></span></div>
        </aside>
      </div>

      <div className="sectionTitle compact"><div><p className="eyebrow">{latestGw}-GW TOTAL</p><h3>Cumulative points</h3></div><span className="muted">ผลรวมจากคะแนน GW1–GW{latestGw}</span></div>
      <div className="leaderboard">
        {cumulative.map((p,i)=><div className="leaderRow" key={p.name}><span>{i+1}</span><div><b>{p.name}</b><small>{p.team}</small></div><div className="bar"><i style={{width:`${Math.round(p.pts/seasonLeader.pts*100)}%`}}/></div><strong>{p.pts}</strong></div>)}
      </div>
    </section>

    <section className="section financeSection" id="finance">
      <div className="sectionTitle"><div><p className="eyebrow">MONEY BOARD • THROUGH GW{financialThroughGw}</p><h2>Manager Financial</h2></div><span className="verified">✓ Reconciled through GW{financialThroughGw}</span></div>
      <p className="sectionIntro">Financial เป็นข้อมูลแยกจากคะแนน FPL เพราะมี Lucky Pool, Mini Game และ Lucky Game รวมอยู่ด้วย จึงจะแสดงถึง GW{financialThroughGw} จนกว่าจะอัปเดตข้อมูลการเงินรอบใหม่</p>
      <div className="financeCards">{topFinancial.slice(0,4).map((p,i)=><article key={p.name}><span>#{i+1}</span><h3>{p.name}</h3><small>{p.team}</small><Money value={p.cash}/></article>)}</div>
      <div className="wideTable financeTable">
        <div className="wideHead"><span>Manager</span><span>Cash Flow</span><span>Lucky Pool</span><span>GW Won</span><span>GW Lost</span><span>Mini Game</span><span>Lucky Game</span></div>
        {financial.map(p=><div className="wideRow" key={p.name}><span><b>{p.name}</b><small>{p.team}</small></span><Money value={p.cash}/><Money value={p.luckyPool}/><Money value={p.gwWon}/><Money value={p.gwLost}/><Money value={p.mini}/><Money value={p.lucky}/></div>)}
      </div>

      <div className="sectionTitle compact"><div><p className="eyebrow">WEEKLY CASH • THROUGH GW{latestGw}</p><h3>Gameweek Statement</h3></div><span className="muted">+120 / +60 / +30 / 0 / −30 พร้อม Mini Game Save</span></div>
      <div className="statement">
        <div className="statementHead" style={{gridTemplateColumns:`1.6fr .8fr repeat(${latestGw}, .75fr)`}}><span>Manager</span><span>Cash</span>{gwNumbers.map(n=><span key={n}>GW{n}</span>)}</div>
        {statement.map(p=><div className="statementRow" style={{gridTemplateColumns:`1.6fr .8fr repeat(${latestGw}, .75fr)`}} key={p.name}><span><b>{p.name}</b><small>{p.team}</small></span><Money value={p.cash}/>{p.gws.map((v,i)=><span className="statementCell" key={i}><Money value={v}/>{miniGameSaves[gwNumbers[i]]===p.name&&<em>SAVE</em>}</span>)}</div>)}
      </div>
      <p className="privacy">🔒 Bank account / payment-channel details from the source sheet are intentionally excluded from this public dashboard.</p>
    </section>

    <section className="section" id="games">
      <div className="sectionTitle"><div><p className="eyebrow">SIDE QUESTS</p><h2>Mini Games</h2></div></div>
      <div className="gameCards">
        <article className="gameCard diff"><div className="gameTag">THE DIFF • GW5</div><h3>Jimmy 🤝 Guide</h3><p>Winner — Tie</p><div className="versus"><span><b>Iwobi</b><strong>5</strong><small>pts</small></span><i>5–5</i><span><b>Mykolenko</b><strong>5</strong><small>pts</small></span></div></article>
        <article className="gameCard lucky"><div className="gameTag">LUCKY GAME • GW4</div><h3>Best 🍀</h3><p>Winner from Matty Cash</p><div className="luckyScore">−1 <small>pt</small></div><div className="luckyStatus"><span>1</span><span>2</span><span className="claimed">3</span><span>4</span><span className="claimed">5</span></div><small>Prize #3 and #5 have been claimed.</small></article>
      </div>
    </section>

    <section className="section gallerySection" id="gallery">
      <div className="sectionTitle"><div><p className="eyebrow">FPL GALLERY</p><h2>Season artwork</h2></div><span className="muted">Latest posters</span></div>
      <div className="galleryGrid">
        <figure><img src="/the-diff-gw5.png" alt="The Diff GW5 Jimmy and Guide"/><figcaption><b>The Diff GW5</b><span>Jimmy & Guide • 5–5</span></figcaption></figure>
        <figure><img src="/lucky-game-gw4.png" alt="Lucky Game GW4 Best"/><figcaption><b>Lucky Game GW4</b><span>Best • Matty Cash −1</span></figcaption></figure>
        <div className="placeholder"><span>+</span><b>Next poster</b><small>Breaking News / Top 4 / Card Activated</small></div>
      </div>
    </section>

    <footer><div className="brand"><b>FPL</b><span>KICKOFF TODAY</span><em>2027</em></div><p>Private league dashboard • Score data through GW{latestGw} • Finance through GW{financialThroughGw}</p><a href="#top">Back to top ↑</a></footer>
  </main>
}
