'use client'

import { useMemo, useState } from 'react'

const gameweeks = {
  1: [
    ['Kun','IREN & NEBIUS FC',70],['Amp','amplongdo',62],['Ohm',"Wasuwit's Team",62],['Pee','B3RLIN',61],['Fluk','3ERLIN',58],['Oat','KaisungVAT',53],['Arm','Arm',52],['Deer','ทีมของวิทยา',51],['Guide',"G9inez's Team",49],['Jimmy','xROTzx',45],['Best','USO BEST',34],
  ],
  2: [
    ['Guide',"G9inez's Team",117],['Pee','B3RLIN',112],['Fluk','3ERLIN',108],['Kun','IREN & NEBIUS FC',108],['Deer','ทีมของวิทยา',96],['Best','USO BEST',94],['Jimmy','xROTzx',93],['Amp','amplongdo',84],['Ohm',"Wasuwit's Team",84],['Arm','Arm',83],['Oat','KaisungVAT',74],
  ],
  3: [
    ['Amp','amplongdo',73],['Ohm',"Wasuwit's Team",70],['Guide',"G9inez's Team",69],['Deer','ทีมของวิทยา',59],['Kun','IREN & NEBIUS FC',58],['Pee','B3RLIN',54],['Best','USO BEST',53],['Oat','KaisungVAT',41],['Arm','Arm',41],['Fluk','3ERLIN',40],['Jimmy','xROTzx',39],
  ],
  4: [
    ['Best','USO BEST',92],['Kun','IREN & NEBIUS FC',92],['Fluk','3ERLIN',90],['Ohm',"Wasuwit's Team",87],['Pee','B3RLIN',85],['Oat','KaisungVAT',78],['Deer','ทีมของวิทยา',68],['Guide',"G9inez's Team",62],['Arm','Arm',61],['Amp','amplongdo',50],['Jimmy','xROTzx',48],
  ],
  5: [
    ['Amp','amplongdo',59],['Deer','ทีมของวิทยา',54],['Ohm',"Wasuwit's Team",46],['Arm','Arm',44],['Guide',"G9inez's Team",43],['Fluk','3ERLIN',42],['Best','USO BEST',40],['Kun','IREN & NEBIUS FC',40],['Jimmy','xROTzx',40],['Pee','B3RLIN',38],['Oat','KaisungVAT',31],
  ],
}

const statement = [
  {name:'Amp',team:'amplongdo',cash:240,gws:[60,-30,120,-30,120]},
  {name:'Guide',team:"G9inez's Team",cash:90,gws:[0,120,30,-30,-30],save:1},
  {name:'Kun',team:'IREN & NEBIUS FC',cash:120,gws:[120,0,-30,60,-30]},
  {name:'Ohm',team:"Wasuwit's Team",cash:120,gws:[30,0,60,0,30],save:2},
  {name:'Pee',team:'B3RLIN',cash:0,gws:[0,60,0,-30,-30],save:3},
  {name:'Deer',team:'ทีมของวิทยา',cash:0,gws:[-30,-30,0,0,60],save:4},
  {name:'Best',team:'USO BEST',cash:0,gws:[-30,-30,-30,120,-30]},
  {name:'Fluk',team:'3ERLIN',cash:-30,gws:[-30,30,-30,30,-30]},
  {name:'Oat',team:'KaisungVAT',cash:-150,gws:[-30,-30,-30,-30,-30]},
  {name:'Arm',team:'Arm',cash:-120,gws:[-30,-30,-30,-30,0]},
  {name:'Jimmy',team:'xROTzx',cash:-150,gws:[-30,-30,-30,-30,-30]},
]

const financial = [
  {name:'Best',team:'USO BEST',cash:120,luckyPool:-100,gwWon:120,gwLost:-120,mini:0,lucky:220},
  {name:'Amp',team:'amplongdo',cash:110,luckyPool:-100,gwWon:300,gwLost:-90,mini:0,lucky:0},
  {name:'Kun',team:'IREN & NEBIUS FC',cash:50,luckyPool:-100,gwWon:180,gwLost:-30,mini:0,lucky:0},
  {name:'Guide',team:"G9inez's Team",cash:50,luckyPool:-100,gwWon:150,gwLost:-60,mini:60,lucky:0},
  {name:'Ohm',team:"Wasuwit's Team",cash:20,luckyPool:-100,gwWon:120,gwLost:-30,mini:30,lucky:0},
  {name:'Oat',team:'KaisungVAT',cash:-30,luckyPool:-100,gwWon:0,gwLost:-150,mini:0,lucky:220},
  {name:'Pee',team:'B3RLIN',cash:-100,luckyPool:-100,gwWon:60,gwLost:-90,mini:30,lucky:0},
  {name:'Deer',team:'ทีมของวิทยา',cash:-100,luckyPool:-100,gwWon:60,gwLost:-90,mini:30,lucky:0},
  {name:'Fluk',team:'3ERLIN',cash:-130,luckyPool:-100,gwWon:60,gwLost:-90,mini:0,lucky:0},
  {name:'Jimmy',team:'xROTzx',cash:-220,luckyPool:-100,gwWon:0,gwLost:-150,mini:30,lucky:0},
  {name:'Arm',team:'Arm',cash:-220,luckyPool:-100,gwWon:0,gwLost:-120,mini:0,lucky:0},
]

const memberOrder = ['Kun','Amp','Ohm','Pee','Fluk','Oat','Arm','Deer','Guide','Jimmy','Best']
const memberTeam = Object.fromEntries(gameweeks[1].map(([n,t]) => [n,t]))

const cumulative = memberOrder.map((name) => {
  const pts = Object.values(gameweeks).reduce((sum, rows) => sum + (rows.find(r => r[0] === name)?.[2] || 0), 0)
  return {name, team:memberTeam[name], pts}
}).sort((a,b) => b.pts-a.pts)

