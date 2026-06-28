// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — MAP DATA (mapData.js)
//  Single source of truth for ALL maps, monsters, spawns, transitions.
//  Load via <script src="mapData.js"> AFTER core.js
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const T = {POL:0,CLN:1,GRS:2,T1:3,T2:4,T3:5,TRS:6,WAT:7,FLR:8,SND:9,SNW:10,ROK:11,LAV:12,ICE:13,PORTAL:14};

// ─── MAP DEFINITIONS ───────────────────────────────────────────────────────
const MapData = {
  map1: {
    id:'map1', name:'폐허 분지', subtitle:'산업 폐기물 투기장',
    chapter:1, difficulty:1, nextMap:'map2',
    theme:'waste', // waste|dust|plastic|boss
    desc:'한때 비옥한 농경지였으나 인근 공장의 폐수 방류와 불법 투기로 완전히 오염되었습니다.',
    cols:20, rows:15,
    palette:{
      pol:'#3a3020',cln:'#6b5a3a',grs:'#3a6a2a',w:'#2a5a7a',
      t1:'#4a8a3a',t2:'#2a7a1a',t3:'#1a6a0a',f1:'#e68',f2:'#fd3',
      sky1:'#2a2518',sky2:'#3a3525',ambient:'rgba(60,50,30,0.06)'
    },
    waterPos:[[7,10],[3,5],[12,16]],
    startPos:[10,7],
    portalPos:[18,1], // where portal appears after boss
    animals:['bird','butterfly','rabbit'],
    trashRate:70, trashTypes:['bottle','bag','tire','can','barrel'],
    // Simplified: just monster types with population cap
    monsters:['slime','plastic_wraith','smog_spirit','trash_golem'],
    monsterMax:{slime:2,plastic_wraith:2,smog_spirit:1,trash_golem:1},
    // CLEAR MAP GOAL — simple, single objective
    goal:{type:'kill',target:5,label:'몬스터 5마리 처치',icon:'⚔️'},
    boss:{type:'sludge_titan',purity:0},
    // Ruins/POIs
    ruins:[
      {name:'폐공장 터',icon:'🏭',col:15,row:3,w:3,h:2,tile:T.ROK},
      {name:'버려진 마을',icon:'🏚️',col:2,row:11,w:3,h:2,tile:T.ROK},
      {name:'마른 분수',icon:'⛲',col:9,row:3,w:2,h:2,tile:T.CLN},
    ],
    books:['book_ocean','book_waste'],
    // Map transition dialogue
    completionDialogue:'map1_complete',
    // Particle atmosphere
    atmosParticles:{type:'smog',rate:0.02,color:'rgba(80,70,40,',speed:0.15},
  },

  map2: {
    id:'map2', name:'미세먼지 협곡', subtitle:'대기오염 집중 구역',
    chapter:2, difficulty:2, nextMap:'map3',
    theme:'dust',
    desc:'공장 밀집 지역에서 발생한 미세먼지가 협곡에 갇혀 만들어진 독성 안개 지대입니다.',
    cols:20, rows:15,
    palette:{
      pol:'#3a3540',cln:'#6a6570',grs:'#4a6a5a',w:'#3a5a7a',
      t1:'#4a7a5a',t2:'#3a6a4a',t3:'#2a5a3a',f1:'#88f',f2:'#a8f',
      sky1:'#252530',sky2:'#353545',ambient:'rgba(80,80,100,0.08)'
    },
    waterPos:[[4,10],[10,5],[13,15]],
    startPos:[2,13],
    portalPos:[17,2],
    animals:['bird','butterfly'],
    trashRate:55, trashTypes:['bottle','bag','ewaste','can','barrel'],
    monsters:['smog_spirit','dust_phantom','ash_crawler','smog_golem','acid_wisp'],
    monsterMax:{smog_spirit:2,dust_phantom:2,ash_crawler:1,smog_golem:1,acid_wisp:1},
    goal:{type:'kill',target:6,label:'몬스터 6마리 처치',icon:'⚔️'},
    boss:{type:'smog_colossus',purity:0},
    ruins:[
      {name:'무너진 공장',icon:'🏭',col:14,row:2,w:4,h:3,tile:T.ROK},
      {name:'가스 저장소',icon:'⛽',col:3,row:5,w:2,h:2,tile:T.ROK},
      {name:'관측소 잔해',icon:'🔭',col:10,row:10,w:2,h:2,tile:T.CLN},
    ],
    books:['book_air','book_forest'],
    completionDialogue:'map2_complete',
    atmosParticles:{type:'dust',rate:0.04,color:'rgba(120,110,90,',speed:0.3},
    specialTile:T.SND, specialChance:0.12,
  },

  map3: {
    id:'map3', name:'플라스틱 해안', subtitle:'분해되지 않는 저주',
    chapter:3, difficulty:3, nextMap:'map4',
    theme:'plastic',
    desc:'해류에 의해 플라스틱 폐기물이 집중된 해안입니다. 분해되지 않는 쓰레기가 산을 이루고 있습니다.',
    cols:20, rows:15,
    palette:{
      pol:'#2a3040',cln:'#5a6a7a',grs:'#3a7a5a',w:'#1a4a7a',
      t1:'#3a8a5a',t2:'#2a7a4a',t3:'#1a6a3a',f1:'#4af',f2:'#8cf',
      sky1:'#1a2a3a',sky2:'#2a3a4a',ambient:'rgba(60,80,120,0.06)'
    },
    waterPos:[[7,0],[7,1],[7,2],[7,18],[7,19],[13,10],[3,10]],
    startPos:[10,12],
    portalPos:[10,1],
    animals:['bird','butterfly','rabbit','squirrel'],
    trashRate:45, trashTypes:['bottle','bag','tire','can','barrel','ewaste'],
    monsters:['plastic_wraith','microplastic_swarm','bottle_golem','oil_crawler','coral_ghost'],
    monsterMax:{plastic_wraith:2,microplastic_swarm:2,bottle_golem:1,oil_crawler:1,coral_ghost:1},
    goal:{type:'kill',target:7,label:'몬스터 7마리 처치',icon:'⚔️'},
    boss:{type:'plastic_leviathan',purity:0},
    ruins:[
      {name:'좌초된 배',icon:'🚢',col:15,row:6,w:4,h:3,tile:T.ROK},
      {name:'해안 연구소',icon:'🔬',col:2,row:3,w:3,h:2,tile:T.CLN},
      {name:'플라스틱 산',icon:'🗻',col:8,row:5,w:3,h:3,tile:T.TRS},
    ],
    books:['book_ocean','book_future'],
    completionDialogue:'map3_complete',
    atmosParticles:{type:'mist',rate:0.03,color:'rgba(100,140,180,',speed:0.1},
    specialTile:T.ICE, specialChance:0.08,
  },

  map4: {
    id:'map4', name:'오염의 심장', subtitle:'최종 결전장',
    chapter:4, difficulty:4, nextMap:null,
    theme:'boss',
    desc:'모든 오염의 근원이 집중된 세계의 중심입니다. 오염왕이 이곳에서 세계를 지배하고 있습니다.',
    cols:20, rows:15,
    palette:{
      pol:'#2a1510',cln:'#4a3525',grs:'#3a5a2a',w:'#2a3a5a',
      t1:'#4a6a2a',t2:'#3a5a1a',t3:'#2a4a0a',f1:'#f84',f2:'#fa4',
      sky1:'#1a0808',sky2:'#2a1515',ambient:'rgba(150,40,20,0.08)'
    },
    waterPos:[[7,10],[3,3],[12,16]],
    startPos:[10,13],
    portalPos:[10,1],
    animals:['bird'],
    trashRate:35, trashTypes:['bottle','bag','tire','can','barrel','ewaste'],
    monsters:['slime','trash_golem','smog_spirit','oil_crawler','corruption_knight'],
    monsterMax:{slime:2,trash_golem:2,smog_spirit:1,oil_crawler:1,corruption_knight:1},
    goal:{type:'kill_boss',target:1,label:'오염왕을 처치하라!',icon:'👹'},
    boss:{type:'pollution_king',purity:0},
    ruins:[
      {name:'오염의 제단',icon:'⛩️',col:8,row:2,w:4,h:3,tile:T.LAV},
      {name:'폐허의 탑',icon:'🗼',col:2,row:4,w:2,h:4,tile:T.ROK},
      {name:'독의 샘',icon:'☠️',col:16,row:8,w:2,h:2,tile:T.POL},
    ],
    books:['book_forest','book_future','book_waste'],
    completionDialogue:'victory',
    atmosParticles:{type:'ash',rate:0.05,color:'rgba(150,60,30,',speed:0.25},
    specialTile:T.LAV, specialChance:0.06,
  },
};

