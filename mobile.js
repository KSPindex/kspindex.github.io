// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — MOBILE CONTROLS (mobile.js)
//  Touch-first control system. Loaded by index.html AFTER game init.
//  FIXED:
//   - applyVisibility now auto-tracks state changes
//   - Joystick properly handles multi-touch and out-of-zone drags
//   - All buttons respect current game state
//   - Larger touch targets, better touch feedback
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const Mobile = {
  // Joystick state
  joy: { on: false, dx: 0, dy: 0 },
  joyTouchId: null,

  enabled: true,
  initialized: false,

  // Internal references (set on init)
  game: null,

  init(game) {
    if (this.initialized) return;
    this.initialized = true;
    this.game = game;

    Save.load();
    const isTouch = (typeof matchMedia === 'function' &&
      matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);
    const setting = Save.g('mobileUI');
    // Default ON on touch devices, respect setting otherwise
    this.enabled = (setting === undefined || setting === null) ? isTouch : setting;

    this.setupJoystick();
    this.setupButtons();
    this.setupVisibilityHook();
    this.applyVisibility();

    // Prevent pinch-zoom and double-tap zoom on the game area
    const cv = document.getElementById('C');
    if (cv) {
      cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
      // Disable iOS double-tap zoom on canvas
      let lastTap = 0;
      cv.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTap < 300) e.preventDefault();
        lastTap = now;
      }, { passive: false });
    }
  },

  // Watch game state and update visibility automatically
  setupVisibilityHook() {
    // Poll state once per second (lightweight)
    setInterval(() => {
      if (this.game && this.game.state !== this._lastSeenState) {
        this._lastSeenState = this.game.state;
        this.applyVisibility();
      }
    }, 200);
  },

  applyVisibility() {
    const mob = document.getElementById('mobCtrl');
    const hints = document.getElementById('keyHints');
    const game = this.game || window.G;
    if (!game) return;

    const isPlayable = game.state === 'playing' || game.state === 'paused';
    if (mob) mob.style.display = (this.enabled && isPlayable) ? 'block' : 'none';
    if (hints) hints.style.display = this.enabled ? 'none' : '';
  },

  toggle(val) {
    this.enabled = val;
    Save.s('mobileUI', val);
    this.applyVisibility();
    const _g = this.game || (typeof window !== "undefined" && window.G); if (_g && _g.joy) {
      // Reset joystick state when toggling off
      if (!val) {
        this.joy.on = false; this.joy.dx = 0; this.joy.dy = 0;
        _g.joy = this.joy;
        const jk = document.getElementById('joyKnob');
        if (jk) { jk.style.left = '32px'; jk.style.top = '32px'; }
      }
    }
  },

  // ── JOYSTICK ────────────────────────────────────────────────────────────
  setupJoystick() {
    const jz = document.getElementById('joyZone');
    const jk = document.getElementById('joyKnob');
    if (!jz || !jk) return;

    const jzRect = () => jz.getBoundingClientRect();
    const RADIUS = 40;   // movement radius for knob
    const DEAD = 6;      // dead zone

    const handleMove = (clientX, clientY) => {
      const r = jzRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > RADIUS) {
        dx = (dx / dist) * RADIUS;
        dy = (dy / dist) * RADIUS;
      }
      // Visual knob (centered in 100x100 zone, knob is 32px so subtract half)
      jk.style.transform = `translate(${dx}px, ${dy}px)`;
      // Input vector
      const norm = Math.min(dist / RADIUS, 1);
      if (norm < DEAD / RADIUS) {
        this.joy.dx = 0; this.joy.dy = 0; this.joy.on = false;
      } else {
        this.joy.dx = dx / RADIUS;
        this.joy.dy = dy / RADIUS;
        this.joy.on = true;
      }
      if (window.G) _g.joy = this.joy;
    };

    const start = e => {
      if (!this.enabled || !this.isPlayable()) return;
      e.preventDefault();
      if (this.joyTouchId !== null) return; // already tracking
      const t = e.changedTouches[0];
      this.joyTouchId = t.identifier;
      jk.classList.add('active');
      handleMove(t.clientX, t.clientY);
    };

    const move = e => {
      if (this.joyTouchId === null) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          handleMove(t.clientX, t.clientY);
          break;
        }
      }
    };

    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          this.joyTouchId = null;
          this.joy.on = false; this.joy.dx = 0; this.joy.dy = 0;
          jk.style.transform = '';
          jk.classList.remove('active');
          if (window.G) _g.joy = this.joy;
          break;
        }
      }
    };

    jz.addEventListener('touchstart', start, { passive: false });
    jz.addEventListener('touchmove', move, { passive: false });
    jz.addEventListener('touchend', end, { passive: false });
    jz.addEventListener('touchcancel', end, { passive: false });

    // Also support mouse drag (dev testing)
    let mouseDown = false;
    jz.addEventListener('mousedown', e => {
      if (!this.enabled || !this.isPlayable()) return;
      e.preventDefault();
      mouseDown = true;
      jk.classList.add('active');
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.joy.on = false; this.joy.dx = 0; this.joy.dy = 0;
      jk.style.transform = '';
      jk.classList.remove('active');
      if (window.G) _g.joy = this.joy;
    });
  },

  isPlayable() {
    const g = this.game || (typeof window !== 'undefined' && window.G);
    return g && (g.state === 'playing' || g.state === 'paused');
  },

  // ── ACTION BUTTONS ──────────────────────────────────────────────────────
  setupButtons() {
    const game = () => this.game || window.G;

    // Attack button
    this.bindButton('mAtk', () => {
      const g = game();
      if (g?.state === 'playing') g.doAttack();
      this.haptic(20);
    });

    // Clean button
    this.bindButton('mCln', () => {
      const g = game();
      if (g?.state === 'playing') g.doClean();
      this.haptic(10);
    });

    // Plant button
    this.bindButton('mPlt', () => {
      const g = game();
      if (g?.state === 'playing') g.doPlant();
      this.haptic(10);
    });

    // Catch button
    this.bindButton('mCat', () => {
      const g = game();
      if (g?.state === 'playing') g.doCatch();
      this.haptic(15);
    });

    // Inventory button
    this.bindButton('mInv', () => {
      const g = game();
      if (!g) return;
      if (g.state === 'playing' || g.state === 'paused') {
        const inv = document.getElementById('invOverlay');
        if (inv?.classList.contains('show')) g.closeInv();
        else g.openInv();
        this.haptic(15);
      }
    });

    // Pause button (in mobile ctrl)
    this.bindButton('mPause', () => {
      const g = game();
      if (!g) return;
      if (g.state === 'playing') g.pause();
      else if (g.state === 'paused') g.resume();
      this.haptic(25);
      this.applyVisibility();
    });

    // Floating pause button (when mobile ctrl is hidden)
    const pauseMob = document.getElementById('pauseMob');
    if (pauseMob) {
      pauseMob.addEventListener('click', e => {
        e.stopPropagation();
        const g = game();
        if (!g) return;
        if (g.state === 'playing') g.pause();
        else if (g.state === 'paused') g.resume();
        this.haptic(25);
      });
    }
  },

  bindButton(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    const press = e => {
      if (!this.enabled) return;
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('pressed');
      fn();
    };
    const release = e => {
      e.preventDefault();
      el.classList.remove('pressed');
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    // Click as fallback (mouse / accessibility)
    el.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });
  },

  // Tiny vibration on tap if supported
  haptic(ms = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  },
};

if (typeof window !== 'undefined') window.Mobile = Mobile;
