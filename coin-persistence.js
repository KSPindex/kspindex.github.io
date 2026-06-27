(function() {
  'use strict';

  const CONFIG = {
    saveKey: 'ecorestore_coins', // 게임 이름 전용 코인 저장 키
    engineKey: 'ecorestore_save', // 핵심 엔진 저장 키
    defaultCoins: 50,
    pollInterval: 500, // 0.5초마다 초고속 동기화
    watchedVars: ['coins', 'coin', 'coinCount', 'playerCoins', 'money', 'score'],
    displaySelectors: [
      '#coins', '#coin', '#coinCount', '#coin-display',
      '.coins b', '.coin', '.coin-count', '[data-coin]',
      '#hCoin', '#hCoins'
    ]
  };

  let currentCoins = CONFIG.defaultCoins;
  let isInternalSyncing = false;

  function tryParseJSON(str) {
    try { return str ? JSON.parse(str) : null; } catch(e) { return null; }
  }

  function readWindowNameData() {
    try {
      const wn = String(window.name || '');
      const prefix = '__ECORESTORE_SAVE__:';
      if (!wn.startsWith(prefix)) return null;
      return JSON.parse(decodeURIComponent(escape(atob(wn.slice(prefix.length)))));
    } catch(e) { return null; }
  }

  function loadCoins() {
    if (isInternalSyncing) return;
    isInternalSyncing = true;
    try {
      let foundCoins = null;
      let latestTime = -1;

      // 1. Check window.Save.d
      if (window.Save && window.Save.d && typeof window.Save.d.coins === 'number') {
        foundCoins = window.Save.d.coins;
        latestTime = window.Save.d._updatedAt || Date.now();
      }

      // 2. Check localStorage engine key
      const engineObj = tryParseJSON(localStorage.getItem(CONFIG.engineKey));
      if (engineObj && typeof engineObj.coins === 'number') {
        const t = engineObj._updatedAt || 0;
        if (t >= latestTime || foundCoins === null) {
          foundCoins = engineObj.coins;
          latestTime = t;
        }
      }

      // 3. Check window.name
      const wnObj = readWindowNameData();
      if (wnObj && typeof wnObj.coins === 'number') {
        const t = wnObj._updatedAt || 0;
        if (t > latestTime || foundCoins === null) {
          foundCoins = wnObj.coins;
          latestTime = t;
        }
      }

      // 4. Check dedicated saveKey
      const rawDedicated = localStorage.getItem(CONFIG.saveKey);
      if (rawDedicated !== null && !isNaN(parseInt(rawDedicated, 10))) {
        if (foundCoins === null) foundCoins = parseInt(rawDedicated, 10);
      }

      // 5. Check sessionStorage
      const rawSession = sessionStorage.getItem(CONFIG.saveKey);
      if (rawSession !== null && !isNaN(parseInt(rawSession, 10))) {
        if (foundCoins === null) foundCoins = parseInt(rawSession, 10);
      }

      if (foundCoins !== null) {
        currentCoins = parseInt(foundCoins, 10);
      }

      syncGlobals();
      updateDisplays();
      console.log('%c[Coin Persistence] 로드됨 → ' + currentCoins + ' 코인', 'color:#22cc66');
    } finally {
      isInternalSyncing = false;
    }
  }

  function syncGlobals() {
    // Mirror to global watchedVars if they exist or are needed
    for (let varName of CONFIG.watchedVars) {
      if (window[varName] !== undefined && typeof window[varName] === 'number') {
        window[varName] = currentCoins;
      }
    }
    // Mirror to window.Save
    if (window.Save && window.Save.d) {
      window.Save.d.coins = currentCoins;
    }
  }

  function saveCoins() {
    if (isInternalSyncing) return;
    isInternalSyncing = true;
    try {
      const val = parseInt(currentCoins, 10);
      if (isNaN(val)) return;

      localStorage.setItem(CONFIG.saveKey, val);
      sessionStorage.setItem(CONFIG.saveKey, val);

      // Update core engine storage
      if (window.Save && window.Save.d) {
        window.Save.d.coins = val;
        window.Save.d.totalCoins = Math.max(window.Save.d.totalCoins || 0, val);
        window.Save.save(true);
      } else {
        const engineObj = tryParseJSON(localStorage.getItem(CONFIG.engineKey)) || {};
        engineObj.coins = val;
        engineObj.totalCoins = Math.max(engineObj.totalCoins || 0, val);
        engineObj._updatedAt = Date.now();
        try { localStorage.setItem(CONFIG.engineKey, JSON.stringify(engineObj)); } catch(e){}
        try {
          const prefix = '__ECORESTORE_SAVE__:';
          window.name = prefix + btoa(unescape(encodeURIComponent(JSON.stringify(engineObj))));
        } catch(e){}
      }
    } finally {
      isInternalSyncing = false;
    }
  }

  function updateDisplays() {
    CONFIG.displaySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el && el.textContent !== String(currentCoins)) {
          el.textContent = currentCoins;
        }
      });
    });
  }

  // 전역 함수 제공 (기존 코드 수정 최소화용)
  window.addCoins = function(amount) {
    const addAmt = Math.floor(Number(amount) || 0);
    currentCoins = Math.max(0, currentCoins + addAmt);
    syncGlobals();
    saveCoins();
    updateDisplays();
    return currentCoins;
  };

  window.spendCoins = function(amount) {
    const spendAmt = Math.floor(Number(amount) || 0);
    if (currentCoins >= spendAmt) {
      currentCoins -= spendAmt;
      syncGlobals();
      saveCoins();
      updateDisplays();
      return true;
    }
    return false;
  };

  window.getCoins = function() {
    return currentCoins;
  };

  window.syncFromEngine = function() {
    if (isInternalSyncing) return;
    if (window.Save && window.Save.d && typeof window.Save.d.coins === 'number') {
      currentCoins = window.Save.d.coins;
      localStorage.setItem(CONFIG.saveKey, currentCoins);
      sessionStorage.setItem(CONFIG.saveKey, currentCoins);
      syncGlobals();
      updateDisplays();
    }
  };

  function startPolling() {
    setInterval(() => {
      if (isInternalSyncing) return;

      let changed = false;

      // 1. Check window.Save.d
      if (window.Save && window.Save.d && typeof window.Save.d.coins === 'number') {
        if (window.Save.d.coins !== currentCoins) {
          currentCoins = window.Save.d.coins;
          changed = true;
        }
      }

      // 2. Check watchedVars
      if (!changed) {
        for (let varName of CONFIG.watchedVars) {
          if (window[varName] !== undefined && typeof window[varName] === 'number' && window[varName] !== currentCoins) {
            currentCoins = window[varName];
            changed = true;
            break;
          }
        }
      }

      if (changed) {
        syncGlobals();
        saveCoins();
      }

      updateDisplays();
    }, CONFIG.pollInterval);
  }

  window.addEventListener('load', () => {
    loadCoins();
    startPolling();
  });

  window.addEventListener('beforeunload', saveCoins);
  window.addEventListener('pagehide', saveCoins);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveCoins();
    else loadCoins();
  });

  window.forceSaveCoins = saveCoins;
  console.log('%c[Coin Persistence] 스크립트 로드 완료', 'color:#0099ff');
})();