// ─── EXTENDED MONSTER DATABASE ─────────────────────────────────────────────
// New monsters for maps 2-4
const ExtMonsters = {
  // Aggro range helper — all monsters get aggroRange if missing
  _applyDefaults(md){
    if(md.aggroRange===undefined){
      if(md.isBoss)md.aggroRange=120;
      else if(md.behavior==='chase')md.aggroRange=85;
      else if(md.behavior==='patrol')md.aggroRange=70;
      else md.aggroRange=65;
    }
    return md;
  },

  // MAP 2: Dust/Smog monsters
  dust_phantom: {
    name:'먼지 유령',icon:'👤',desc:'미세먼지가 응축된 유령체. 투명해져 기습한다.',
    hp:70, dmg:14, speed:0.6, size:13, color:'#998',color2:'#776',
    drops:[{id:'smog_essence',chance:0.5},{id:'coins',min:12,max:28,chance:1}],
    xp:35, behavior:'chase', map:'map2',
  },
  ash_crawler: {
    name:'재 기어다니개',icon:'🐛',desc:'화산재와 미세먼지가 결합한 절지동물.',
    hp:90, dmg:16, speed:0.45, size:15, color:'#654',color2:'#432',
    drops:[{id:'rust_core',chance:0.4},{id:'smog_essence',chance:0.3},{id:'coins',min:15,max:35,chance:1}],
    xp:40, behavior:'patrol', map:'map2',
  },
  smog_golem: {
    name:'스모그 골렘',icon:'🌫️',desc:'대기오염 물질이 거대한 형체로 뭉친 골렘.',
    hp:160, dmg:22, speed:0.25, size:22, color:'#666',color2:'#444',
    drops:[{id:'scrap_metal',chance:0.6},{id:'toxic_shard',chance:0.4},{id:'coins',min:25,max:50,chance:1}],
    xp:65, behavior:'patrol', map:'map2',
  },
  acid_wisp: {
    name:'산성 위스프',icon:'💧',desc:'산성비가 응축된 에너지체. 접촉하면 장비가 부식된다.',
    hp:55, dmg:18, speed:0.9, size:10, color:'#af4',color2:'#8d2',
    drops:[{id:'toxic_shard',chance:0.5},{id:'pure_crystal',chance:0.08},{id:'coins',min:10,max:22,chance:1}],
    xp:30, behavior:'chase', map:'map2',
  },

  // MAP 3: Plastic/Ocean monsters
  microplastic_swarm: {
    name:'미세플라스틱 군체',icon:'✨',desc:'수억 개의 미세플라스틱이 모여 만든 군체.',
    hp:45, dmg:6, speed:1.0, size:10, color:'#eee',color2:'#ccd',
    drops:[{id:'toxic_shard',chance:0.3},{id:'coins',min:5,max:15,chance:1}],
    xp:20, behavior:'chase', map:'map3',
    special:'split', // splits into 2 smaller ones on death
  },
  bottle_golem: {
    name:'병 골렘',icon:'🫙',desc:'수천 개의 페트병이 뭉쳐 만든 거대 골렘.',
    hp:180, dmg:20, speed:0.2, size:24, color:'#8cf',color2:'#6ab',
    drops:[{id:'scrap_metal',chance:0.7},{id:'pure_crystal',chance:0.15},{id:'coins',min:30,max:60,chance:1}],
    xp:80, behavior:'patrol', map:'map3',
  },
  coral_ghost: {
    name:'산호 유령',icon:'🪸',desc:'오염으로 죽은 산호초의 원혼.',
    hp:100, dmg:15, speed:0.55, size:16, color:'#faa',color2:'#d88',
    drops:[{id:'pure_crystal',chance:0.2},{id:'smog_essence',chance:0.4},{id:'coins',min:18,max:40,chance:1}],
    xp:50, behavior:'wander', map:'map3',
  },

  // MAP 4: Corruption monsters
  corruption_knight: {
    name:'오염의 기사',icon:'🗡️',desc:'오염왕의 직속 근위병. 정화된 타일을 다시 오염시킨다.',
    hp:200, dmg:28, speed:0.5, size:18, color:'#420',color2:'#310',
    drops:[{id:'pure_crystal',chance:0.4},{id:'toxic_shard',chance:0.6},{id:'coins',min:40,max:80,chance:1}],
    xp:100, behavior:'chase', map:'map4',
    special:'corrupt', // re-pollutes nearby tiles
  },
  toxic_hydra: {
    name:'독성 히드라',icon:'🐍',desc:'세 개의 머리를 가진 독성 괴수.',
    hp:300, dmg:25, speed:0.35, size:26, color:'#4a2',color2:'#280',
    drops:[{id:'pure_crystal',chance:0.6},{id:'rust_core',chance:0.5},{id:'coins',min:60,max:120,chance:1}],
    xp:150, behavior:'boss', map:'map4',
    phases:2,
  },

  // ─── BOSS MONSTERS ───────────────────────────────────────────────────────
  _applyBossDefaults(md){
    if(md.aggroRange===undefined)md.aggroRange=140;
    if(md.detectRange===undefined)md.detectRange=200;
    return md;
  },
  sludge_titan: {
    name:'슬러지 타이탄',icon:'🧟',desc:'산업 폐수가 응축된 거대 슬라임. 독성 웅덩이를 남긴다.',
    hp:400, dmg:20, speed:0.35, size:30, color:'#5a3',color2:'#382',
    drops:[{id:'pure_crystal',chance:1},{id:'coins',min:150,max:300,chance:1}],
    xp:250, behavior:'boss', map:'map1', isBoss:true, phases:3,
    attacks:['sludge_pool','toxic_spit','pollution_wave'],
  },
  smog_colossus: {
    name:'스모그 거신',icon:'🌪️',desc:'대기오염의 최종 형태. 독성 안개로 시야를 제한한다.',
    hp:600, dmg:25, speed:0.3, size:32, color:'#888',color2:'#555',
    drops:[{id:'pure_crystal',chance:1},{id:'smog_essence',chance:1},{id:'coins',min:250,max:450,chance:1}],
    xp:350, behavior:'boss', map:'map2', isBoss:true, phases:3,
    attacks:['smog_cloud','acid_rain','cyclone'],
  },
  plastic_leviathan: {
    name:'플라스틱 리바이어던',icon:'🐋',desc:'해양 쓰레기가 모여 형성된 거대 해양 괴수.',
    hp:800, dmg:30, speed:0.25, size:36, color:'#8cf',color2:'#5a8',
    drops:[{id:'pure_crystal',chance:1},{id:'scrap_metal',chance:1},{id:'coins',min:350,max:600,chance:1}],
    xp:450, behavior:'boss', map:'map3', isBoss:true, phases:4,
    attacks:['wave_crash','debris_storm','plastic_tentacle','microplastic_cloud'],
  },
  pollution_king: {
    name:'오염왕',icon:'👹',desc:'모든 오염의 근원. 이 땅의 마지막 적.',
    hp:1200, dmg:35, speed:0.4, size:40, color:'#420',color2:'#210',
    drops:[{id:'pure_crystal',chance:1},{id:'coins',min:500,max:1000,chance:1}],
    xp:600, behavior:'boss', map:'map4', isBoss:true, phases:5,
    attacks:['corruption_beam','trash_rain','toxic_nova','summon_minions','final_wrath'],
  },
};

