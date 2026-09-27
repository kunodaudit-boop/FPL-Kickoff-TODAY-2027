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

function ToyScene({type,compact=false,banner=false}){
  const cls=`toyScene toyScene-${type} ${compact?'compact':''} ${banner?'banner':''}`
  const common={viewBox:'0 0 360 180',role:'presentation','aria-hidden':'true'}
  if(type==='woody') return <div className={cls}><svg {...common}>
    <rect x="0" y="0" width="360" height="180" rx="24" fill="#f8df9d"/>
    <path d="M0 132 C74 104 142 116 208 94 C270 74 318 84 360 66 V180 H0Z" fill="#d59a43" opacity=".52"/>
    <path d="M230 27 C255 12 301 17 325 37 C312 44 300 48 281 49 C256 50 238 43 230 27Z" fill="#7c421f"/>
    <path d="M251 29 C263 0 300 1 313 31 C296 38 269 38 251 29Z" fill="#9d5c2e"/>
    <circle cx="285" cy="94" r="38" fill="none" stroke="#a96b2c" strokeWidth="8"/>
    <path d="M285 56 C314 70 329 102 311 126" fill="none" stroke="#a96b2c" strokeWidth="7" strokeLinecap="round"/>
    <g transform="translate(60 35)"><path d="M43 0 L54 25 L82 28 L61 47 L67 75 L43 61 L19 75 L25 47 L4 28 L32 25Z" fill="#ffd64e" stroke="#9a6700" strokeWidth="5"/><text x="43" y="43" textAnchor="middle" fontSize="12" fontWeight="900" fill="#7b5100">SHERIFF</text></g>
    <g transform="translate(20 118)"><rect width="118" height="30" rx="8" fill="#fff1c9" stroke="#8a5321" strokeWidth="3"/><text x="59" y="20" textAnchor="middle" fontSize="13" fontWeight="900" fill="#6b3c18">SEASON TRAIL</text></g>
  </svg></div>
  if(type==='buzz') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#dff6ff"/><circle cx="300" cy="40" r="22" fill="#a874ef" opacity=".9"/>
    <g opacity=".7" fill="#fff"><circle cx="56" cy="35" r="4"/><circle cx="94" cy="24" r="3"/><circle cx="329" cy="88" r="3"/><circle cx="265" cy="19" r="2"/></g>
    <g transform="translate(95 18)"><path d="M84 8 C120 42 123 92 84 137 C45 92 48 42 84 8Z" fill="#fff" stroke="#7147c8" strokeWidth="6"/><path d="M84 13 C106 44 106 72 84 97 C62 72 62 44 84 13Z" fill="#91efb2"/><circle cx="84" cy="54" r="16" fill="#4b8bf6"/><path d="M57 70 L15 104 L61 105Z" fill="#8b5be0"/><path d="M111 70 L153 104 L107 105Z" fill="#8b5be0"/><path d="M67 134 L54 160 L78 149Z" fill="#59d978"/><path d="M101 134 L114 160 L90 149Z" fill="#59d978"/></g>
    <path d="M25 140 C90 91 145 89 205 108 C250 122 298 116 338 81" fill="none" stroke="#7147c8" strokeWidth="4" strokeDasharray="8 8" opacity=".55"/>
    <text x="24" y="38" fontSize="13" fontWeight="900" fill="#31587d">WEEKLY MISSION</text>
  </svg></div>
  if(type==='jessie') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="22" fill="#0c789c"/>
    <path d="M208 35 C229 13 277 15 307 37 C292 49 266 57 231 51 C220 49 211 43 208 35Z" fill="#e53e37"/>
    <path d="M230 37 C242 10 278 9 292 39 C273 46 248 47 230 37Z" fill="#f35b50"/>
    <circle cx="280" cy="112" r="39" fill="none" stroke="#f7d36c" strokeWidth="7"/><path d="M280 73 C314 94 319 125 298 149" fill="none" stroke="#f7d36c" strokeWidth="6" strokeLinecap="round"/>
    <g fill="#fff" opacity=".9"><path d="M22 33 h36 l-9 11 9 11H22Z"/><path d="M69 112 h44 l-9 12 9 12H69Z"/></g><text x="28" y="48" fontSize="13" fontWeight="900" fill="#082f44">FIRST RUN</text>
  </svg></div>
  if(type==='bopeep') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="22" fill="#5b2f87"/>
    <g fill="#f6ecff"><circle cx="244" cy="100" r="26"/><circle cx="270" cy="93" r="24"/><circle cx="293" cy="106" r="25"/><circle cx="267" cy="116" r="28"/></g><circle cx="302" cy="113" r="15" fill="#d9baf7"/><circle cx="298" cy="109" r="2.8" fill="#523169"/><circle cx="307" cy="109" r="2.8" fill="#523169"/>
    <path d="M85 31 V140 C85 154 70 158 59 148" fill="none" stroke="#d9baf7" strokeWidth="10" strokeLinecap="round"/><path d="M84 31 C114 31 112 57 93 64" fill="none" stroke="#d9baf7" strokeWidth="10" strokeLinecap="round"/>
    <text x="127" y="47" fontSize="13" fontWeight="900" fill="#fff">SECOND JOURNEY</text>
  </svg></div>
  if(type==='potato') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#e8fff0"/>
    <ellipse cx="238" cy="91" rx="68" ry="60" fill="#b9783f" stroke="#70451f" strokeWidth="5"/><ellipse cx="212" cy="72" rx="13" ry="16" fill="#fff"/><ellipse cx="258" cy="72" rx="13" ry="16" fill="#fff"/><circle cx="214" cy="76" r="5"/><circle cx="256" cy="76" r="5"/><path d="M212 112 C229 126 248 126 265 112" fill="none" stroke="#4b2b18" strokeWidth="7" strokeLinecap="round"/><path d="M222 98 C232 91 243 91 253 98" fill="none" stroke="#4b2b18" strokeWidth="8" strokeLinecap="round"/><path d="M182 72 C166 62 160 70 166 82" fill="#f0a27e"/><path d="M294 72 C310 62 316 70 310 82" fill="#f0a27e"/>
    <g transform="translate(25 40)"><circle cx="32" cy="20" r="20" fill="#ffd83f"/><path d="M22 18 h20 M32 8 v20" stroke="#c49700" strokeWidth="4"/><text x="0" y="76" fontSize="13" fontWeight="900" fill="#17663b">LUCKY PARTS</text></g>
  </svg></div>
  if(type==='pizza') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#efe5ff"/>
    <g transform="translate(80 28)"><path d="M95 9 V35" stroke="#3e8e40" strokeWidth="7" strokeLinecap="round"/><circle cx="95" cy="7" r="7" fill="#6ee56b"/><path d="M42 75 C42 31 148 31 148 75 C148 115 126 139 95 139 C64 139 42 115 42 75Z" fill="#76e06f" stroke="#3e8e40" strokeWidth="5"/><g fill="#fff" stroke="#3e8e40" strokeWidth="3"><circle cx="72" cy="77" r="13"/><circle cx="95" cy="67" r="13"/><circle cx="118" cy="77" r="13"/></g><g fill="#17461e"><circle cx="72" cy="77" r="5"/><circle cx="95" cy="67" r="5"/><circle cx="118" cy="77" r="5"/></g><path d="M78 106 C88 116 102 116 112 106" fill="none" stroke="#17461e" strokeWidth="5" strokeLinecap="round"/></g>
    <g transform="translate(250 20)" stroke="#6b3bb7" strokeWidth="8" fill="none" strokeLinecap="round"><path d="M30 0 V60"/><path d="M8 54 C11 87 49 87 52 54"/><path d="M8 54 l-8 25 M52 54 l8 25"/></g>
    <path d="M30 138 H118" stroke="#f4b125" strokeWidth="8" strokeLinecap="round"/><text x="32" y="125" fontSize="13" fontWeight="900" fill="#6532a8">THE CLAW</text>
  </svg></div>
  if(type==='army') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#efe4c8"/>
    <path d="M0 146 C70 118 138 137 190 114 C242 92 312 109 360 83 V180 H0Z" fill="#b9c59c"/>
    <g stroke="#bd4d35" strokeWidth="3" fill="none" opacity=".75"><path d="M35 50 C94 30 128 42 169 24 C220 5 269 22 318 14"/><path d="M64 92 C102 76 123 77 157 59"/></g>
    <g transform="translate(132 24)"><ellipse cx="54" cy="22" rx="30" ry="12" fill="#456f3f"/><circle cx="54" cy="38" r="24" fill="#5f8956"/><rect x="41" y="58" width="26" height="58" rx="8" fill="#5f8956"/><path d="M45 67 L18 86 M63 67 L90 86" stroke="#4c7646" strokeWidth="10" strokeLinecap="round"/><path d="M47 114 L33 153 M61 114 L77 153" stroke="#4c7646" strokeWidth="10" strokeLinecap="round"/><rect x="7" y="151" width="88" height="11" rx="6" fill="#456f3f"/><g fill="#264829"><circle cx="39" cy="38" r="10"/><circle cx="69" cy="38" r="10"/></g><rect x="38" y="31" width="32" height="14" rx="5" fill="#284e2c"/></g>
    <g transform="translate(33 85) scale(.72)"><circle cx="32" cy="20" r="18" fill="#648f59"/><rect x="24" y="36" width="16" height="42" rx="6" fill="#648f59"/><rect x="10" y="78" width="45" height="8" rx="4" fill="#456f3f"/></g>
    <g transform="translate(278 85) scale(.72)"><circle cx="32" cy="20" r="18" fill="#648f59"/><rect x="24" y="36" width="16" height="42" rx="6" fill="#648f59"/><rect x="10" y="78" width="45" height="8" rx="4" fill="#456f3f"/></g>
    <text x="20" y="28" fontSize="13" fontWeight="900" fill="#385a37">BATTLEFIELD INTELLIGENCE</text>
  </svg></div>
  if(type==='sid') return <div className={cls}><svg {...common}>
    <defs><linearGradient id="sidBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b241c"/><stop offset="1" stopColor="#15151b"/></linearGradient></defs><rect width="360" height="180" rx="24" fill="url(#sidBg)"/>
    <path d="M18 25 H342 M25 58 H333 M34 146 H326" stroke="#6d4535" strokeWidth="3" opacity=".55"/>
    <text x="255" y="34" fontSize="27" fontWeight="900" fill="#a04a3f" transform="rotate(-5 255 34)">SID</text>
    <g transform="translate(176 48)"><circle cx="52" cy="32" r="24" fill="#e8c5a8"/><circle cx="44" cy="29" r="4" fill="#38261e"/><circle cx="60" cy="29" r="4" fill="#38261e"/><path d="M44 44 C50 48 56 48 62 44" fill="none" stroke="#6a382b" strokeWidth="3"/><circle cx="52" cy="32" r="31" fill="none" stroke="#6f6f74" strokeWidth="5"/><g stroke="#77777e" strokeWidth="6" strokeLinecap="round"><path d="M29 55 L2 89"/><path d="M38 61 L22 105"/><path d="M65 61 L82 105"/><path d="M75 55 L103 89"/></g></g>
    <g transform="translate(40 83)"><rect x="30" y="31" width="73" height="24" rx="8" fill="#d8513f"/><circle cx="41" cy="60" r="12" fill="#1f2026"/><circle cx="92" cy="60" r="12" fill="#1f2026"/><path d="M55 30 C48 8 69 0 81 17 C95 3 109 10 108 28" fill="none" stroke="#d7b54a" strokeWidth="8" strokeLinecap="round"/></g>
    <path d="M18 157 h110" stroke="#f0c448" strokeWidth="6" strokeDasharray="10 8"/><text x="20" y="44" fontSize="12" fontWeight="900" fill="#f0c448">DATA WORKSHOP</text>
  </svg></div>
  if(type==='rex') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#fff0cf"/><path d="M0 150 C48 117 88 128 128 100 C181 62 233 88 278 61 C311 42 340 44 360 31 V180 H0Z" fill="#a9cf78"/>
    <path d="M50 118 L88 49 L126 118Z" fill="#8e5e42"/><path d="M73 79 L88 49 L103 79Z" fill="#ef7948"/><path d="M87 49 C79 33 96 25 102 38 C108 24 126 34 117 49" fill="#f2aa49"/>
    <g transform="translate(183 44)"><ellipse cx="63" cy="58" rx="58" ry="43" fill="#69b95d"/><circle cx="103" cy="43" r="29" fill="#69b95d"/><circle cx="112" cy="37" r="5" fill="#fff"/><circle cx="114" cy="38" r="2"/><path d="M104 55 C117 63 126 62 135 56" fill="none" stroke="#2f6e38" strokeWidth="4"/><path d="M13 57 C-18 51 -24 79 5 86" fill="none" stroke="#69b95d" strokeWidth="18" strokeLinecap="round"/><path d="M43 96 L34 133 M80 96 L88 133" stroke="#4e9b4f" strokeWidth="13" strokeLinecap="round"/></g>
    <path d="M18 146 H322" stroke="#d3713e" strokeWidth="4" strokeDasharray="10 8"/><text x="20" y="33" fontSize="13" fontWeight="900" fill="#4f7d45">GW1 → NOW → FUTURE</text>
  </svg></div>
  if(type==='zurg') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#15122b"/><g opacity=".35" stroke="#8d6ac9"><path d="M20 35 H340 M20 72 H340 M20 109 H340 M20 146 H340"/></g>
    <g transform="translate(185 17)"><path d="M75 0 L116 40 L107 133 H43 L34 40Z" fill="#5e37a1" stroke="#9d73e5" strokeWidth="5"/><path d="M49 57 H102 L92 86 H58Z" fill="#210f42"/><path d="M62 67 H74 M82 67 H94" stroke="#ff4054" strokeWidth="7" strokeLinecap="round"/><path d="M34 40 L12 21 M116 40 L138 21" stroke="#7b4fbd" strokeWidth="12" strokeLinecap="round"/></g><path d="M28 131 C91 110 133 103 180 82" fill="none" stroke="#ff4054" strokeWidth="5" strokeDasharray="7 8"/><text x="22" y="34" fontSize="13" fontWeight="900" fill="#c4a8ff">OFFICIAL ARCHIVE</text>
  </svg></div>
  if(type==='hamm') return <div className={cls}><svg {...common}>
    <rect width="360" height="180" rx="24" fill="#102b5e"/>
    <g transform="translate(135 32)"><ellipse cx="80" cy="71" rx="72" ry="52" fill="#f59abc" stroke="#c9618a" strokeWidth="5"/><circle cx="139" cy="63" r="20" fill="#f9a8c5"/><circle cx="146" cy="58" r="3.5" fill="#663146"/><circle cx="133" cy="58" r="3.5" fill="#663146"/><path d="M59 23 H104" stroke="#8f4664" strokeWidth="7" strokeLinecap="round"/><path d="M38 112 V135 M113 112 V135" stroke="#c9618a" strokeWidth="12" strokeLinecap="round"/><path d="M14 65 C-3 57 -7 73 7 80" fill="none" stroke="#c9618a" strokeWidth="7" strokeLinecap="round"/></g>
    <g transform="translate(25 85)"><circle cx="24" cy="24" r="22" fill="#ffd04b" stroke="#bd8d16" strokeWidth="4"/><circle cx="58" cy="41" r="19" fill="#f0b72f" stroke="#bd8d16" strokeWidth="4"/><text x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="900" fill="#815700">฿</text></g><text x="24" y="35" fontSize="13" fontWeight="900" fill="#ffb6d2">PIGGY BANK ZONE</text>
  </svg></div>
  return null
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
    label:'น้าผู้ใหญ่',valueLabel:'ค่าน้าผู้ใหญ่',tech:'DefCon',icon:'🛡️',per90:'defcon90',actual:'minutes',actualLabel:'MIN',tone:'green',
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
      <ToyScene type="woody"/>
      <div className="sectionTitle"><div><p>🏆 FULL SEASON</p><h2>ศึกใหญ่ทั้งฤดูกาล</h2><span>คะแนน GW1–GW5 ล็อกตามข้อมูลที่กำหนดไว้ • ตั้งแต่ GW6 ต่อด้วย FPL อัตโนมัติ</span></div><strong>฿4,200</strong></div>
      <div className="twoCol v3TwoCol"><MiniTable rows={league.cumulative} limit={11} title={`Overall after GW${league.latestGw}`}/><div className="compactRule"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/full-season.jpeg',alt:'Full season rules'})}><img className="ruleMedia" src="/rules/full-season.jpeg" alt="Full season rules"/></button><div><b>Prize</b><span>🥇 2,000 • 🥈 1,200</span><span>🥉 600 • 4th 400</span><span>5–11 จ่ายคนละ 600 บาท</span></div></div></div>
    </section>

    <section className="section detailSection toneBlue toyBuzzSection" id="gameweek">
      <ToyAccent type="buzz"/>
      <ToyScene type="buzz"/>
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
        <ToyScene type="jessie" compact/>
        <div className="chanceHead"><span>🎯</span><div><small>FIRST CHANCE</small><h2>GW1–GW19</h2></div><b>฿700</b></div>
        <div className="chanceBody"><MiniTable rows={league.firstChanceRows}/><div className="chanceRuleWrap"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/first-second-chance.jpeg',alt:'First / Second Chance rules'})}><img className="ruleMedia" src="/rules/first-second-chance.jpeg" alt="First Chance rules"/></button><RuleChips phase="first"/></div></div>
      </article>
      <article className="chanceV3 second toyBoPeepSection" id="second-chance">
        <ToyAccent type="bopeep" compact/>
        <ToyScene type="bopeep" compact/>
        <div className="chanceHead"><span>🔥</span><div><small>SECOND CHANCE</small><h2>GW20–GW38</h2></div><b>฿700</b></div>
        <div className="chanceBody">{league.secondChanceStarted?<MiniTable rows={league.secondChanceRows}/>:<div className="resetBox"><b>RESET AFTER GW19</b><span>ยังไม่เริ่มการแข่งขัน</span><small>คะแนนจะเริ่มนับใหม่ตั้งแต่ GW20</small></div>}<div className="chanceRuleWrap"><button className="ruleImageButton" onClick={()=>setLightbox({src:'/rules/first-second-chance.jpeg',alt:'First / Second Chance rules'})}><img className="ruleMedia" src="/rules/first-second-chance.jpeg" alt="Second Chance rules"/></button><RuleChips phase="second"/></div></div>
      </article>
    </section>

    <section className="section detailSection toneGreen toyPotatoSection" id="lucky-game">
      <ToyAccent type="potato"/>
      <ToyScene type="potato"/>
      <div className="sectionTitle"><div><p>🍀 LUCKY GAME</p><h2>Fortune & Fun</h2><span>5 เงื่อนไข • ใครเข้าเงื่อนไขก่อนรับรางวัลนั้น</span></div><strong>2 / 5 claimed</strong></div>
      <div className="luckyV3">
        <div className="luckyConditions">{luckyConditions.map(c=><div className={c.claimed?'claimed':''} key={c.id}><span>{c.id}</span><div><b>{c.label}</b>{c.claimed&&<small>{c.winner} • {c.detail}</small>}</div><em>{c.claimed?'CLAIMED':'AVAILABLE'}</em></div>)}</div>
        <div className="winnerSpotlight"><img src="/games/lucky-game-gw4.png" alt="Best Lucky Game GW4 winner"/><div><small>WINNER ARCHIVE</small><h3>Best • GW4</h3><p>Matty Cash −1 pt • Lucky Reward #3</p><span>อีกเงื่อนไขที่ถูก Claim: #5 Own Goal — Oat</span></div></div>
      </div>
    </section>

    <section className="section detailSection tonePurple toyPizzaSection" id="mini-game">
      <ToyAccent type="pizza"/>
      <ToyScene type="pizza"/>
      <div className="sectionTitle"><div><p>🎮 MINI GAME</p><h2>Different Game. Different Week.</h2><span>รูปแบบเปลี่ยนได้ตาม Gameweek — ไม่จำกัดว่าเป็นเกมช่วยผู้แพ้</span></div><strong>FORMAT CHANGES</strong></div>
      <div className="miniTimeline v3Timeline"><div><b>GW1–GW4</b><span>เกมปริศนาทายภาพ</span></div><i>→</i><div><b>GW5</b><span>The Differential</span></div><i>→</i><div><b>NEXT</b><span>New Format</span></div></div>
      <div className="winnerGrid">{miniWinners.map(w=><figure key={w.gw}><img src={w.image} alt={`GW${w.gw} ${w.winner}`}/><figcaption><b>GW{w.gw} • {w.winner}</b><span>{w.answer}</span></figcaption></figure>)}</div>
      <div className="diffResult"><img src="/games/the-diff-gw5.png" alt="The Differential GW5"/><div><small>GW5 • THE DIFFERENTIAL</small><h3>Jimmy 🤝 Guide</h3><p>Iwobi 5 pts vs Mykolenko 5 pts — Tie</p></div></div>
    </section>

    <section className="section statsSectionV3 toyArmySection" id="statistics">
      <ToyAccent type="army"/>
      <div className="sectionTitle statsTitleV4"><div><p>📊 LEAGUE STATISTICS</p><h2>Stats & Insights</h2><span>ข้อมูล FPL League {FPL_LEAGUE_ID} + คะแนน Hybrid ของลีกเรา</span></div><div className={`apiPill ${fplStatus}`}>{fplStatus==='ready'?`⚡ ${fplSummary?.matchedCount||0}/11 CONNECTED`:fplStatus==='loading'?'CONNECTING…':'FALLBACK MODE'}</div></div>

      <div className="statsBattlefieldBanner">
        <ToyScene type="army" banner/>
        <div className="statsBattlefieldCopy"><small>GREEN ARMY RECON</small><b>SCOUT • ANALYZE • PLAN</b><span>สมรภูมิข้อมูลของลีก — ใช้สถิติจริงเพื่ออ่านเกมก่อน Gameweek ถัดไป</span></div>
      </div>

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
      <div className="xgHero">
        <div className="xgHost">
          <div className="kunCutoutStage"><img src="/xg-lab/kun-host-crop.jpeg" alt="Kun — ADMIN INSIDE host"/></div>
          <div className="speechBubble">ก่อน <b>Transfer</b><br/>อย่าเผลอใจ</div>
        </div>
        <div className="xgBrand"><small>FPL DATA • FUN LANGUAGE</small><h2><span>ADMIN</span> INSIDE</h2><strong>by Kun</strong><p>หลังบ้านของ Admin • ชำแหละข้อมูลก่อน Transfer</p></div>
        <div className="sidWorkshopScene"><ToyScene type="sid" banner/></div>
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
      <ToyScene type="rex"/>
      <div className="sectionTitle"><div><p>🖼️ GALLERY</p><h2>Season Story</h2><span>{totalGallery} artworks • เรื่องราวของแต่ละ Gameweek</span></div><strong>GW1–GW{latestGalleryGw}</strong></div>
      <div className="rexJourney" aria-hidden="true"><span>🌋<small>GW1 • PAST</small></span><i/><span className="rexNow">🦖<small>NOW • GW{galleryGw}</small></span><i/><span>✨<small>FUTURE • GW38</small></span></div>
      <div className="gwTabs v3Tabs">{galleryGws.map(n=><button key={n} className={galleryGw===n?'active':''} onClick={()=>setGalleryGw(n)}>GW{n}</button>)}</div>
      <div className="galleryGrid">{gallery[galleryGw].map(([file,title])=><figure key={file}><img loading="lazy" src={`/gallery/gw${galleryGw}/${file}`} alt={title}/><figcaption><b>{title}</b><span>GW{galleryGw} • FPL Kickoff Today 2027</span></figcaption></figure>)}</div>
    </section>

    <section className="section rulesSectionV3 toyZurgSection" id="rules">
      <ToyAccent type="zurg"/>
      <ToyScene type="zurg"/>
      <div className="sectionTitle"><div><p>📜 RULES & INFO</p><h2>Official Rules Archive</h2><span>กติกาเต็มของการแข่งขันทั้งหมด</span></div><strong>OFFICIAL</strong></div>
      <div className="rulesGrid"><figure><img src="/rules/official-overview.jpeg" alt="Overview"/><figcaption><b>Official Overview</b><span>ภาพรวมการแข่งขันและเงินรางวัล</span></figcaption></figure><figure><img src="/rules/gameweek.jpeg" alt="Gameweek"/><figcaption><b>Gameweek</b><span>Weekly payout</span></figcaption></figure><figure><img src="/rules/first-second-chance.jpeg" alt="Chance rules"/><figcaption><b>First / Second Chance</b><span>GW1–19 / GW20–38 + Reset</span></figcaption></figure><figure><img src="/rules/full-season.jpeg" alt="Full Season"/><figcaption><b>Full Season</b><span>End-of-season prize</span></figcaption></figure><figure><img src="/rules/mini-game-legacy.jpeg" alt="Mini Game"/><figcaption><b>Mini Game — Archive</b><span>GW1–GW4 original format</span></figcaption></figure><figure><img src="/rules/lucky-game-current.jpeg" alt="Lucky Game"/><figcaption><b>Lucky Game — Current</b><span>#3 & #5 claimed</span></figcaption></figure></div>
    </section>

    <section className="section financeSection toyHammSection" id="finance">
      <ToyAccent type="hamm"/>
      <ToyScene type="hamm"/>
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
