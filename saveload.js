// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — SAVE/LOAD SLOT SYSTEM (saveload.js)
//  Supports 5 save slots. Each slot stores full game state snapshot.
//  Load AFTER core.js
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const SaveSlots = {
  MAX_SLOTS: 5,
  PREFIX: 'ecorestore_slot_',

  // Get metadata for all slots (without loading full data)
  getSlotInfo() {
    const slots = [];
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      try {
        const raw = localStorage.getItem(this.PREFIX + i);
        if (raw) {
          const d = JSON.parse(raw);
          slots.push({
            index: i,
            empty: false,
            name: d._slotName || ('슬롯 ' + (i + 1)),
            chapter: d.chapter || 0,
            level: d.level || 1,
            map: d.currentMap || 'map1',
            coins: d.coins || 0,
            playtime: d.playTimeSeconds || 0,
            date: d._saveDate || '알 수 없음',
            kills: d.totalKills || 0,
            purity: d._savePurity || 0,
          });
        } else {
          slots.push({ index: i, empty: true, name: '빈 슬롯 ' + (i + 1) });
        }
      } catch (e) {
        slots.push({ index: i, empty: true, name: '빈 슬롯 ' + (i + 1) });
      }
    }
    return slots;
  },

  // Save current game state to a slot
  saveToSlot(index, customName) {
    Save.load();
    const snapshot = JSON.parse(JSON.stringify(Save.d));
    snapshot._slotName = customName || ('슬롯 ' + (index + 1));
    snapshot._saveDate = new Date().toLocaleString('ko-KR');
    // Capture current purity if game is running
    if (typeof G !== 'undefined' && G.mapStats) {
      try { snapshot._savePurity = Math.floor(G.mapStats().pct * 100); } catch (e) { snapshot._savePurity = 0; }
    }
    try {
      localStorage.setItem(this.PREFIX + index, JSON.stringify(snapshot));
      return true;
    } catch (e) {
      console.error('Save to slot failed:', e);
      return false;
    }
  },

  // Load a slot into active save
  loadFromSlot(index) {
    try {
      const raw = localStorage.getItem(this.PREFIX + index);
      if (!raw) return false;
      const data = JSON.parse(raw);
      // Remove slot metadata before loading
      delete data._slotName;
      delete data._saveDate;
      delete data._savePurity;
      // Merge with defaults to handle missing keys
      Save.d = { ...Save.def, ...data };
      Save.save();
      return true;
    } catch (e) {
      console.error('Load from slot failed:', e);
      return false;
    }
  },

  // Delete a slot
  deleteSlot(index) {
    try {
      localStorage.removeItem(this.PREFIX + index);
      return true;
    } catch (e) { return false; }
  },

  // Format playtime
  formatTime(seconds) {
    if (!seconds) return '0분';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return h + '시간 ' + m + '분';
    return m + '분';
  },
};

if (typeof window !== 'undefined') window.SaveSlots = SaveSlots;
console.log('[SAVELOAD] Save/Load slot system loaded.');
