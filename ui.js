// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — SHARED UI (ui.js)
//  Reusable UI components: Quest tracker, Combat system, HUD updates,
//  Monster AI, Drawing helpers. Load AFTER core.js + mapData.js
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

// ─── QUEST TRACKER UI ──────────────────────────────────────────────────────
const QuestUI = {
  render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const active = Quests.getActive().slice(0, 4);
    if (active.length === 0) {
      el.innerHTML = '<div class="qt-item" style="color:#666">활성 퀘스트 없음</div>';
      return;
    }
    el.innerHTML = active.map(q =>
      `<div class="qt-item${q.done ? ' qt-done' : ''}">
        <span class="qt-title">${q.icon || '🎯'} ${q.title}</span><br>
        <span class="qt-prog">${Math.min(q.current, q.target)}/${q.target}${q.done ? ' ✓' : ''}</span>
      </div>`
    ).join('');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  COMBAT SYSTEM (superBT 100) — Tension-driven combat with hit reactions
// ═══════════════════════════════════════════════════════════════════════════
const Combat = {
  // Heavy impact: brief frame freeze for impact feel
  hitStop(game, frames = 3) {
    game._hitStopFrames = (game._hitStopFrames || 0) + frames;
  },
  // Slow-motion for critical hits
  slowMo(game, frames = 8) {
    game._slowMoFrames = (game._slowMoFrames || 0) + frames;
  },
  // Brief screen tint
  flash(game, color = '#fff', alpha = 0.3, frames = 6) {
    game._flashColor = color;
    game._flashAlpha = alpha;
    game._flashFrames = frames;
  },

  attack(game) {
    if (game.plAtkCD > 0) return;

    const weaponId = Save.eq('weapon');
    const weapon = weaponId ? ItemDB[weaponId] : null;
    const baseDmg = weapon ? weapon.dmg : Save.g('basePower');
    const baseRange = weapon ? weapon.range * 15 : 25;
    const baseSpeed = weapon ? weapon.speed : 1.0;
    const dmgMult = 1 + Save.ub('WeaponDmg');
    const spdMult = 1 + Save.ub('WeaponSpd');

    const finalDmg = baseDmg * dmgMult;
    const finalRange = baseRange;
    const cooldown = Math.max(8, Math.floor(20 / (baseSpeed * spdMult)));

    game.plAtkCD = cooldown;
    game.plAttackAnim = 8;  // Attack swing animation frames
    game.plAttackDir = game.plDir;

    // Directional attack origin
    const dirOffsets = [[0, 12], [0, -12], [-12, 0], [12, 0]];
    const [ox, oy] = dirOffsets[game.plDir] || [0, 0];
    const ax = game.plx + ox;
    const ay = game.ply + oy;

    // Slash particles (visible attack motion)
    const slashColors = weapon ? ['#ff8', '#fa4', '#fff'] : ['#fff', '#ddd', '#aaa'];
    game.parts.emit(ax, ay, 8, {
      xa: ox ? ox * 0.4 : -3, xb: ox ? ox * 0.4 : 3,
      ya: oy ? oy * 0.4 : -3, yb: oy ? oy * 0.4 : 3,
      la: 8, lb: 18, sa: 1, sb: 3, cs: slashColors, g: 0.01, f: 0.92
    });

    // Sound
    if (weapon && weapon.dmg > 20) playBeep(140, 0.15, 'sawtooth', 0.1);
    else playBeep(220, 0.08, 'sawtooth', 0.06);

    // Hit detection
    let hitAny = false;
    let critHit = false;
    for (let i = game.monsters.length - 1; i >= 0; i--) {
      const m = game.monsters[i];
      const dist = CoreUtil.dist(ax, ay, m.x, m.y);

      if (dist < finalRange + m.sz / 2) {
        const critChance = 0.08 + Save.ub('Luck') * 0.5;
        const isCrit = Math.random() < critChance;
        if (isCrit) critHit = true;
        const dmg = isCrit ? finalDmg * 2 : finalDmg;

        m.hp -= dmg;

        // === MONSTER HIT REACTION ===
        m.hitFlash = 8;             // Flash white
        m.stunFrames = isCrit ? 12 : 6;  // Brief stun (can't move)
        m.recoilX = 0; m.recoilY = 0;  // Reset recoil
        const kbDist = isCrit ? 6 : 3;
        const kbAngle = Math.atan2(m.y - game.ply, m.x - game.plx);
        m.recoilX = Math.cos(kbAngle) * kbDist;
        m.recoilY = Math.sin(kbAngle) * kbDist;

        // Trigger aggro when hit
        m.aggro = true;
        m.aggroTimer = 240;  // Stay aggro for 4 seconds

        // BIG impact particles
        game.parts.emit(m.x, m.y, isCrit ? 12 : 7, {
          xa: -3, xb: 3, ya: -3, yb: 3, la: 8, lb: 18, sa: 1, sb: 3,
          cs: isCrit ? ['#ff0', '#fa0', '#fff', '#fe4'] : ['#f88', '#fa4', '#fff'], g: 0.04
        });

        // Damage text (bigger, more impactful for crit)
        const dmgText = isCrit ? Math.floor(dmg) + '!' : '-' + Math.floor(dmg);
        const dmgColor = isCrit ? '#ff0' : '#f88';
        const textSize = isCrit ? 18 : 14;  // Visual scale
        game.ftext.add(m.x, m.y - m.sz / 2 - 8, dmgText, dmgColor, isCrit ? 1.4 : 1);

        // Hit-stop for impact
        if (!isCrit) this.hitStop(game, 2);
        else { this.hitStop(game, 4); this.slowMo(game, 8); this.flash(game, '#ff0', 0.4, 8); }

        hitAny = true;

        if (m.hp <= 0 || m.hp < -1) {
          this.killMonster(game, i, isCrit);
          break;
        }
      }
    }

    if (!hitAny) {
      // Whiff — small dust particles at attack origin
      game.parts.emit(ax, ay, 3, { xa: -2, xb: 2, ya: -2, yb: 2, la: 4, lb: 10, sa: 1, sb: 1, cs: ['#888', '#aaa', '#fff'], g: 0.01 });
    }

    if (critHit) {
      game.ftext.add(game.plx, game.ply - 24, '💥 크리티컬!', '#ff0', 1.6);
      playBeep(330, 0.1, 'square', 0.12);
    }
  },

  killMonster(game, idx, isCrit = false) {
    if (!game || idx < 0 || idx >= game.monsters.length) return;
    const m = game.monsters[idx];
    if (!m) return;
    const md = MonsterDB[m.type] || ExtMonsters[m.type];
    if (!md) {
      if (game.registerKill) {
        game.registerKill(m.type || 'unknown', { x: m.x, y: m.y, showText: false });
      }
      game.monsters.splice(idx, 1);
      return;
    }

    // === DEATH EFFECTS — much more dramatic ===
    // Big explosion particles
    game.parts.emit(m.x, m.y, 20, {
      xa: -5, xb: 5, ya: -5, yb: 5, la: 8, lb: 18, sa: 2, sb: 5,
      cs: ['#f44', '#fa0', '#ff0', '#fff', md.color || '#888', '#f88'], g: 0.04
    });
    // Inner particles (fast fade)
    game.parts.emit(m.x, m.y, 10, {
      xa: -3, xb: 3, ya: -3, yb: 3, la: 4, lb: 10, sa: 1, sb: 2,
      cs: ['#fff', '#fe4', '#fff'], g: -0.05  // Float up
    });
    // Screen flash on boss kill
    if (md.isBoss) {
      this.flash(game, '#f88', 0.6, 12);
      this.hitStop(game, 8);
      this.slowMo(game, 20);
      game.ftext.add(game.plx, game.ply - 30, '💀 보스 격파!', '#f88', 1.8);
    } else {
      this.flash(game, '#fff', 0.15, 3);
    }

    playBeep(md.isBoss ? 80 : 180, md.isBoss ? 0.5 : 0.15, 'sawtooth', md.isBoss ? 0.15 : 0.08);

    // === DROPS ===
    md.drops.forEach(drop => {
      if (Math.random() < drop.chance) {
        if (drop.id === 'coins') {
          const n = CoreUtil.randInt(drop.min, drop.max);
          const bonus = isCrit ? 1.5 : 1;
          const finalN = Math.floor(n * bonus);
          game.earnCoins(finalN);
          game.ftext.add(m.x, m.y - 10, '+' + finalN + '🪙', '#fc0', isCrit ? 1.3 : 1);
        } else {
          Inventory.add(drop.id);
          const item = ItemDB[drop.id];
          game.ftext.add(m.x, m.y - 15, '+' + (item?.name || drop.id), '#8ff', 1);
          if (typeof Guide !== 'undefined' && Guide.shouldShow && Guide.shouldShow('item', drop.id)) {
            setTimeout(() => { if (typeof Guide !== 'undefined') Guide.show('item', drop.id); }, 500);
          }
        }
      }
    });

    // XP + Level up
    Save.load();
    const xpGain = md.xp * (isCrit ? 1.3 : 1);
    Save.d.xp += xpGain;
    if (game && typeof game.plHP === 'number' && game.plHP < game.plMaxHP) {
      game.plHP = Math.min(game.plMaxHP, game.plHP + 12);
      if (game.ftext) game.ftext.add(game.plx, game.ply - 10, '+12HP', '#4f8', 1.1);
    }
    while (Save.d.xp >= Save.d.xpNext) {
      Save.d.xp -= Save.d.xpNext;
      Save.d.level++;
      Save.d.xpNext = Math.floor(Save.d.xpNext * 1.5);
      Save.d.maxHP += 10;
      Save.d.maxEnergy += 5;
      game.plMaxHP = Save.d.maxHP;
      game.plMaxEn = Save.d.maxEnergy;
      game.ftext.add(game.plx, game.ply - 20, '⭐ LEVEL UP!', '#ff0', 1.4);
      playBeep(523, 0.15, 'triangle');
      setTimeout(() => playBeep(784, 0.1, 'triangle'), 150);
    }
    if (game.registerKill) {
      try { game.registerKill(m.type, { x: m.x, y: m.y }); }
      catch(e) { console.error('[registerKill]', e); }
    } else if (typeof MapProgress !== 'undefined') {
      try { MapProgress.addKill(1, m.type); }
      catch(e) { console.warn('[MapProgress.addKill]', e); }
    }

    // === BOSS KILL — special handling ===
    if (m.isBoss || md.isBoss) {
      Save.d.bossesDefeated.push(m.type);
      Save.setFlag('bossDefeated_' + m.type);
      const mapData = getCurrentMapData();
      if (mapData.nextMap) {
        game.portal = { col: mapData.portalPos[0], row: mapData.portalPos[1], target: mapData.nextMap };
        game.ftext.add(game.plx, game.ply - 25, '🌀 포탈 열림!', '#8af', 1.3);
        setTimeout(() => { if (typeof game.startVN === 'function') game.startVN(mapData.completionDialogue || 'victory'); }, 1500);
      } else {
        Trophies.unlock('beat_boss');
        game.portal = { col: mapData.portalPos[0], row: mapData.portalPos[1], target: 'ending' };
        setTimeout(() => { if (typeof game.startVN === 'function') game.startVN('victory'); }, 1500);
      }
    }

    // Special: split on death (smaller copies)
    if (md.special === 'split' && !m.isBoss) {
      for (let i = 0; i < 2; i++) {
        game.monsters.push({
          type: m.type, x: m.x + CoreUtil.rand(-15, 15), y: m.y + CoreUtil.rand(-15, 15),
          hp: md.hp * 0.3, maxHP: md.hp * 0.3, dmg: md.dmg * 0.5, speed: md.speed * 1.3,
          sz: md.size * 0.7, color: md.color, color2: md.color2, isBoss: false,
          vx: 0, vy: 0, moveT: 30, atkCD: 0, aggro: true, aggroTimer: 600,
          hitFlash: 0, phase: 1, stunFrames: 0, recoilX: 0, recoilY: 0
        });
      }
    }

    Save.save();
    game.monsters.splice(idx, 1);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  MONSTER AI (superBT 100) — Aggro zones, day/night, environmental feel
// ═══════════════════════════════════════════════════════════════════════════
const MonsterAI = {
  // Get aggro range for a monster (default 60px = 3 tiles)
  getAggroRange(md) {
    if (md.aggroRange !== undefined) return md.aggroRange;
    // Default based on monster type
    if (md.isBoss) return 90;
    if (md.behavior === 'chase') return 80;
    if (md.behavior === 'patrol') return 70;
    return 60;
  },

  update(game) {
    const mapData = getCurrentMapData();
    if (!mapData) return;

    if (game._lastMapId !== mapData.id) {
      game._lastMapId = mapData.id;
      game._mapSpawnedCount = 0;
      game._spawnClock = 150;
      game._initialSpawnDone = true;
    }

    if (game.state === 'playing' && !game.monsters.some(m => m.isBoss)) {
      if (typeof game._spawnClock !== 'number') game._spawnClock = 0;
      game._spawnClock++;
      if (game._spawnClock >= 180) {
        game._spawnClock = 0;
        const aliveNormals = game.monsters.filter(m => !m.isBoss).length;
        const tg = mapData?.goal?.target || 5;
        if ((game._mapSpawnedCount || 0) < tg && aliveNormals < 2) {
          this.spawnOneSequential(game, mapData);
          game._mapSpawnedCount = (game._mapSpawnedCount || 0) + 1;
        }
      }
    }

    const isNight = game.dayT < 0.25 || game.dayT > 0.75;
    const aggressionMod = isNight ? 1.4 : 1.0;

    if (typeof MapProgress !== 'undefined' && !game.portal) {
      const goalDone = MapProgress.isGoalComplete();
      const bossAlready = game.monsters.some(m => m.isBoss);
      const bossFlag = 'bossSpawned_' + mapData.id;
      if (goalDone && !bossAlready && !Save.flag(bossFlag)) {
        Save.setFlag(bossFlag);
        if (mapData.boss) {
          this.spawnMonster(game, mapData.boss.type);
          setTimeout(() => game.startVN('boss_intro'), 800);
        }
      }
    }

    for (const m of game.monsters) {
      this.updateOne(game, m, aggressionMod, isNight);
    }
  },

  spawnOneSequential(game, mapData) {
    if (!mapData || !mapData.monsters || mapData.monsters.length === 0) return;
    const idx = (game._mapSpawnedCount || 0) % mapData.monsters.length;
    const type = mapData.monsters[idx];
    this.spawnMonster(game, type);
  },

  spawnInitial(game) {
    const mapData = getCurrentMapData();
    if (!mapData || !mapData.monsters) return;
    const max = mapData.monsterMax || {};
    mapData.monsters.forEach(type => {
      const cap = max[type] || 1;
      const initialCount = Math.ceil(cap / 2) || 1;
      for (let i = 0; i < initialCount; i++) {
        this.spawnMonster(game, type);
      }
    });
    console.log(`[MonsterAI] Initial spawn: ${game.monsters.length} monsters for ${mapData.id}`);
  },

  refillMonsters(game) {
    const mapData = getCurrentMapData();
    if (!mapData || !mapData.monsters) return;
    if (game.state !== 'playing') return;
    if (game.monsters.some(m => m.isBoss)) return;

    const max = mapData.monsterMax || {};
    const aliveNormals = game.monsters.filter(m => !m.isBoss).length;
    const totalCap = Object.values(max).reduce((a, b) => a + b, 0);
    if (aliveNormals >= totalCap) return;

    const candidates = mapData.monsters.filter(type => {
      const alive = game.monsters.filter(m => m.type === type && !m.isBoss).length;
      return alive < (max[type] || 1);
    });
    if (candidates.length === 0) return;
    const type = candidates[Math.floor(Math.random() * candidates.length)];
    this.spawnMonster(game, type);
  },

  updateOne(game, m, aggressionMod = 1.0, isNight = false) {
    const md = MonsterDB[m.type] || ExtMonsters[m.type];
    if (!md) return;
    if (m.hitFlash > 0) m.hitFlash--;

    // Hit stun — can't move while stunned
    if (m.stunFrames && m.stunFrames > 0) {
      m.stunFrames--;
      // Apply recoil during stun
      if (m.recoilX || m.recoilY) {
        m.x = CoreUtil.clamp(m.x + m.recoilX * 0.3, m.sz, 400 - m.sz);
        m.y = CoreUtil.clamp(m.y + m.recoilY * 0.3, m.sz, 300 - m.sz);
        m.recoilX *= 0.7; m.recoilY *= 0.7;
      }
      return;
    }

    // Aggro timer countdown
    if (m.aggroTimer && m.aggroTimer > 0) m.aggroTimer--;

    // === AGGRO ZONE CHECK — player proximity triggers chase ===
    const distToPlayer = CoreUtil.dist(m.x, m.y, game.plx, game.ply);
    const aggroRange = this.getAggroRange(md) * aggressionMod;

    if (!m.aggro && distToPlayer < aggroRange) {
      // Just entered aggro zone!
      m.aggro = true;
      m.justAggroed = true;  // Visual indicator
      if (!m.isBoss && typeof game.ftext === 'object') {
        // Show "!" above monster
        game.ftext.add(m.x, m.y - m.sz - 8, '!', '#f44', 1.3);
      }
    } else if (m.aggro && m.aggroTimer <= 0 && distToPlayer > aggroRange * 2.5) {
      // Lost aggro — player too far for too long
      m.aggro = false;
    }

    // Movement AI
    if (--m.moveT <= 0) {
      m.moveT = CoreUtil.randInt(20, 60);
      if (md.behavior === 'boss') {
        this.bossAI(game, m, md, isNight);
      } else if (md.behavior === 'chase' || m.aggro) {
        // Chase player
        if (distToPlayer > 0) {
          const dx = game.plx - m.x;
          const dy = game.ply - m.y;
          const d = Math.hypot(dx, dy);
          m.vx = (dx / d) * m.speed * aggressionMod;
          m.vy = (dy / d) * m.speed * aggressionMod;
        }
      } else if (md.behavior === 'patrol') {
        const t = Date.now() * 0.001;
        m.vx = Math.sin(t + m.x * 0.1) * m.speed;
        m.vy = Math.cos(t + m.y * 0.1) * m.speed;
      } else {
        // Wander
        m.vx = CoreUtil.rand(-0.6, 0.6) * m.speed;
        m.vy = CoreUtil.rand(-0.6, 0.6) * m.speed;
      }
    }

    // Apply movement
    m.x = CoreUtil.clamp(m.x + m.vx, m.sz, 400 - m.sz);
    m.y = CoreUtil.clamp(m.y + m.vy, m.sz, 300 - m.sz);

    // Attack player on contact
    if (game.plInv <= 0 && m.atkCD <= 0) {
      const contactDist = m.sz / 2 + 7;
      if (CoreUtil.dist(game.plx, game.ply, m.x, m.y) < contactDist) {
        const dmg = Math.floor(m.dmg * (isNight ? 1.2 : 1.0));
        game.plHP = Math.max(0, game.plHP - dmg);
        game.plInv = 45;
        m.atkCD = md.isBoss ? 40 : 60;
        // Player hit reaction (no shake)
        game._playerHitStop = 4;
        game.flash && game.flash(game, '#f44', 0.2, 4);
        game.parts.emit(game.plx, game.ply, 5, {
          xa: -2, xb: 2, ya: -2, yb: 2, la: 8, lb: 15, sa: 1, sb: 2,
          cs: ['#f44', '#fff'], g: 0.02
        });
        game.ftext.add(game.plx, game.ply - 14, '-' + dmg, '#f88', 1.2);
        playBeep(100, 0.15, 'sawtooth', 0.1);
      }
    }
    if (m.atkCD > 0) m.atkCD--;

    // Special: corrupt
    if (md.special === 'corrupt' && Math.random() < 0.003) {
      const mc = Math.floor(m.x / 20);
      const mr = Math.floor(m.y / 20);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (game.tileAt && game.tileAt(mc + dc, mr + dr) === T.CLN && Math.random() < 0.3) {
            game.setTile(mc + dc, mr + dr, T.POL);
          }
        }
      }
    }
  },

  spawnMonster(game, type) {
    const md = MonsterDB[type] || ExtMonsters[type];
    if (!md) return;

    let sx = 0, sy = 0, attempts = 0;
    do {
      sx = CoreUtil.randInt(40, 360);
      sy = CoreUtil.randInt(40, 260);
      attempts++;
    } while (CoreUtil.dist(sx, sy, game.plx, game.ply) < 80 && attempts < 20);

    game.monsters.push({
      type, x: sx, y: sy,
      hp: md.hp, maxHP: md.hp,
      dmg: md.dmg, speed: md.speed, sz: md.size || 14,
      color: md.color, color2: md.color2,
      isBoss: md.isBoss || false,
      vx: 0, vy: 0, moveT: CoreUtil.randInt(20, 50),
      atkCD: 0, aggro: false, aggroTimer: 0, justAggroed: false,
      hitFlash: 0, stunFrames: 0, recoilX: 0, recoilY: 0,
      phase: 1,
    });

    if (!md.isBoss && !Save.g('discoveredMonsters').includes(type)) {
      Save.d.discoveredMonsters.push(type);
      Save.save();
    }
  },

  bossAI(game, m, md, isNight) {
    const distToPlayer = CoreUtil.dist(m.x, m.y, game.plx, game.ply);
    const hpPct = m.hp / m.maxHP;
    const aggressionMod = isNight ? 1.2 : 1.0;

    // Phase transitions — phase 2+ triggers automatically
    if (md.phases >= 3 && hpPct < 0.3 && m.phase < 3) {
      m.phase = 3;
      m.speed = md.speed * 1.5;
      game.ftext.add(m.x, m.y - m.sz, '⚠ 페이즈 3!', '#f44', 1.4);
      game.flash(game, '#f44', 0.3, 8);
      playBeep(80, 0.3, 'sawtooth', 0.15);
    } else if (md.phases >= 2 && hpPct < 0.6 && m.phase < 2) {
      m.phase = 2;
      m.speed = md.speed * 1.2;
      game.ftext.add(m.x, m.y - m.sz, '⚠ 페이즈 2!', '#fa0', 1.3);
      playBeep(100, 0.25, 'sawtooth', 0.12);
    }

    // Boss movement
    const t = Date.now() * 0.001;
    if (Math.sin(t * 0.5) > 0) {
      if (distToPlayer > 0) {
        const dx = game.plx - m.x;
        const dy = game.ply - m.y;
        const d = Math.hypot(dx, dy);
        m.vx = (dx / d) * m.speed * aggressionMod;
        m.vy = (dy / d) * m.speed * aggressionMod;
      }
    } else {
      const angle = Math.atan2(m.y - game.ply, m.x - game.plx) + 0.05;
      m.vx = Math.cos(angle) * m.speed * 0.8;
      m.vy = Math.sin(angle) * m.speed * 0.8;
    }

    if (m.phase >= 2 && Math.random() < 0.01) {
      const angle = Math.atan2(game.ply - m.y, game.plx - m.x);
      if (game.bossProjectiles) {
        game.bossProjectiles.push({
          x: m.x, y: m.y,
          vx: Math.cos(angle) * 2.5,
          vy: Math.sin(angle) * 2.5,
          dmg: Math.floor(md.dmg * 0.6),
          life: 120, sz: 4,
          color: md.color,
        });
      }
    }

    if (m.phase >= 3 && Math.random() < 0.005) {
      game.parts.emit(m.x, m.y, 20, {
        xa: -5, xb: 5, ya: -5, yb: 5, la: 15, lb: 30, sa: 2, sb: 5,
        cs: ['#f44', '#fa0', '#ff0'], g: 0.01
      });
      if (distToPlayer < 60) {
        game.plHP = Math.max(0, game.plHP - Math.floor(md.dmg * 0.5));
        game.plInv = 30;
      }
      playBeep(60, 0.3, 'sawtooth', 0.15);
    }
  },
};

// ─── DRAWING HELPERS ───────────────────────────────────────────────────────
const Draw = {
  monster(cx, m, frame) {
    const p = Math.floor(m.x), q = Math.floor(m.y);
    const pulse = Math.sin(frame * 0.05 + m.x) * 2;
    const flash = m.hitFlash > 0;

    // Shadow
    cx.fillStyle = 'rgba(0,0,0,0.2)';
    cx.fillRect(p - m.sz / 2, q + m.sz / 2 - 2, m.sz, 3);

    // Body
    cx.fillStyle = flash ? '#fff' : m.color;
    cx.fillRect(p - m.sz / 2, q - m.sz / 2 + pulse, m.sz, m.sz);
    if (!flash) {
      cx.fillStyle = m.color2;
      cx.fillRect(p - m.sz / 2 + 2, q - m.sz / 2 + 2 + pulse, m.sz - 4, m.sz - 4);
    }

    // Eyes
    cx.fillStyle = m.isBoss ? '#ff0' : '#f44';
    const eyeY = q - m.sz * 0.15 + pulse;
    cx.fillRect(p - m.sz * 0.2, eyeY, Math.max(2, m.sz * 0.12), Math.max(2, m.sz * 0.12));
    cx.fillRect(p + m.sz * 0.1, eyeY, Math.max(2, m.sz * 0.12), Math.max(2, m.sz * 0.12));

    // Boss glow
    if (m.isBoss) {
      cx.globalAlpha = 0.15 + Math.sin(frame * 0.04) * 0.05;
      cx.fillStyle = '#f44';
      cx.beginPath();
      cx.arc(p, q + pulse, m.sz * 0.7 + Math.sin(frame * 0.06) * 3, 0, Math.PI * 2);
      cx.fill();
      cx.globalAlpha = 1;
    }

    // HP bar
    const hpPct = m.hp / m.maxHP;
    const barW = m.sz + 4;
    cx.fillStyle = '#300';
    cx.fillRect(p - barW / 2, q - m.sz / 2 - 5, barW, 3);
    cx.fillStyle = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#ca4' : '#c44';
    cx.fillRect(p - barW / 2, q - m.sz / 2 - 5, Math.floor(barW * hpPct), 3);

    // Phase indicator for bosses
    if (m.isBoss && m.phase > 1) {
      cx.fillStyle = '#fa0';
      cx.font = '4px monospace';
      cx.fillText('P' + m.phase, p - 4, q - m.sz / 2 - 8);
    }
  },

  tile(cx, x, y, t, pal, frame) {
    const TS = 20;
    const h = ((x / TS * 7 + y / TS * 13) | 0) % 8;

    switch (t) {
      case T.POL: cx.fillStyle = pal.pol; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = 'rgba(150,180,50,0.3)'; cx.fillRect(x + 3 + h, y + 5, 1, 1);
        if ((frame + h) % 30 < 5) { cx.fillStyle = 'rgba(180,200,60,0.4)'; cx.fillRect(x + 8 + h, y + 3, 1, 1); }
        break;
      case T.CLN: cx.fillStyle = pal.cln; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = 'rgba(0,0,0,0.06)'; cx.fillRect(x + 4 + h, y + 8, 1, 1); break;
      case T.GRS: cx.fillStyle = pal.grs; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#5ab04a'; for (let i = 0; i < 3; i++) cx.fillRect(x + 4 + i * 6, y + 13, 1, 4); break;
      case T.T1: cx.fillStyle = pal.grs; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#6b4226'; cx.fillRect(x + 9, y + 10, 2, 8);
        cx.fillStyle = pal.t1; cx.fillRect(x + 6, y + 5, 8, 7); break;
      case T.T2: cx.fillStyle = pal.grs; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#6b4226'; cx.fillRect(x + 8, y + 8, 3, 10);
        cx.fillStyle = pal.t2; cx.fillRect(x + 4, y + 2, 12, 9); break;
      case T.T3: cx.fillStyle = pal.grs; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#6b4226'; cx.fillRect(x + 7, y + 6, 4, 12);
        cx.fillStyle = pal.t3; cx.fillRect(x + 2, y, 16, 10);
        cx.fillStyle = '#f66'; cx.fillRect(x + 4, y + 4, 2, 2); cx.fillRect(x + 14, y + 3, 2, 2); break;
      case T.FLR: cx.fillStyle = pal.grs; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#3a7a2a'; cx.fillRect(x + 9, y + 10, 1, 6);
        { const fc = h % 2 ? pal.f1 : pal.f2; cx.fillStyle = fc; cx.fillRect(x + 7, y + 8, 2, 2); cx.fillRect(x + 11, y + 8, 2, 2); }
        cx.fillStyle = '#fe0'; cx.fillRect(x + 9, y + 8, 2, 2); break;
      case T.TRS: cx.fillStyle = pal.pol; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#777'; cx.fillRect(x + 2, y + 10, 6, 6);
        cx.fillStyle = '#5ac'; cx.fillRect(x + 10, y + 8, 6, 8); break;
      case T.WAT: cx.fillStyle = '#2a4a6a'; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = frame % 20 < 10 ? 'rgba(100,180,255,0.3)' : 'rgba(80,160,235,0.25)';
        cx.fillRect(x + 2, y + 2, 16, 16); break;
      case T.ROK: cx.fillStyle = '#606060'; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#555'; cx.fillRect(x + 4, y + 4, 8, 8);
        cx.fillStyle = '#6a6a6a'; cx.fillRect(x + 5, y + 5, 3, 3); break;
      case T.SND: cx.fillStyle = '#c0a060'; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = '#b09050'; cx.fillRect(x + 5 + h, y + 7, 1, 1); break;
      case T.LAV: cx.fillStyle = '#8a2a0a'; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = frame % 30 < 15 ? '#fa4a0a' : '#e03a0a'; cx.fillRect(x + 3, y + 3, 14, 14);
        cx.fillStyle = '#fe8'; cx.fillRect(x + 8, y + 8, 2, 2); break;
      case T.ICE: cx.fillStyle = '#a0c0e0'; cx.fillRect(x, y, TS, TS);
        cx.fillStyle = 'rgba(200,230,255,0.3)'; cx.fillRect(x + 3, y + 3, 6, 6); break;
      case T.PORTAL:
        cx.globalAlpha = 0.3 + Math.sin(frame * 0.08) * 0.15;
        cx.fillStyle = '#8af'; cx.beginPath(); cx.arc(x + 10, y + 10, 8 + Math.sin(frame * 0.06) * 2, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x + 10, y + 10, 3, 0, Math.PI * 2); cx.fill();
        cx.globalAlpha = 1; break;
      default: cx.fillStyle = '#222'; cx.fillRect(x, y, TS, TS);
    }
  },

  player(cx, x, y, dir, frm, inv, cols) {
    if (inv > 0 && Math.floor(inv / 3) % 2) return;
    const p = Math.floor(x - 7), q = Math.floor(y - 10), wk = Math.floor(frm) % 2;
    const c = cols || ['#4a8a3a', '#3a7a2a', '#daa060'];
    cx.fillStyle = 'rgba(0,0,0,0.2)'; cx.fillRect(p + 2, q + 14, 10, 3);
    cx.fillStyle = '#4a3a1a'; cx.fillRect(p + 3, q + 12, 3, 2); cx.fillRect(p + 8, q + 12, 3, 2);
    if (wk) { cx.fillRect(p + 2, q + 12, 3, 2); cx.fillRect(p + 9, q + 12, 3, 2); }
    cx.fillStyle = c[1]; cx.fillRect(p + 4, q + 10, 2, 3); cx.fillRect(p + 8, q + 10, 2, 3);
    cx.fillStyle = c[0]; cx.fillRect(p + 3, q + 5, 8, 6);
    cx.fillStyle = c[1]; cx.fillRect(p + 5, q + 5, 4, 5);
    const ay = wk ? q + 6 : q + 7;
    cx.fillStyle = c[2]; cx.fillRect(p + 1, ay, 2, 4); cx.fillRect(p + 11, ay, 2, 4);
    cx.fillRect(p + 4, q + 1, 6, 5);
    cx.fillStyle = c[1]; cx.fillRect(p + 3, q - 1, 8, 2);
    cx.fillStyle = c[0]; cx.fillRect(p + 5, q - 2, 4, 1);
    const ex = dir === 2 ? -1 : dir === 3 ? 1 : 0;
    cx.fillStyle = '#111'; cx.fillRect(p + 5 + ex, q + 3, 1, 1); cx.fillRect(p + 8 + ex, q + 3, 1, 1);
    cx.fillStyle = '#a06030'; cx.fillRect(p + 6, q + 4, 2, 1);
  },

  trash(cx, x, y, n) {
    const p = Math.floor(x), q = Math.floor(y);
    switch (n) {
      case 'bottle': cx.fillStyle = '#6ab4e8'; cx.fillRect(p - 2, q - 5, 4, 8); cx.fillStyle = '#eee'; cx.fillRect(p - 1, q - 8, 2, 1); break;
      case 'bag': cx.fillStyle = '#ccc'; cx.fillRect(p - 4, q - 3, 8, 6); break;
      case 'tire': cx.fillStyle = '#333'; cx.fillRect(p - 4, q - 4, 8, 8); cx.fillStyle = '#1a1a1a'; cx.fillRect(p - 2, q - 2, 4, 4); break;
      case 'can': cx.fillStyle = '#c33'; cx.fillRect(p - 2, q - 3, 4, 6); break;
      case 'barrel': cx.fillStyle = '#a63'; cx.fillRect(p - 3, q - 4, 6, 8); break;
      case 'ewaste': cx.fillStyle = '#222'; cx.fillRect(p - 4, q - 3, 8, 6); cx.fillStyle = '#3a3'; cx.fillRect(p - 3, q - 2, 6, 4); break;
    }
  },

  book(cx, b, frame) {
    const p = Math.floor(b.x), q = Math.floor(b.y), bob = Math.sin(frame * 0.06 + b.x) * 2;
    cx.fillStyle = '#8a6a40'; cx.fillRect(p - 4, q - 5 + bob, 8, 10);
    cx.fillStyle = '#ca8'; cx.fillRect(p - 3, q - 4 + bob, 6, 8);
    if (frame % 30 < 10) { cx.fillStyle = 'rgba(255,255,200,0.5)'; cx.fillRect(p + 3, q - 7 + bob, 2, 2); }
  },

  portal(cx, x, y, frame) {
    const pulse = Math.sin(frame * 0.08) * 3;
    cx.globalAlpha = 0.3 + Math.sin(frame * 0.04) * 0.15;
    cx.fillStyle = '#8af'; cx.beginPath(); cx.arc(x * 20 + 10, y * 20 + 10, 10 + pulse, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x * 20 + 10, y * 20 + 10, 4 + pulse * 0.5, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = 1;
  },
};

// ─── HUD UPDATE HELPER ─────────────────────────────────────────────────────
const HUD = {
  update(game, stats) {
    const els = {
      hLv: Save.g('level'), hName: Save.g('playerName'),
      hHP: Math.floor(game.plHP), hEN: Math.floor(game.plEnergy),
      hW: Math.floor(game.plWater), hS: Math.floor(game.plSeeds),
      hCoin: game.coins, hScore: game.score,
      hRST: Math.floor(stats.pct * 100) + '%',
      hPOL: Math.floor((stats.pol + stats.tr) / stats.tot * 100) + '%',
      hTime: game.day + '일차',
      hCombo: game.combo > 1 ? 'x' + game.combo : '',
    };
    for (const [id, val] of Object.entries(els)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    // Bars
    const bHP = document.getElementById('bHP');
    if (bHP) bHP.style.width = (game.plHP / game.plMaxHP * 100) + '%';
    const bEN = document.getElementById('bEN');
    if (bEN) bEN.style.width = (game.plEnergy / game.plMaxEn * 100) + '%';
    const bRST = document.getElementById('bRST');
    if (bRST) bRST.style.width = Math.floor(stats.pct * 100) + '%';
    const bPOL = document.getElementById('bPOL');
    if (bPOL) bPOL.style.width = Math.floor((stats.pol + stats.tr) / stats.tot * 100) + '%';

    // Map name
    const hLvl = document.getElementById('hLvl');
    if (hLvl) {
      const md = getCurrentMapData();
      hLvl.textContent = md.name;
    }
  }
};

// Export
if (typeof window !== 'undefined') {
  window.QuestUI = QuestUI;
  window.Combat = Combat;
  window.MonsterAI = MonsterAI;
  window.Draw = Draw;
  window.HUD = HUD;
}

console.log('[UI] Shared UI components loaded.');
