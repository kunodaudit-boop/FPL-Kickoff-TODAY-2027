export const competitions = [
  {
    id:'full-season', icon:'🏆', title:'Full Season', kicker:'SEASON TITLE',
    status:'GW1–GW38', accent:'gold',
    summary:'อันดับสะสมตลอดฤดูกาล ชิงแชมป์ใหญ่ของลีก',
    prize:'1st ฿2,000 • 2nd ฿1,200 • 3rd ฿600 • 4th ฿400',
    rule:'อันดับ 5–11 จ่ายคนละ ฿600 เมื่อจบฤดูกาล', image:'/rules/full-season.jpeg'
  },
  {
    id:'gameweek', icon:'⚽', title:'Gameweek', kicker:'WEEKLY BATTLE',
    status:'ทุก GW', accent:'blue',
    summary:'แข่งและเคลียร์เงินทุกสัปดาห์ตามอันดับของ Gameweek',
    prize:'1st +฿120 • 2nd +฿60 • 3rd +฿30 • 4th ฿0',
    rule:'อันดับ 5–11 จ่ายคนละ ฿30', image:'/rules/gameweek.jpeg'
  },
  {
    id:'first-chance', icon:'🎯', title:'First Chance', kicker:'HALF SEASON I',
    status:'GW1–GW19', accent:'cyan',
    summary:'รอบสะสมครึ่งฤดูกาลแรก แยกจาก Full Season',
    prize:'1st ฿350 • 2nd ฿200 • 3rd ฿150',
    rule:'อันดับ 5–11 จ่ายคนละ ฿100 • อันดับ 4 รอดตัว', image:'/rules/first-second-chance.jpeg'
  },
  {
    id:'second-chance', icon:'🔥', title:'Second Chance', kicker:'HALF SEASON II',
    status:'GW20–GW38', accent:'purple',
    summary:'รีเซ็ตคะแนนหลัง GW19 แล้วเริ่มลุ้นกันใหม่',
    prize:'1st ฿350 • 2nd ฿200 • 3rd ฿150',
    rule:'อันดับ 5–11 จ่ายคนละ ฿100 • อันดับ 4 รอดตัว', image:'/rules/first-second-chance.jpeg'
  },
  {
    id:'lucky-game', icon:'🍀', title:'Lucky Game', kicker:'LUCKY POOL',
    status:'3 / 5 รางวัลยังเหลือ', accent:'green',
    summary:'เกมดวง 5 เงื่อนไข ใครเข้าเงื่อนไขก่อนรับรางวัลนั้น',
    prize:'รางวัลละ ฿220 • ใช้สิทธิ์ได้ครั้งเดียวต่อเงื่อนไข',
    rule:'Claim แล้ว: #3 นักเตะ −1 และ #5 Own Goal', image:'/rules/lucky-game-current.jpeg'
  },
  {
    id:'mini-game', icon:'🎮', title:'Mini Game', kicker:'FORMAT CHANGES',
    status:'เปลี่ยนรูปแบบตาม GW', accent:'red',
    summary:'เกมพิเศษของลีก รูปแบบสามารถเปลี่ยนได้ตามแต่ละสัปดาห์',
    prize:'GW1–4 เกมปริศนา • GW5 The Differential',
    rule:'Mini Game ไม่ได้จำกัดว่าเป็นเกมช่วยผู้แพ้เสมอไป', image:'/rules/mini-game-legacy.jpeg'
  }
]

export const gallery = {
  1: [
    ['bench-boost-kun-ohm.jpeg','Bench Boost Activated — Kun & Ohm'],
    ['monday-recap-hull.jpeg','Monday Recap — Hull City shock'],
    ['arm-clarke-captain.jpeg','Arm — Captain Clarke, 14 pts'],
    ['sangare-14.jpeg','Kun — Sangaré 14 pts'],
    ['joao-pedro-final-arrival.jpeg','João Pedro — The Final Arrival'],
  ],
  2: [
    ['guide-bench-boost.jpeg','Guide — Bench Boost Activated'],
    ['haaland-express.jpeg','Haaland Express — 26 pts'],
    ['bruno-express.jpeg','Bruno Express — 46 pts (C)'],
    ['arm-gibbs-white.jpeg','Arm — Gibbs-White 26 pts'],
  ],
  3: [
    ['city-attacker.jpeg','Choose Your City Attacker'],
    ['chip-war.jpeg','All In On Haaland — GW3 Chip War'],
    ['konsa-road.jpeg','All Roads Lead to Konsa'],
    ['joao-pedro-start-bench.jpeg','João Pedro — Start or Bench?'],
    ['wissa-watchlist.jpeg','All Eyes on Wissa'],
    ['haaland-triple-captain.jpeg','HAA-DOKEN! — Triple Captain Haaland'],
  ],
  4: [
    ['gw4-preview.jpeg','GW4 Preview — Gakpo / Palmer x Rogers'],
    ['manchester-derby.jpeg','Manchester Derby — Street Fighter II'],
    ['bruno-ken.jpeg','Bruno as Ken'],
    ['haaland-ryu.jpeg','Haaland as Ryu'],
    ['mbeumo-dhalsim.jpeg','Mbeumo as Dhalsim'],
    ['cherki-chunli.jpeg','Cherki as Chun-Li'],
    ['cunha-blanka.jpeg','Cunha as Blanka'],
    ['elliot-zangief.jpeg','Elliot Anderson as Zangief'],
    ['enzo-guile.jpeg','Enzo as Guile'],
    ['derby-result.jpeg','Manchester Derby — Result'],
  ],
  5: [
    ['the-differential-picks.jpeg','The Differential — Manager Picks'],
    ['deadline-countdown.jpeg','Deadline Countdown — Lock Team'],
    ['gibbs-white-mania.jpeg','Gibbs-White Mania'],
    ['gibbs-white-crash.jpeg','MGW — Hype Train Crash'],
    ['gross-power-spray.jpeg','Gross Power Spray — Clean Sheet Hunt'],
  ]
}

export const miniWinners = [
  {gw:1, winner:'Guide', answer:'Wesley Fofana', image:'/mini-winners/gw1-guide-fofana.png'},
  {gw:2, winner:'Ohm', answer:'William Saliba', image:'/mini-winners/gw2-ohm-saliba.png'},
  {gw:3, winner:'Pee', answer:'Mesut Özil', image:'/mini-winners/gw3-pee-ozil.png'},
  {gw:4, winner:'Deer', answer:'Nick Woltemade', image:'/mini-winners/gw4-deer-woltemade.png'},
]

export const luckyConditions = [
  {id:1,label:'Team total 123',claimed:false},
  {id:2,label:'Team total 99',claimed:false},
  {id:3,label:'Player score −1',claimed:true,winner:'Best',gw:4,detail:'Matty Cash −1'},
  {id:4,label:'Red card',claimed:false},
  {id:5,label:'Own goal',claimed:true,winner:'Oat',detail:'Own Goal'},
]
