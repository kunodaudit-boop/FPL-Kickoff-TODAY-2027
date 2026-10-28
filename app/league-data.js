// ============================================================
// FPL KICKOFF TODAY 2027 — MASTER DATA
// Update this file when a new Gameweek is finished.
//
// IMPORTANT:
// 1) Keep all 11 managers in each Gameweek.
// 2) Keep rows in the OFFICIAL weekly ranking order.
//    If points are tied, the row order is used for 1st/2nd/etc.
// 3) To add GW6, copy the GW5 block, change 5: to 6:,
//    then replace the 11 scores/order.
// ============================================================

export const members = [
  ['Kun', 'IREN & NEBIUS FC'],
  ['Amp', 'amplongdo'],
  ['Ohm', "Wasuwit's Team"],
  ['Pee', 'B3RLIN'],
  ['Fluk', '3ERLIN'],
  ['Oat', 'KaisungVAT'],
  ['Arm', 'Arm'],
  ['Deer', 'ทีมของวิทยา'],
  ['Guide', "G9inez's Team"],
  ['Jimmy', 'xROTzx'],
  ['Best', 'USO BEST'],
]

export const gameweeks = {
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
  6: [
    ['Oat','KaisungVAT',74],
    ['Fluk','3ERLIN',70],
    ['Pee','B3RLIN',69],
    ['Arm','Arm',66,{rawPoints:70,transferCost:4}],
    ['Guide',"G9inez's Team",61],
    ['Kun','IREN & NEBIUS FC',60],
    ['Ohm',"Wasuwit's Team",60],
    ['Best','USO BEST',53],
    ['Deer','ทีมของวิทยา',48],
    ['Amp','amplongdo',34],
    ['Jimmy','xROTzx',28],
  ],

  7: [
    ['Guide',"G9inez's Team",83],
    ['Best',"USO BEST",79],
    ['Fluk',"3ERLIN",76],
    ['Pee',"B3RLIN",75],
    ['Kun',"IREN & NEBIUS FC",74],
    ['Jimmy',"xROTzx",70],
    ['Deer',"ทีมของวิทยา",69],
    ['Ohm',"Wasuwit's Team",66],
    ['Arm',"Arm",64],
    ['Amp',"amplongdo",61],
    ['Oat',"KaisungVAT",56],
  ],
  8: [
    ['Amp',"amplongdo",70],
    ['Best',"USO BEST",61],
    ['Jimmy',"xROTzx",59],
    ['Deer',"ทีมของวิทยา",55],
    ['Ohm',"Wasuwit's Team",51],
    ['Guide',"G9inez's Team",44],
    ['Oat',"KaisungVAT",44],
    ['Kun',"IREN & NEBIUS FC",42],
    ['Pee',"B3RLIN",42],
    ['Fluk',"3ERLIN",34],
    ['Arm',"Arm",25,{rawPoints:29,transferCost:4}],
  ],

  // === NEXT UPDATE EXAMPLE ===
  // 6: [
  //   ['Manager in 1st','Team',0],
  //   ['Manager in 2nd','Team',0],
  //   ...ครบ 11 คน...
  // ],
}

// Mini Game prizes are tracked separately from Gameweek settlements.
export const miniGameSaves = {}

// Mini/Lucky ledgers remain independent. Weekly GW money is calculated from gameweeks
// in page.js and NEVER copied from the legacy gwWon/gwLost fields below.
export const financialThroughGw = 8
export const financial = [
  {name:'Best',team:'USO BEST',luckyPool:-100,gwWon:240,gwLost:-150,mini:30,lucky:220},
  {name:'Amp',team:'amplongdo',luckyPool:-100,gwWon:420,gwLost:-150,mini:30,lucky:0},
  {name:'Oat',team:'KaisungVAT',luckyPool:-100,gwWon:120,gwLost:-210,mini:0,lucky:220},
  {name:'Guide',team:"G9inez's Team",luckyPool:-100,gwWon:270,gwLost:-120,mini:90,lucky:0},
  {name:'Kun',team:'IREN & NEBIUS FC',luckyPool:-100,gwWon:180,gwLost:-120,mini:0,lucky:55},
  {name:'Ohm',team:"Wasuwit's Team",luckyPool:-100,gwWon:120,gwLost:-120,mini:60,lucky:0},
  {name:'Pee',team:'B3RLIN',luckyPool:-100,gwWon:90,gwLost:-120,mini:60,lucky:0},
  {name:'Fluk',team:'3ERLIN',luckyPool:-100,gwWon:150,gwLost:-120,mini:30,lucky:55},
  {name:'Deer',team:'ทีมของวิทยา',luckyPool:-100,gwWon:60,gwLost:-150,mini:60,lucky:0},
  {name:'Arm',team:'Arm',luckyPool:-100,gwWon:0,gwLost:-180,mini:30,lucky:55},
  {name:'Jimmy',team:'xROTzx',luckyPool:-100,gwWon:30,gwLost:-210,mini:90,lucky:55},
]