// Merge extended monsters into MonsterDB
if (typeof MonsterDB !== 'undefined') {
  Object.assign(MonsterDB, ExtMonsters);
  // Apply aggroRange defaults to all monsters
  for(const key in MonsterDB){
    if(MonsterDB[key]&&typeof MonsterDB[key]==='object'&&!MonsterDB[key].aggroRange){
      ExtMonsters._applyDefaults(MonsterDB[key]);
    }
  }
}

// ─── BOSS ATTACK PATTERNS ─────────────────────────────────────────────────
const BossAttacks = {
  // Sludge Titan (Map 1)
  sludge_pool:   {name:'독성 웅덩이',dmg:5,type:'aoe',radius:40,duration:180,desc:'이동 경로에 독성 지역 생성'},
  toxic_spit:    {name:'독액 발사',dmg:18,type:'projectile',speed:2,desc:'플레이어 방향으로 독성 탄환'},
  pollution_wave:{name:'오염 파동',dmg:12,type:'ring',radius:60,desc:'주변 광역 오염 공격'},
  // Smog Colossus (Map 2)
  smog_cloud:    {name:'독성 안개',dmg:3,type:'fog',radius:80,duration:300,desc:'시야 제한 + 지속 데미지'},
  acid_rain:     {name:'산성비',dmg:15,type:'rain',count:8,desc:'무작위 위치에 산성비 낙하'},
  cyclone:       {name:'회오리',dmg:20,type:'chase',speed:3,desc:'플레이어를 추적하는 회오리'},
  // Plastic Leviathan (Map 3)
  wave_crash:    {name:'파도 충돌',dmg:25,type:'line',width:400,desc:'맵 전체 가로 파도'},
  debris_storm:  {name:'잔해 폭풍',dmg:12,type:'rain',count:12,desc:'플라스틱 잔해 무작위 낙하'},
  plastic_tentacle:{name:'촉수 공격',dmg:20,type:'tentacle',count:3,desc:'3방향 촉수 공격'},
  microplastic_cloud:{name:'미세플라스틱 구름',dmg:4,type:'fog',radius:100,duration:240,desc:'전체 맵 독성 안개'},
  // Pollution King (Map 4)
  corruption_beam:{name:'오염 광선',dmg:30,type:'beam',desc:'직선 관통 오염 레이저'},
  trash_rain:    {name:'쓰레기 폭풍',dmg:15,type:'rain',count:15,desc:'대량 쓰레기 낙하'},
  toxic_nova:    {name:'독성 노바',dmg:25,type:'ring',radius:100,desc:'전 방위 독성 폭발'},
  summon_minions:{name:'하수인 소환',dmg:0,type:'summon',count:3,desc:'소형 몬스터 3체 소환'},
  final_wrath:   {name:'최후의 분노',dmg:40,type:'screen',desc:'전체 화면 공격 (체력 30% 이하)'},
};

