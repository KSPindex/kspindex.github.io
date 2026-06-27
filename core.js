// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — CORE ENGINE (core.js)
//  Shared across ALL html files via <script src="core.js">
//  Handles: SaveData, Inventory, Quests, Monsters, Items, Story state
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

// ─── SAVE DATA ─────────────────────────────────────────────────────────────
const Save = {
  d: null,
  def: {
    // Currency
    coins: 50, gems: 0, totalCoins: 50, totalGems: 0,
    // Player stats
    playerName: '레인저',
    level: 1, xp: 0, xpNext: 100,
    maxHP: 100, maxEnergy: 100, maxWater: 80, maxSeeds: 20,
    baseSpeed: 1.8, basePower: 10,
    // Equipment
    equippedWeapon: null, equippedArmor: null, equippedTool: 'broom',
    equippedPet: null, equippedAura: null,
    // Story progress
    chapter: 0,        // 0=intro not seen, 1=ch1 started, 2=ch2...
    storyFlags: {},    // arbitrary flags like {metElder:true, killedSlime:true}
    currentMap: 'map1',
    unlockedLevels: 1, // number of stage maps unlocked for stage select
    dialogueIndex: 0,  // tracks VN progress
    guideSeen: false,
    introSeen: false,
    // Quests
    activeQuests: [],
    completedQuests: [],
    questProgress: {},  // {questId: {current:5, target:10}}
    // Inventory
    inventory: [],      // [{id,name,qty,type,icon}]
    // Trophies
    trophies: [],       // ['trophy_id_1', ...]
    trophyNotif: null,  // pending notification
    // Monster catalog
    discoveredMonsters: [],
    totalKills: 0,
    byType: {},
    bossesDefeated: [],
    // Books collected
    booksCollected: [],
    // Stats
    gamesPlayed: 0, totalScore: 0, totalCleaned: 0, totalPlanted: 0,
    totalTrashCaught: 0, totalTrashDodged: 0, highestCombo: 0,
    playTimeSeconds: 0,
    // Upgrades
    upgradeHealth: 0, upgradeEnergy: 0, upgradeSpeed: 0,
    upgradeWaterCap: 0, upgradeSeedCap: 0, upgradeCleanPower: 0,
    upgradePlantSpeed: 0, upgradeCoinBonus: 0, upgradeLuck: 0,
    upgradeWeaponDmg: 0, upgradeWeaponSpd: 0,
    // Settings
    soundEnabled: true, musicEnabled: true,
    // Map state (tile data per map, saved as compressed string)
    mapStates: {},
    // Zone purity
    zonePurity: { map1: 0, map2: 0, map3: 0, map4: 0 },
    // Monster spawns alive
    aliveMonsters: {},
  },

  _WN_PREFIX: '__ECORESTORE_SAVE__:',
  _storageOK: null,
  _canUseStorage() {
    if (this._storageOK !== null) return this._storageOK;
    try {
      const k = '__ecorestore_storage_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      this._storageOK = true;
    } catch (e) {
      this._storageOK = false;
    }
    return this._storageOK;
  },
  _readLocal() {
    try {
      if (!this._canUseStorage()) return null;
      const raw = localStorage.getItem('ecorestore_save');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  _writeLocal(data) {
    try {
      if (this._canUseStorage()) localStorage.setItem('ecorestore_save', JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  },
  _readWindowName() {
    try {
      const wn = String(window.name || '');
      if (!wn.startsWith(this._WN_PREFIX)) return null;
      return JSON.parse(decodeURIComponent(escape(atob(wn.slice(this._WN_PREFIX.length)))));
    } catch (e) { return null; }
  },
  _writeWindowName(data) {
    try {
      window.name = this._WN_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      return true;
    } catch (e) { return false; }
  },
  _normalize(data) {
    this.d = { ...this.def, ...(data || {}) };
    // Ensure arrays/objects exist
    if (!Array.isArray(this.d.inventory)) this.d.inventory = [];
    if (!Array.isArray(this.d.activeQuests)) this.d.activeQuests = [];
    if (!Array.isArray(this.d.completedQuests)) this.d.completedQuests = [];
    if (!this.d.questProgress) this.d.questProgress = {};
    if (!this.d.storyFlags) this.d.storyFlags = {};
    if (!Array.isArray(this.d.trophies)) this.d.trophies = [];
    if (!Array.isArray(this.d.booksCollected)) this.d.booksCollected = [];
    if (!this.d.mapStates) this.d.mapStates = {};
    if (!this.d.byType) this.d.byType = {};
    if (!this.d.zonePurity) this.d.zonePurity = { map1:0, map2:0, map3:0, map4:0 };
    this.d.unlockedLevels = Math.max(1, Number(this.d.unlockedLevels || 1));
    this.d.coins = Number(this.d.coins || 0);
    this.d.totalCoins = Number(this.d.totalCoins || this.d.coins || 0);
    this.d.gems = Number(this.d.gems || 0);
    this.d.totalGems = Number(this.d.totalGems || this.d.gems || 0);
    return this.d;
  },
  load() {
    try {
      const local = this._readLocal();
      const tab = this._readWindowName();
      // Arena/file sandbox or some WebView flows can isolate localStorage per HTML page.
      // window.name survives same-tab navigation, so choose the newest valid snapshot.
      const lt = Number(local?._updatedAt || 0);
      const tt = Number(tab?._updatedAt || 0);
      const chosen = tt > lt ? tab : (local || tab);
      this._normalize(chosen || this.def);
      // Keep both persistence channels synchronized for all other HTML pages.
      this.save(false);
    } catch (e) {
      console.warn('Save load failed:', e);
      this._normalize(this.def);
    }
  },
  save(stamp = true) {
    if (!this.d) this._normalize(this.def);
    if (stamp !== false) this.d._updatedAt = Date.now();
    const okLocal = this._writeLocal(this.d);
    const okTab = this._writeWindowName(this.d);
    if (!okLocal && !okTab) console.warn('Save failed: no available client persistence channel');
    if(typeof window.syncFromEngine==='function') window.syncFromEngine();
  },
  g(k) { if (!this.d) this.load(); return this.d[k]; },
  s(k, v) { if (!this.d) this.load(); this.d[k] = v; this.save(); },
  addCoins(n) { if (!this.d) this.load(); const a=Math.floor(Number(n)||0); this.d.coins = (Number(this.d.coins)||0) + a; this.d.totalCoins = (Number(this.d.totalCoins)||0) + Math.max(0,a); this.save(); },
  addGems(n) { if (!this.d) this.load(); const a=Math.floor(Number(n)||0); this.d.gems = (Number(this.d.gems)||0) + a; this.d.totalGems = (Number(this.d.totalGems)||0) + Math.max(0,a); this.save(); },
  ub(t) { return (this.d?.['upgrade' + t] || 0) * 0.1; },
  eq(s) { if (!this.d) this.load(); return this.d['equipped' + s.charAt(0).toUpperCase() + s.slice(1)] || null; },
  flag(f) { return this.d?.storyFlags?.[f] || false; },
  setFlag(f, v = true) { if (!this.d) this.load(); this.d.storyFlags[f] = v; this.save(); },
  resetAll() { this.d = { ...this.def, _updatedAt: Date.now() }; this.save(false); },
};

// ─── INVENTORY SYSTEM ──────────────────────────────────────────────────────
const Inventory = {
  add(id, qty = 1) {
    Save.load();
    const inv = Save.d.inventory;
    const existing = inv.find(i => i.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      const item = ItemDB[id];
      if (!item) { console.warn('Unknown item:', id); return; }
      inv.push({ id, name: item.name, qty, type: item.type, icon: item.icon });
    }
    Save.save();
  },
  remove(id, qty = 1) {
    Save.load();
    const inv = Save.d.inventory;
    const idx = inv.findIndex(i => i.id === id);
    if (idx === -1) return false;
    inv[idx].qty -= qty;
    if (inv[idx].qty <= 0) inv.splice(idx, 1);
    Save.save();
    return true;
  },
  has(id, qty = 1) {
    Save.load();
    const item = Save.d.inventory.find(i => i.id === id);
    return item && item.qty >= qty;
  },
  count(id) {
    Save.load();
    const item = Save.d.inventory.find(i => i.id === id);
    return item ? item.qty : 0;
  },
  getAll() {
    Save.load();
    return Save.d.inventory;
  },
};

// ─── MAP PROGRESS SYSTEM (NEW — replaces complex quests) ───────────────────
// Simple per-map progress tracker: just count kills + cleans + reads books
// Used to show a single clear goal in the HUD and trigger boss spawn.
const MapProgress = {
  kills: 0,
  cleans: 0,
  booksRead: 0,
  startedAt: 0,
  byType: {},

  reset() {
    Save.load();
    this.kills = 0;
    this.cleans = 0;
    this.booksRead = 0;
    this.startedAt = Date.now();
    this.byType = {};
  },

  addKill(amount = 1, monsterType = null) {
    amount = Math.max(0, Number(amount) || 0);
    if (!amount) return this.kills;

    Save.load();
    this.kills += amount;
    Save.d.totalKills = (Save.d.totalKills || 0) + amount;

    if (monsterType) {
      if (!this.byType) this.byType = {};
      this.byType[monsterType] = (this.byType[monsterType] || 0) + amount;

      const mapId = Save.g('currentMap') || 'map1';
      if (!Save.d.byType) Save.d.byType = {};
      if (!Save.d.byType[mapId]) Save.d.byType[mapId] = {};
      Save.d.byType[mapId][monsterType] = (Save.d.byType[mapId][monsterType] || 0) + amount;
    }

    if (typeof G !== 'undefined' && G) {
      G.kills = Math.max(G.kills || 0, this.kills);
      if (monsterType) {
        if (!G.killsByType) G.killsByType = {};
        G.killsByType[monsterType] = Math.max(G.killsByType[monsterType] || 0, this.byType[monsterType]);
      }
    }

    Save.save();
    return this.kills;
  },

  addClean(amount = 1) {
    this.cleans += amount;
    Save.s('totalCleaned', (Save.g('totalCleaned') || 0) + amount);
    Save.save();
  },

  addBook() {
    this.booksRead++;
  },

  // Returns { current, target, percent, label, icon, done }
  getProgress() {
    const mapId = Save.g('currentMap') || 'map1';
    const md = (typeof MapData !== 'undefined') ? MapData[mapId] : null;
    if (!md || !md.goal) {
      return { current: 0, target: 1, percent: 0, label: '', icon: '🎯', done: false };
    }
    const goal = md.goal;
    let current = 0;
    // For kill_boss type, only boss kills count
    if (goal.type === 'kill_boss') {
      // Boss defeated flags
      const bossFlag='bossDefeated_'+(md.boss?md.boss.type:'');
      current = (typeof Save!=='undefined' && Save.flag && Save.flag(bossFlag)) ? 1 : 0;
    }
    else if (goal.type === 'kill') {
      const gKills = (typeof G !== 'undefined' && G && typeof G.kills === 'number') ? G.kills : 0;
      current = Math.max(this.kills || 0, gKills);
    }
    else if (goal.type === 'purity') current = this.cleans;
    else if (goal.type === 'mixed') {
      const gKills = (typeof G !== 'undefined' && G && typeof G.kills === 'number') ? G.kills : 0;
      current = Math.max(this.kills || 0, gKills) + Math.floor(this.cleans / 5);
    }
    return {
      current: Math.min(current, goal.target),
      target: goal.target,
      percent: Math.min(current / goal.target, 1),
      label: goal.label || '',
      icon: goal.icon || '🎯',
      done: current >= goal.target,
    };
  },

  isGoalComplete() {
    return this.getProgress().done;
  },
};

// ─── QUEST SYSTEM (SIMPLIFIED — only for trophy/milestone tracking) ─────────
// Quests are no longer shown in the active quest tracker. They still exist
// for trophy progression but are auto-completed behind the scenes.
const Quests = {
  db: {
    // SIMPLIFIED — just milestone markers, no longer drive gameplay
    q_first_kill: { id:'q_first_kill', chapter:1, title:'첫 사냥', desc:'몬스터 1마리 처치', type:'kill', target:1, reward:{coins:20}, icon:'⚔️' },
    q_first_clean: { id:'q_first_clean', chapter:1, title:'정화 시작', desc:'타일 1개 정화', type:'clean', target:1, reward:{coins:10}, icon:'🧹' },
  },

  startQuest(id) {
    Save.load();
    if (Save.d.activeQuests.includes(id) || Save.d.completedQuests.includes(id)) return;
    Save.d.activeQuests.push(id);
    if (!Save.d.questProgress[id]) Save.d.questProgress[id] = { current: 0 };
    Save.save();
  },

  progress(type, amount = 1, extra = null) {
    Save.load();
    const completed = [];
    const monsterType = (extra && typeof extra === 'object') ? extra.monsterType : extra;

    for (const qid of Save.d.activeQuests) {
      const q = this.db[qid];
      if (!q || q.type !== type) continue;
      if (!Save.d.questProgress[qid]) Save.d.questProgress[qid] = { current: 0 };

      let match = true;
      if (type === 'kill' && q.targetMonster) {
        match = monsterType === q.targetMonster;
      }

      if (!match) continue;

      Save.d.questProgress[qid].current += amount;
      if (Save.d.questProgress[qid].current >= q.target) {
        completed.push(qid);
      }
    }

    Save.save();
    return completed;
  },

  complete(id) {
    Save.load();
    const q = this.db[id];
    if (!q) return;
    Save.d.activeQuests = Save.d.activeQuests.filter(x => x !== id);
    Save.d.completedQuests.push(id);
    // Give rewards
    if (q.reward.coins) Save.addCoins(q.reward.coins);
    if (q.reward.gems) Save.addGems(q.reward.gems);
    if (q.reward.xp) {
      Save.d.xp += q.reward.xp;
      while (Save.d.xp >= Save.d.xpNext) {
        Save.d.xp -= Save.d.xpNext;
        Save.d.level++;
        Save.d.xpNext = Math.floor(Save.d.xpNext * 1.5);
        Save.d.maxHP += 10;
        Save.d.maxEnergy += 5;
      }
    }
    if (q.reward.item) Inventory.add(q.reward.item);
    Save.save();
  },

  getActive() {
    Save.load();
    return Save.d.activeQuests.map(id => {
      const q = this.db[id];
      if (!q) return null;
      const prog = Save.d.questProgress[id] || { current: 0 };
      return { ...q, current: Math.min(prog.current, q.target), done: prog.current >= q.target };
    }).filter(Boolean);
  },

  isComplete(id) {
    return Save.g('completedQuests').includes(id);
  },
};

// ─── ITEM DATABASE ─────────────────────────────────────────────────────────
const ItemDB = {
  // Consumables
  potion_hp: { name: '체력 물약', type: 'consumable', icon: '❤️', desc: 'HP 50 회복', effect: 'heal', value: 50, price: 40 },
  potion_energy: { name: '에너지 드링크', type: 'consumable', icon: '⚡', desc: '에너지 80 회복', effect: 'energy', value: 80, price: 35 },
  potion_water: { name: '정화수', type: 'consumable', icon: '💧', desc: '물 50 회복', effect: 'water', value: 50, price: 30 },
  seed_pack: { name: '종자 팩', type: 'consumable', icon: '🌱', desc: '종자 10개 획득', effect: 'seeds', value: 10, price: 25 },
  shield_orb: { name: '보호막 구슬', type: 'consumable', icon: '🛡️', desc: '15초 무적', effect: 'shield', value: 900, price: 100 },
  // Monster drops
  slime_gel: { name: '슬라임 젤', type: 'material', icon: '🟢', desc: '독성 슬라임에서 추출한 젤. 정화 물약 재료.', price: 15 },
  scrap_metal: { name: '고철 조각', type: 'material', icon: '🔩', desc: '쓰레기 골렘에서 나온 금속 조각.', price: 20 },
  toxic_shard: { name: '독성 결정', type: 'material', icon: '💎', desc: '오염된 에너지가 결정화된 파편.', price: 30 },
  smog_essence: { name: '스모그 정수', type: 'material', icon: '💨', desc: '대기오염 정령의 핵심 물질.', price: 25 },
  rust_core: { name: '녹슨 핵', type: 'material', icon: '⚙️', desc: '산업 폐기물 처리 시 발견되는 코어.', price: 35 },
  pure_crystal: { name: '정화 수정', type: 'material', icon: '✨', desc: '완전히 정화된 에너지의 결정체.', price: 50 },
  // Weapons
  wood_stick: { name: '나뭇가지', type: 'weapon', icon: '🪵', desc: '기본 무기', dmg: 5, range: 1, speed: 1.0, price: 0 },
  eco_blade: { name: '에코 블레이드', type: 'weapon', icon: '⚔️', desc: '재활용 금속 검', dmg: 15, range: 1.5, speed: 1.2, price: 300 },
  water_gun: { name: '정화 물총', type: 'weapon', icon: '🔫', desc: '오염을 씻는 물총', dmg: 10, range: 3, speed: 1.1, price: 200 },
  thorn_whip: { name: '가시 채찍', type: 'weapon', icon: '🌿', desc: '넓은 범위', dmg: 12, range: 2.5, speed: 0.9, price: 350 },
  thunder_hammer: { name: '천둥 망치', type: 'weapon', icon: '🔨', desc: '강력한 근접', dmg: 35, range: 1, speed: 0.5, price: 500 },
  crystal_staff: { name: '수정 지팡이', type: 'weapon', icon: '🔮', desc: '마법 공격', dmg: 28, range: 4, speed: 0.8, price: 600 },
  // Tools
  broom: { name: '빗자루', type: 'tool', icon: '🧹', desc: '기본 청소 도구', power: 1.0, energy: 1.0, price: 0 },
  vacuum: { name: '에코 청소기', type: 'tool', icon: '🌀', desc: '강력한 청소기', power: 1.4, energy: 1.1, price: 300 },
  nano: { name: '나노 군단', type: 'tool', icon: '✨', desc: '최고 효율', power: 2.0, energy: 0.6, price: 600 },
  // Books (environmental lore)
  book_ocean: { name: '바다의 눈물', type: 'book', icon: '📘',
    desc: '해양 오염의 역사와 플라스틱이 바다 생태계에 미치는 영향을 기록한 책. 매년 800만 톤 이상의 플라스틱이 바다에 유입되고 있다.',
    lore: '이 세계의 바다는 한때 맑고 투명했습니다. 하지만 인류가 편리함을 추구하며 만든 플라스틱이 끝없이 바다로 흘러들었고, 이제 해양 생물의 90%가 체내에 미세플라스틱을 품고 있습니다. 이 책의 마지막 페이지에는 이렇게 적혀 있습니다: "바다가 울고 있다. 우리가 멈추지 않으면, 바다는 침묵할 것이다."' },
  book_air: { name: '숨 쉴 수 없는 하늘', type: 'book', icon: '📕',
    desc: '대기오염으로 인한 생태계 변화를 기록한 연구 일지.',
    lore: '한때 맑았던 하늘은 공장의 매연과 자동차의 배기가스로 뒤덮였습니다. 이 연구 일지는 대기 중 CO2 농도가 420ppm을 넘어선 날의 기록입니다. 저자는 마지막에 이렇게 남겼습니다: "우리 아이들은 맑은 하늘을 본 적이 없습니다. 그들에게 하늘은 원래 회색인 줄 압니다."' },
  book_forest: { name: '잃어버린 숲', type: 'book', icon: '📗',
    desc: '산림 벌채와 생물다양성 감소에 대한 현장 보고서.',
    lore: '매년 축구장 27,000개 면적의 숲이 사라지고 있습니다. 이 보고서는 한 생태학자가 30년간 관찰한 숲의 변화를 담고 있습니다. "처음 왔을 때 새 소리가 끊이지 않았다. 10년 후 소리가 절반으로 줄었다. 20년 후 침묵이 찾아왔다. 지금 이곳에는 아무것도 없다."' },
  book_waste: { name: '쓰레기 문명', type: 'book', icon: '📙',
    desc: '인류 문명이 만들어낸 폐기물의 양과 그 영향.',
    lore: '인류는 매년 약 20억 톤의 고형 폐기물을 생산합니다. 이 중 33%만이 제대로 처리되고, 나머지는 땅과 바다를 오염시킵니다. 이 책은 한 폐기물 처리장 노동자의 일기입니다. "오늘도 산처럼 쌓인 쓰레기를 보았다. 이 산은 매일 커진다. 언젠가 이 산이 우리를 덮칠 것이다."' },
  book_future: { name: '2050년의 편지', type: 'book', icon: '📓',
    desc: '미래 세대가 현재 세대에게 보내는 가상의 편지.',
    lore: '"2050년에서 보냅니다. 여러분이 이 편지를 읽고 있다면, 아직 희망이 있다는 뜻입니다. 우리 시대에는 깨끗한 물이 금보다 비쌉니다. 여름 기온은 50도를 넘고, 해안 도시의 절반이 물에 잠겼습니다. 하지만 우리는 포기하지 않았습니다. 여러분이 오늘 하는 작은 선택이 우리의 내일을 바꿉니다. 제발, 늦지 않았을 때 행동해 주세요."' },
};

// ─── MONSTER DATABASE ──────────────────────────────────────────────────────
const MonsterDB = {
  slime: {
    name: '독성 슬라임', icon: '🟢',
    desc: '오염된 토양에서 태어난 슬라임. 독성 웅덩이를 남긴다.',
    hp: 40, dmg: 8, speed: 0.5, size: 12,
    color: '#6a4', color2: '#4a2',
    drops: [
      { id: 'slime_gel', chance: 0.6 },
      { id: 'potion_hp', chance: 0.2 },
      { id: 'coins', min: 5, max: 15, chance: 1.0 },
    ],
    xp: 15, chapter: 1, map: 'map1',
    behavior: 'wander', // wander, chase, patrol
    spawnCondition: null,
  },
  trash_golem: {
    name: '쓰레기 골렘', icon: '🗑️',
    desc: '버려진 쓰레기가 모여 형성된 거대한 골렘.',
    hp: 120, dmg: 18, speed: 0.3, size: 20,
    color: '#888', color2: '#555',
    drops: [
      { id: 'scrap_metal', chance: 0.7 },
      { id: 'toxic_shard', chance: 0.3 },
      { id: 'coins', min: 20, max: 40, chance: 1.0 },
    ],
    xp: 50, chapter: 1, map: 'map1',
    behavior: 'patrol',
    spawnCondition: 'purity_20', // appears when purity > 20%
  },
  smog_spirit: {
    name: '스모그 정령', icon: '💨',
    desc: '대기오염이 응축된 영혼체. 접촉 시 시야가 흐려진다.',
    hp: 60, dmg: 12, speed: 0.7, size: 14,
    color: '#aaa', color2: '#777',
    drops: [
      { id: 'smog_essence', chance: 0.5 },
      { id: 'potion_energy', chance: 0.3 },
      { id: 'coins', min: 10, max: 25, chance: 1.0 },
    ],
    xp: 30, chapter: 1, map: 'map1',
    behavior: 'chase',
    spawnCondition: 'purity_15',
  },
  oil_crawler: {
    name: '기름 크롤러', icon: '🛢️',
    desc: '폐유가 생명을 얻은 기괴한 생물체.',
    hp: 80, dmg: 14, speed: 0.4, size: 16,
    color: '#432', color2: '#210',
    drops: [
      { id: 'rust_core', chance: 0.4 },
      { id: 'scrap_metal', chance: 0.4 },
      { id: 'coins', min: 15, max: 30, chance: 1.0 },
    ],
    xp: 35, chapter: 1, map: 'map1',
    behavior: 'wander',
    spawnCondition: 'purity_25',
  },
  plastic_wraith: {
    name: '플라스틱 망령', icon: '👻',
    desc: '분해되지 않는 플라스틱의 원한이 깃든 영체.',
    hp: 50, dmg: 10, speed: 0.8, size: 12,
    color: '#ccc', color2: '#aab',
    drops: [
      { id: 'toxic_shard', chance: 0.4 },
      { id: 'pure_crystal', chance: 0.1 },
      { id: 'coins', min: 8, max: 20, chance: 1.0 },
    ],
    xp: 25, chapter: 1, map: 'map1',
    behavior: 'chase',
    spawnCondition: 'purity_10',
  },
  // BOSS
  pollution_king: {
    name: '오염왕', icon: '👹',
    desc: '모든 오염의 근원. 이 땅의 마지막 적.',
    hp: 500, dmg: 30, speed: 0.4, size: 32,
    color: '#420', color2: '#210',
    drops: [
      { id: 'pure_crystal', chance: 1.0 },
      { id: 'coins', min: 200, max: 500, chance: 1.0 },
    ],
    xp: 300, chapter: 1, map: 'map1',
    behavior: 'boss',
    spawnCondition: 'purity_70',
    isBoss: true,
    phases: 3,
  },
};

// ─── TROPHY SYSTEM ─────────────────────────────────────────────────────────
const TrophyDB = {
  first_clean: { name: '첫 발걸음', desc: '타일을 처음으로 정화했습니다.', icon: '🧹', rarity: 'common' },
  clean_100: { name: '정화 전문가', desc: '100개의 타일을 정화했습니다.', icon: '✨', rarity: 'rare' },
  plant_50: { name: '녹색 손가락', desc: '50그루의 식물을 심었습니다.', icon: '🌳', rarity: 'rare' },
  first_kill: { name: '첫 번째 전투', desc: '몬스터를 처음으로 처치했습니다.', icon: '⚔️', rarity: 'common' },
  kill_50: { name: '오염 사냥꾼', desc: '50마리의 몬스터를 처치했습니다.', icon: '🏹', rarity: 'epic' },
  catch_trash: { name: '쓰레기 수거원', desc: '떨어지는 쓰레기를 10번 잡았습니다.', icon: '🫳', rarity: 'common' },
  combo_10: { name: '콤보 마스터', desc: '10 콤보를 달성했습니다.', icon: '🔥', rarity: 'rare' },
  all_books: { name: '지식의 수호자', desc: '모든 환경 서적을 수집했습니다.', icon: '📚', rarity: 'legendary' },
  beat_boss: { name: '세계의 구원자', desc: '오염왕을 처치하고 세계를 구했습니다.', icon: '🌍', rarity: 'legendary' },
  purity_100: { name: '완벽한 정화', desc: '맵을 100% 정화했습니다.', icon: '💎', rarity: 'epic' },
  rich: { name: '부자', desc: '코인 1000개를 모았습니다.', icon: '🪙', rarity: 'rare' },
  speedrun: { name: '스피드러너', desc: '30분 이내에 클리어했습니다.', icon: '⏱️', rarity: 'legendary' },
};

const Trophies = {
  unlock(id) {
    Save.load();
    if (Save.d.trophies.includes(id)) return false;
    Save.d.trophies.push(id);
    Save.d.trophyNotif = id;
    Save.save();
    return true;
  },
  check(id) {
    return Save.g('trophies').includes(id);
  },
  getPending() {
    Save.load();
    const n = Save.d.trophyNotif;
    Save.d.trophyNotif = null;
    Save.save();
    return n;
  },
};

// ─── DIALOGUE / VISUAL NOVEL DATA ──────────────────────────────────────────
const StoryDialogues = {
  // Chapter 0: Introduction - Elder NPC appears
  intro: [
    { speaker: '???', portrait: 'elder',
      text: '...여기까지 왔구나.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '난 이 땅의 마지막 수호자, 대장로 아론이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '한때 이곳은 푸르른 초원과 맑은 강이 흐르는 아름다운 세계였지...' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '하지만 인류가 편리함만을 좇은 대가로, 세계는 오염에 잠식되었다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '공장의 매연이 하늘을 뒤덮고, 쓰레기가 대지를 뒤덮었어.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '오염이 깊어지자... 대지의 분노가 형체를 얻었다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '독성 슬라임, 쓰레기 골렘, 스모그 정령... 오염이 만들어낸 괴물들이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '그리고 모든 오염의 근원인 "오염왕"이 이 세계의 중심에 자리 잡았지.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '젊은이여, 네가 이 세계의 마지막 희망이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '네 임무는 세 가지다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '첫째, 오염된 대지를 정화하고 식물을 심어 생태계를 복원하라.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '둘째, 오염이 만들어낸 괴물들을 사냥하고, 그들이 남긴 재료를 수집하라.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '셋째, 하늘에서 끊임없이 떨어지는 쓰레기를 처리하고, 깨끗한 영역을 넓혀가라.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '대지의 70% 이상을 정화하면... 오염왕의 봉인이 풀릴 것이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '두려워하지 마라. 그것은 네가 충분히 강해졌다는 뜻이니까.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '자, 여기 기본 장비를 주마. 이 빗자루로 대지를 정화할 수 있다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '그리고 이것을 기억해라...' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '떨어진 책들을 찾아 읽어보거라. 이 세계가 어떻게 이렇게 되었는지 알 수 있을 것이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '행운을 빈다, 젊은이여. 이 세계의 미래가 네 손에 달려있다.' },
    { speaker: '', portrait: '',
      text: '[ 대장로 아론에게서 빗자루와 종자 팩을 받았습니다. ]' },
    { speaker: '', portrait: '',
      text: '[ 퀘스트가 활성화되었습니다. 화면 좌측 상단에서 목표를 확인하세요. ]' },
  ],

  // When first monster appears
  monster_guide: [
    { speaker: '대장로 아론', portrait: 'elder',
      text: '조심해라! 오염 괴물이 나타났다!' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '괴물 근처에서 공격 버튼(F키 또는 ⚔️ 버튼)을 눌러 싸울 수 있다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '처치하면 재료 아이템과 코인을 얻을 수 있으니 두려워 말고 도전해라!' },
  ],

  // When boss spawns
  boss_intro: [
    { speaker: '대장로 아론', portrait: 'elder',
      text: '느껴지나... 이 사악한 기운을...' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '오염왕이 나타났다! 이것이 마지막 전투다!' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '네가 지금까지 해온 모든 것이 이 순간을 위한 것이었다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '포기하지 마라! 이 세계는 네가 구할 수 있다!' },
  ],

  // After boss defeated
  victory: [
    { speaker: '대장로 아론', portrait: 'elder',
      text: '해냈구나...! 정말로 해냈어!' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '오염왕이 사라지면서, 대지에 생명이 돌아오고 있다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '저기 빛나는 포탈이 보이나? 저것이 정화된 세계로의 문이다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '가거라, 젊은이여. 네가 이 세계에 가져다 준 희망을 잊지 않겠다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '하지만 기억해라... 이 싸움은 게임 속에서만 일어나는 것이 아니다.' },
    { speaker: '대장로 아론', portrait: 'elder',
      text: '현실 세계에서도 우리 모두가 이 싸움의 주인공이라는 것을.' },
    { speaker: '', portrait: '',
      text: '[ 포탈로 이동하면 엔딩을 볼 수 있습니다. ]' },
  ],
};

// ─── BOOK DROP SYSTEM ──────────────────────────────────────────────────────
const BookIDs = ['book_ocean', 'book_air', 'book_forest', 'book_waste', 'book_future'];

// ─── UTILITY ───────────────────────────────────────────────────────────────
const CoreUtil = {
  rand: (a, b) => Math.random() * (b - a) + a,
  randInt: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
};

// ─── AUDIO HELPER ──────────────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function playBeep(freq, dur, type = 'sine', vol = 0.08) {
  if (!Save.g('soundEnabled')) return;
  try {
    const ac = getAudioCtx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ac.currentTime);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + dur);
  } catch (e) {}
}

// Export for modules if needed
if (typeof window !== 'undefined') {
  window.Save = Save;
  window.Inventory = Inventory;
  window.Quests = Quests;
  window.MapProgress = MapProgress;
  window.ItemDB = ItemDB;
  window.MonsterDB = MonsterDB;
  window.TrophyDB = TrophyDB;
  window.Trophies = Trophies;
  window.StoryDialogues = StoryDialogues;
  window.BookIDs = BookIDs;
  window.CoreUtil = CoreUtil;
  window.playBeep = playBeep;
  window.getAudioCtx = getAudioCtx;
}

console.log('[CORE] EcoRestore Core Engine loaded.');
