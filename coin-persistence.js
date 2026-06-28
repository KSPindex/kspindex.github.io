// ═══════════════════════════════════════════════════════════════════════════
// EcoRestore Coin Persistence Bridge
// - 모든 HTML(index/store/item/...)에서 같은 코인 값을 보게 만드는 단일 동기화 스크립트
// - DB 없이 localStorage + sessionStorage + window.name 캐시를 사용
// - 기존 ecorestore_save(Save 엔진)와도 양방향 동기화
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const CONFIG = {
    engineKey: 'ecorestore_save',
    windowNamePrefix: '__ECORESTORE_SAVE__:',
    coinKey: 'ecorestore_coins',          // legacy: 숫자 문자열
    coinKeyV2: 'ecorestore_coins_v2',     // { coins, updatedAt }
    defaultCoins: 50,
    pollInterval: 700,
    displaySelectors: [
      '#hCoin', '#hCoins', '#coins', '#coinCount', '#coin-display',
      '[data-coin]', '.coin-count', '.coins b'
    ]
  };

  let currentCoins = CONFIG.defaultCoins;
  let coinUpdatedAt = 0;
  let loadedOnce = false;
  let isSyncing = false;
  let pollStarted = false;

  function now() { return Date.now(); }
  function toInt(v, fallback = 0) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : fallback;
  }
  function storageGet(storage, key) {
    try { return storage ? storage.getItem(key) : null; } catch (e) { return null; }
  }
  function storageSet(storage, key, value) {
    try { if (storage) storage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function parseJSON(str) {
    try { return str ? JSON.parse(str) : null; } catch (e) { return null; }
  }
  function readWindowNameData() {
    try {
      const wn = String(window.name || '');
      if (!wn.startsWith(CONFIG.windowNamePrefix)) return null;
      return JSON.parse(decodeURIComponent(escape(atob(wn.slice(CONFIG.windowNamePrefix.length)))));
    } catch (e) { return null; }
  }
  function writeWindowNameData(data) {
    try {
      window.name = CONFIG.windowNamePrefix + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      return true;
    } catch (e) { return false; }
  }
  function coinTime(obj) {
    if (!obj) return 0;
    // 코인 전용 시간이 있는 경우에만 최신성 판단에 사용한다.
    // 일반 _updatedAt은 설정/인벤토리 저장만으로도 바뀌므로 코인 최신성으로 쓰면 안 된다.
    return toInt(obj._coinUpdatedAt || obj.coinUpdatedAt || obj.updatedAt || 0, 0);
  }
  function addCandidate(list, source, coins, updatedAt, priority) {
    const c = toInt(coins, NaN);
    if (!Number.isFinite(c)) return;
    list.push({ source, coins: Math.max(0, c), updatedAt: toInt(updatedAt, 0), priority: priority || 0 });
  }
  function bestCandidate(list) {
    if (!list.length) return null;
    list.sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
      return b.priority - a.priority;
    });
    return list[0];
  }

  function collectCoinCandidates() {
    const list = [];

    // 1) 현재 페이지의 Save 엔진
    if (window.Save && window.Save.d && typeof window.Save.d.coins !== 'undefined') {
      addCandidate(list, 'Save.d', window.Save.d.coins, coinTime(window.Save.d), 70);
    }

    // 2) localStorage 엔진 저장
    const engineObj = parseJSON(storageGet(window.localStorage, CONFIG.engineKey));
    if (engineObj && typeof engineObj.coins !== 'undefined') {
      addCandidate(list, 'localStorage engine', engineObj.coins, coinTime(engineObj), 60);
    }

    // 3) window.name 탭 캐시
    const tabObj = readWindowNameData();
    if (tabObj && typeof tabObj.coins !== 'undefined') {
      addCandidate(list, 'window.name engine', tabObj.coins, coinTime(tabObj), 65);
    }

    // 4) 코인 전용 v2 저장
    const coinObj = parseJSON(storageGet(window.localStorage, CONFIG.coinKeyV2));
    if (coinObj && typeof coinObj.coins !== 'undefined') {
      addCandidate(list, 'localStorage coin v2', coinObj.coins, coinObj.updatedAt, 80);
    }
    const coinObjS = parseJSON(storageGet(window.sessionStorage, CONFIG.coinKeyV2));
    if (coinObjS && typeof coinObjS.coins !== 'undefined') {
      addCandidate(list, 'sessionStorage coin v2', coinObjS.coins, coinObjS.updatedAt, 75);
    }

    // 5) legacy 숫자 저장. 시간이 없으므로 최후 fallback으로만 사용.
    const legacy = storageGet(window.localStorage, CONFIG.coinKey);
    if (legacy !== null && !Number.isNaN(Number(legacy))) {
      addCandidate(list, 'localStorage coin legacy', legacy, 0, 40);
    }
    const legacyS = storageGet(window.sessionStorage, CONFIG.coinKey);
    if (legacyS !== null && !Number.isNaN(Number(legacyS))) {
      addCandidate(list, 'sessionStorage coin legacy', legacyS, 0, 35);
    }

    return list;
  }

  function applyToSaveData(stamp) {
    if (!window.Save || !window.Save.d) return;
    window.Save.d.coins = currentCoins;
    window.Save.d.totalCoins = Math.max(toInt(window.Save.d.totalCoins, currentCoins), currentCoins);
    if (stamp !== false) window.Save.d._coinUpdatedAt = coinUpdatedAt || now();
  }

  function writeAllChannels(options) {
    options = options || {};
    const stamp = options.stamp !== false;
    if (stamp && !coinUpdatedAt) coinUpdatedAt = now();

    const payload = JSON.stringify({ coins: currentCoins, updatedAt: coinUpdatedAt });
    storageSet(window.localStorage, CONFIG.coinKeyV2, payload);
    storageSet(window.sessionStorage, CONFIG.coinKeyV2, payload);
    // 구버전 코드/브라우저 잔존 호환용
    storageSet(window.localStorage, CONFIG.coinKey, String(currentCoins));
    storageSet(window.sessionStorage, CONFIG.coinKey, String(currentCoins));

    applyToSaveData(stamp);

    // Save 엔진 전체 저장 데이터도 같이 갱신한다. Save.save()가 없어도 동작하게 직접 기록한다.
    let engineObj = null;
    if (window.Save && window.Save.d) engineObj = window.Save.d;
    else engineObj = parseJSON(storageGet(window.localStorage, CONFIG.engineKey)) || readWindowNameData() || {};

    engineObj.coins = currentCoins;
    engineObj.totalCoins = Math.max(toInt(engineObj.totalCoins, currentCoins), currentCoins);
    engineObj._coinUpdatedAt = coinUpdatedAt;
    engineObj._updatedAt = Math.max(toInt(engineObj._updatedAt, 0), coinUpdatedAt || now());

    storageSet(window.localStorage, CONFIG.engineKey, JSON.stringify(engineObj));
    writeWindowNameData(engineObj);
  }

  function updateDisplays() {
    try {
      CONFIG.displaySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!el) return;
          // 입력칸은 value, 일반 표시는 textContent
          if ('value' in el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) el.value = String(currentCoins);
          else el.textContent = String(currentCoins);
        });
      });
    } catch (e) {}
  }

  function loadCoins(force) {
    if (isSyncing && !force) return currentCoins;
    isSyncing = true;
    try {
      const best = bestCandidate(collectCoinCandidates());
      if (best) {
        currentCoins = best.coins;
        coinUpdatedAt = best.updatedAt || coinUpdatedAt || now();
      } else if (!loadedOnce) {
        currentCoins = CONFIG.defaultCoins;
        coinUpdatedAt = now();
      }
      loadedOnce = true;
      writeAllChannels({ stamp: false });
      updateDisplays();
      return currentCoins;
    } finally {
      isSyncing = false;
    }
  }

  function setCoins(value, options) {
    options = options || {};
    const next = Math.max(0, toInt(value, currentCoins));
    if (!loadedOnce && options.loadFirst !== false) loadCoins(true);
    currentCoins = next;
    coinUpdatedAt = options.updatedAt || now();
    writeAllChannels({ stamp: true });
    updateDisplays();
    return currentCoins;
  }

  function saveCoins() {
    if (isSyncing) return currentCoins;
    isSyncing = true;
    try {
      writeAllChannels({ stamp: true });
      updateDisplays();
      return currentCoins;
    } finally {
      isSyncing = false;
    }
  }

  // 기존 코드에서 사용하는 전역 API
  window.getCoins = function () {
    if (!loadedOnce) loadCoins(true);
    return currentCoins;
  };

  window.setCoins = function (value) {
    return setCoins(value);
  };

  window.addCoins = function (amount) {
    if (!loadedOnce) loadCoins(true);
    const add = toInt(amount, 0);
    return setCoins(currentCoins + add, { loadFirst: false });
  };

  window.spendCoins = function (amount) {
    if (!loadedOnce) loadCoins(true);
    const spend = Math.max(0, toInt(amount, 0));
    if (currentCoins < spend) return false;
    setCoins(currentCoins - spend, { loadFirst: false });
    return true;
  };

  // core.js의 Save.save()가 호출될 때 들어오는 동기화 훅.
  // 중요: 일반 저장(_updatedAt) 때문에 코인이 예전 값으로 덮이지 않도록 _coinUpdatedAt 기준으로만 판단한다.
  window.syncFromEngine = function () {
    if (isSyncing) return currentCoins;
    const sd = window.Save && window.Save.d ? window.Save.d : null;
    if (!sd || typeof sd.coins === 'undefined') return currentCoins;

    const saveCoinTime = coinTime(sd);
    if (!loadedOnce) loadCoins(true);

    if (saveCoinTime > coinUpdatedAt) {
      currentCoins = Math.max(0, toInt(sd.coins, currentCoins));
      coinUpdatedAt = saveCoinTime;
    } else {
      // 전용 코인 저장소가 더 최신이면 Save.d 쪽을 되살린다.
      sd.coins = currentCoins;
      sd.totalCoins = Math.max(toInt(sd.totalCoins, currentCoins), currentCoins);
      sd._coinUpdatedAt = coinUpdatedAt;
    }

    saveCoins();
    return currentCoins;
  };

  window.forceSaveCoins = saveCoins;
  window.forceLoadCoins = function () { return loadCoins(true); };

  function startPolling() {
    if (pollStarted) return;
    pollStarted = true;
    setInterval(() => {
      if (isSyncing) return;
      const best = bestCandidate(collectCoinCandidates());
      if (best && best.updatedAt > coinUpdatedAt) {
        currentCoins = best.coins;
        coinUpdatedAt = best.updatedAt;
        saveCoins();
      } else {
        updateDisplays();
      }
    }, CONFIG.pollInterval);
  }

  // 즉시 1차 로드: index.html의 게임 초기화가 load 이벤트보다 빨라도 50으로 튀지 않게 함.
  loadCoins(true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadCoins(true); startPolling(); updateDisplays(); });
  } else {
    loadCoins(true); startPolling(); updateDisplays();
  }
  window.addEventListener('load', () => { loadCoins(true); startPolling(); updateDisplays(); });
  window.addEventListener('storage', (ev) => {
    if ([CONFIG.engineKey, CONFIG.coinKey, CONFIG.coinKeyV2].includes(ev.key)) loadCoins(true);
  });
  window.addEventListener('beforeunload', saveCoins);
  window.addEventListener('pagehide', saveCoins);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveCoins();
    else loadCoins(true);
  });

  console.log('%c[Coin Persistence] ready: ' + currentCoins + ' coins', 'color:#22cc66');
})();