// ─── MAP TRANSITION DIALOGUES ──────────────────────────────────────────────
const MapDialogues = {
  map1_complete: [
    {speaker:'대장로 아론',text:'훌륭하다! 폐허 분지를 정화했구나!'},
    {speaker:'대장로 아론',text:'하지만 아직 갈 길이 멀다. 다음은 미세먼지 협곡이다.'},
    {speaker:'대장로 아론',text:'대기오염이 집중된 곳이니 더욱 조심해야 한다.'},
    {speaker:'',text:'[ 미세먼지 협곡으로 이동합니다... ]'},
  ],
  map2_complete: [
    {speaker:'대장로 아론',text:'대기를 정화했어! 하늘이 맑아지고 있다!'},
    {speaker:'대장로 아론',text:'다음 목적지는 플라스틱 해안이다.'},
    {speaker:'대장로 아론',text:'분해되지 않는 플라스틱의 저주가 기다리고 있을 것이다.'},
    {speaker:'',text:'[ 플라스틱 해안으로 이동합니다... ]'},
  ],
  map3_complete: [
    {speaker:'대장로 아론',text:'해안을 정화했구나! 바다가 다시 맑아지고 있어!'},
    {speaker:'대장로 아론',text:'이제 마지막이다. 오염의 심장으로 가야 한다.'},
    {speaker:'대장로 아론',text:'오염왕이 기다리고 있다. 모든 준비를 마치고 가거라.'},
    {speaker:'',text:'[ 오염의 심장으로 이동합니다... ]'},
  ],
};

