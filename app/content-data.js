export const competitions = [
  {
    id:'full-season', icon:'🏆', title:'Full Season', kicker:'SEASON TITLE',
    status:'GW1–GW38', accent:'gold',
    summary:'อันดับสะสมตลอดฤดูกาล ชิงแชมป์ใหญ่ของลีก',
    prize:'1st ฿2,000 • 2nd ฿1,200 • 3rd ฿600 • 4th ฿400',
    rule:'อันดับ 5–11 จ่ายคนละ ฿600 เมื่อจบฤดูกาล', image:'/rules/full-season.webp'
  },
  {
    id:'gameweek', icon:'⚽', title:'Gameweek', kicker:'WEEKLY BATTLE',
    status:'ทุก GW', accent:'blue',
    summary:'แข่งและเคลียร์เงินทุกสัปดาห์ตามอันดับของ Gameweek',
    prize:'1st +฿120 • 2nd +฿60 • 3rd +฿30 • 4th ฿0',
    rule:'อันดับ 5–11 จ่ายคนละ ฿30', image:'/rules/gameweek.webp'
  },
  {
    id:'first-chance', icon:'🎯', title:'First Chance', kicker:'HALF SEASON I',
    status:'GW1–GW19', accent:'cyan',
    summary:'รอบสะสมครึ่งฤดูกาลแรก แยกจาก Full Season',
    prize:'1st ฿350 • 2nd ฿200 • 3rd ฿150',
    rule:'อันดับ 5–11 จ่ายคนละ ฿100 • อันดับ 4 รอดตัว', image:'/rules/first-second-chance.webp'
  },
  {
    id:'second-chance', icon:'🔥', title:'Second Chance', kicker:'HALF SEASON II',
    status:'GW20–GW38', accent:'purple',
    summary:'รีเซ็ตคะแนนหลัง GW19 แล้วเริ่มลุ้นกันใหม่',
    prize:'1st ฿350 • 2nd ฿200 • 3rd ฿150',
    rule:'อันดับ 5–11 จ่ายคนละ ฿100 • อันดับ 4 รอดตัว', image:'/rules/first-second-chance.webp'
  },
  {
    id:'lucky-game', icon:'🍀', title:'Lucky Game', kicker:'LUCKY POOL',
    status:'3 / 5 รางวัลแตกแล้ว • เหลือ 2 รางวัล', accent:'green',
    summary:'เกมดวง 5 เงื่อนไข ใครเข้าเงื่อนไขก่อนรับรางวัลนั้น',
    prize:'รางวัลละ ฿220 • ใช้สิทธิ์ได้ครั้งเดียวต่อเงื่อนไข',
    rule:'Claim แล้ว: #3 นักเตะ −1, #4 Red Card และ #5 Own Goal', image:'/rules/lucky-game-current.webp'
  },
  {
    id:'mini-game', icon:'🎮', title:'Mini Game', kicker:'FORMAT CHANGES',
    status:'เปลี่ยนรูปแบบตาม GW', accent:'red',
    summary:'เกมพิเศษของลีก รูปแบบสามารถเปลี่ยนได้ตามแต่ละสัปดาห์',
    prize:'GW1–4 เกมปริศนา • GW5–8 The Differential',
    rule:'Mini Game ไม่ได้จำกัดว่าเป็นเกมช่วยผู้แพ้เสมอไป', image:'/rules/mini-game-legacy.webp'
  }
]