const weeklyWinners = Object.entries(gameweeks).map(([gw, rows]) => ({gw:Number(gw), name:rows[0][0], team:rows[0][1], pts:rows[0][2]}))

function Money({value}) {
  const cls = value > 0 ? 'money pos' : value < 0 ? 'money neg' : 'money zero'
  return <span className={cls}>{value > 0 ? '+' : ''}{value}</span>
}

function Kpi({label,value,note}) {
  return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

export default function Home(){
  const [gw, setGw] = useState(5)
  const selected = gameweeks[gw]
  const topFinancial = useMemo(() => [...financial].sort((a,b)=>b.cash-a.cash),[])
  const seasonLeader = cumulative[0]
  const currentWinner = weeklyWinners.find(w=>w.gw===5)

  return <main>
    <header className="hero" id="top">
      <nav className="nav">
        <div className="brand"><b>FPL</b><span>KICKOFF TODAY</span><em>2027</em></div>
        <div className="navlinks"><a href="#gameweeks">Gameweeks</a><a href="#finance">Finance</a><a href="#games">Mini Games</a><a href="#gallery">Gallery</a></div>
      </nav>

      <div className="heroCopy">
        <div>
          <p className="eyebrow">PRIVATE LEAGUE DASHBOARD • VERIFIED THROUGH GW5</p>
          <h1>One league.<br/><i>All the chaos.</i></h1>
          <p className="lead">คะแนน Gameweek, เงินได้เสีย, Mini Game และ Gallery ของ FPL Kickoff Today 2027 รวมไว้ในหน้าเดียว โดยไม่แสดงข้อมูลบัญชีธนาคารบนเว็บสาธารณะ</p>
        </div>
        <div className="heroCard">
          <p>LEADER AFTER 5 GWs</p>
          <strong>{seasonLeader.name}</strong>
          <span>{seasonLeader.team}</span>
          <div className="heroScore">{seasonLeader.pts}<small> pts</small></div>
          <div className="heroMeta"><b>GW5 winner</b><span>{currentWinner.name} • {currentWinner.pts} pts</span></div>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Managers" value="11" note="complete roster"/>
        <Kpi label="Completed" value="GW1–GW5" note="weekly points verified"/>
        <Kpi label="Top cash flow" value="+120" note="Best"/>
        <Kpi label="Most GW wins" value="2" note="Amp"/>
      </div>
    </header>

    <section className="section" id="gameweeks">
      <div className="sectionTitle"><div><p className="eyebrow">WEEKLY SCOREBOARD</p><h2>Gameweek Results</h2></div><span className="verified">✓ คะแนน GW ยึดตาม Master Data</span></div>
      <div className="gwTabs">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setGw(n)} className={gw===n?'active':''}>GW{n}</button>)}</div>
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

      <div className="sectionTitle compact"><div><p className="eyebrow">5-GW TOTAL</p><h3>Cumulative points</h3></div><span className="muted">ผลรวมจากคะแนน GW1–GW5</span></div>
      <div className="leaderboard">
        {cumulative.map((p,i)=><div className="leaderRow" key={p.name}><span>{i+1}</span><div><b>{p.name}</b><small>{p.team}</small></div><div className="bar"><i style={{width:`${Math.round(p.pts/seasonLeader.pts*100)}%`}}/></div><strong>{p.pts}</strong></div>)}
      </div>
    </section>

    <section className="section financeSection" id="finance">
      <div className="sectionTitle"><div><p className="eyebrow">MONEY BOARD</p><h2>Manager Financial</h2></div><span className="verified">✓ Reconciled</span></div>
      <p className="sectionIntro">Cash Flow = Lucky Pool + GW Won + GW Lost + Mini Game + Lucky Game. ตัวเลขด้านล่างตรวจแล้วตรงกับตารางต้นฉบับทั้ง 11 คน</p>
      <div className="financeCards">{topFinancial.slice(0,4).map((p,i)=><article key={p.name}><span>#{i+1}</span><h3>{p.name}</h3><small>{p.team}</small><Money value={p.cash}/></article>)}</div>
      <div className="wideTable financeTable">
        <div className="wideHead"><span>Manager</span><span>Cash Flow</span><span>Lucky Pool</span><span>GW Won</span><span>GW Lost</span><span>Mini Game</span><span>Lucky Game</span></div>
        {financial.map(p=><div className="wideRow" key={p.name}><span><b>{p.name}</b><small>{p.team}</small></span><Money value={p.cash}/><Money value={p.luckyPool}/><Money value={p.gwWon}/><Money value={p.gwLost}/><Money value={p.mini}/><Money value={p.lucky}/></div>)}
      </div>

      <div className="sectionTitle compact"><div><p className="eyebrow">WEEKLY CASH</p><h3>Gameweek Statement</h3></div><span className="muted">+120 / +60 / +30 / 0 / −30 พร้อม Mini Game Save</span></div>
      <div className="statement">
        <div className="statementHead"><span>Manager</span><span>Cash</span>{[1,2,3,4,5].map(n=><span key={n}>GW{n}</span>)}</div>
        {statement.map(p=><div className="statementRow" key={p.name}><span><b>{p.name}</b><small>{p.team}</small></span><Money value={p.cash}/>{p.gws.map((v,i)=><span className="statementCell" key={i}><Money value={v}/>{p.save===i+1&&<em>SAVE</em>}</span>)}</div>)}
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

    <footer><div className="brand"><b>FPL</b><span>KICKOFF TODAY</span><em>2027</em></div><p>Private league dashboard • Data through GW5</p><a href="#top">Back to top ↑</a></footer>
  </main>
}