// Add to StoryDialogues
if (typeof StoryDialogues !== 'undefined') {
  Object.assign(StoryDialogues, MapDialogues);
}

// ─── TRASH TYPES ───────────────────────────────────────────────────────────
const TrashTypes = {
  bottle: {n:'bottle',w:6,h:10,d:8,c:2,s:1.5,color:'#6ab4e8'},
  bag:    {n:'bag',w:8,h:7,d:5,c:1,s:1.0,color:'#ccc'},
  tire:   {n:'tire',w:10,h:10,d:15,c:4,s:2.0,color:'#333'},
  can:    {n:'can',w:5,h:7,d:6,c:2,s:1.8,color:'#c33'},
  barrel: {n:'barrel',w:8,h:10,d:20,c:5,s:2.2,color:'#a63'},
  ewaste: {n:'ewaste',w:8,h:6,d:12,c:3,s:1.7,color:'#3a3'},
};

// ─── MAP GENERATION ────────────────────────────────────────────────────────
function generateMap(mapId) {
  const md = MapData[mapId];
  if (!md) return null;

  const tiles = [];
  const gTim = [];

  for (let r = 0; r < md.rows; r++) {
    tiles[r] = [];
    gTim[r] = [];
    for (let c = 0; c < md.cols; c++) {
      let t = T.POL;
      const rng = Math.random();

      if (rng < 0.05) t = T.CLN;
      else if (rng < 0.07) t = T.GRS;
      else if (rng < 0.12) t = T.TRS;
      if (rng > 0.97) t = T.ROK;

      // Special tiles per map
      if (md.specialTile && rng > (1 - (md.specialChance || 0.1)) && t === T.POL) {
        t = md.specialTile;
      }

      // Water
      for (const [wr, wc] of md.waterPos) {
        if (r === wr && c === wc) t = T.WAT;
      }

      // Ruins
      if (md.ruins) {
        for (const ruin of md.ruins) {
          if (c >= ruin.col && c < ruin.col + ruin.w && r >= ruin.row && r < ruin.row + ruin.h) {
            t = ruin.tile;
          }
        }
      }

      tiles[r][c] = t;
      gTim[r][c] = 0;
    }
  }

  // Clear start area
  const [sc, sr] = md.startPos;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const nr = sr + dr, nc = sc + dc;
      if (nr >= 0 && nr < md.rows && nc >= 0 && nc < md.cols) {
        if (tiles[nr][nc] !== T.WAT && Math.abs(dr) + Math.abs(dc) <= 3) {
          tiles[nr][nc] = T.CLN;
        }
      }
    }
  }

  return { tiles, gTim };
}

// ─── GET MONSTERS FOR MAP ──────────────────────────────────────────────────
function getMonstersForMap(mapId, purityPct) {
  const md = MapData[mapId];
  if (!md) return [];
  return md.monsterWaves.filter(w => purityPct >= w.purity);
}

// ─── GET CURRENT MAP DATA ──────────────────────────────────────────────────
function getCurrentMapData() {
  if (typeof Save !== 'undefined') {
    Save.load();
    return MapData[Save.g('currentMap')] || MapData.map1;
  }
  return MapData.map1;
}

// Export
if (typeof window !== 'undefined') {
  window.T = T;
  window.MapData = MapData;
  window.ExtMonsters = ExtMonsters;
  window.BossAttacks = BossAttacks;
  window.TrashTypes = TrashTypes;
  window.generateMap = generateMap;
  window.getMonstersForMap = getMonstersForMap;
  window.getCurrentMapData = getCurrentMapData;
}

console.log('[MAPDATA] Map data loaded —', Object.keys(MapData).length, 'maps,', Object.keys(ExtMonsters).length, 'new monsters');