export const gallery = {
  1: [
    ['bench-boost-kun-ohm.webp','Bench Boost Activated — Kun & Ohm'],
    ['monday-recap-hull.webp','Monday Recap — Hull City shock'],
    ['arm-clarke-captain.webp','Arm — Captain Clarke, 14 pts'],
    ['sangare-14.webp','Kun — Sangaré 14 pts'],
    ['joao-pedro-final-arrival.webp','João Pedro — The Final Arrival'],
  ],
  2: [
    ['guide-bench-boost.webp','Guide — Bench Boost Activated'],
    ['haaland-express.webp','Haaland Express — 26 pts'],
    ['bruno-express.webp','Bruno Express — 46 pts (C)'],
    ['arm-gibbs-white.webp','Arm — Gibbs-White 26 pts'],
  ],
  3: [
    ['city-attacker.webp','Choose Your City Attacker'],
    ['chip-war.webp','All In On Haaland — GW3 Chip War'],
    ['konsa-road.webp','All Roads Lead to Konsa'],
    ['joao-pedro-start-bench.webp','João Pedro — Start or Bench?'],
    ['wissa-watchlist.webp','All Eyes on Wissa'],
    ['haaland-triple-captain.webp','HAA-DOKEN! — Triple Captain Haaland'],
  ],
  4: [
    ['gw4-preview.webp','GW4 Preview — Gakpo / Palmer x Rogers'],
    ['manchester-derby.webp','Manchester Derby — Street Fighter II'],
    ['bruno-ken.webp','Bruno as Ken'],
    ['haaland-ryu.webp','Haaland as Ryu'],
    ['mbeumo-dhalsim.webp','Mbeumo as Dhalsim'],
    ['cherki-chunli.webp','Cherki as Chun-Li'],
    ['cunha-blanka.webp','Cunha as Blanka'],
    ['elliot-zangief.webp','Elliot Anderson as Zangief'],
    ['enzo-guile.webp','Enzo as Guile'],
    ['derby-result.webp','Manchester Derby — Result'],
  ],
  5: [
    ['the-differential-picks.webp','The Differential — Manager Picks'],
    ['deadline-countdown.webp','Deadline Countdown — Lock Team'],
    ['gibbs-white-mania.webp','Gibbs-White Mania'],
    ['gibbs-white-crash.webp','MGW — Hype Train Crash'],
    ['gross-power-spray.webp','Gross Power Spray — Clean Sheet Hunt'],
  ],
  6: [
    ['calafiori-vs-de-cuyper.webp','Calafiori 9 vs De Cuyper 15'],
    ['bruno-keep-or-sell.webp','Bruno £11.9m — Keep or Sell?'],
  ],
  7: [
    ['gw7-deadline.webp','GW7 Deadline — 17:00'],
    ['saka-injured.webp','Saka Injured — Injury Update'],
  ],
  8: [
    ['gw8-deadline.webp','GW8 Deadline — 00:30'],
    ['gw8-differential-final-round.webp','The Differential — Final Round Promo'],
    ['saka-injured.webp','Saka Injured — Injury Update'],
  ],
}

export const miniWinners = [
  {gw:1, winner:'Guide', answer:'Wesley Fofana', image:'/mini-winners/gw1-guide-fofana.webp'},
  {gw:2, winner:'Ohm', answer:'William Saliba', image:'/mini-winners/gw2-ohm-saliba.webp'},
  {gw:3, winner:'Pee', answer:'Mesut Özil', image:'/mini-winners/gw3-pee-ozil.webp'},
  {gw:4, winner:'Deer', answer:'Nick Woltemade', image:'/mini-winners/gw4-deer-woltemade.webp'},
  {gw:6,winner:'9 winners',answer:'Everybody Beats Kun',image:'/mini-winners/gw6-everybody-beats-kun.webp'},
  {gw:7,winner:'Jimmy',answer:'Iwobi — 11 PTS',image:'/mini-winners/gw7-jimmy-iwobi.webp'},
  {gw:8,winner:'Best',answer:'Enciso — 10 PTS',image:'/mini-winners/gw8-best-enciso.webp'},
]

export const luckyConditions = [
  {id:1,label:'Team total 123',claimed:false},
  {id:2,label:'Team total 99',claimed:false},
  {id:3,label:'Player score −1',claimed:true,winner:'Best',gw:4,detail:'Matty Cash −1'},
  {id:4,label:'Red card',claimed:true,winner:'Kun, Fluk, Jimmy, Arm',gw:8,detail:'Cole Palmer • ฿55 each'},
  {id:5,label:'Own goal',claimed:true,winner:'Oat',detail:'Own Goal'},
]
