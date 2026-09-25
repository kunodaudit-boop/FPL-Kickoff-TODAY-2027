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

  // === NEXT UPDATE EXAMPLE ===
  // 6: [
  //   ['Manager in 1st','Team',0],
  //   ['Manager in 2nd','Team',0],
  //   ...ครบ 11 คน...
  // ],
}

// Mini Game Save: manager whose normal -30 weekly settlement becomes 0.
// Add a new line only when a save is actually used, e.g. 6: 'Kun'
export const miniGameSaves = {
  1: 'Guide',
  2: 'Ohm',
  3: 'Pee',
  4: 'Deer',
}

// Financial table is kept separately because it includes special-game money
// that cannot be inferred safely from weekly FPL points alone.
// When finance changes, update the relevant values here.
export const financialThroughGw = 5
export const financial = [
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
