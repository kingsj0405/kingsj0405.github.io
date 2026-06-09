// games/agent.js — shared agentic bridge for EXAONE computer-use simulation data.
//
// Every game on /games/ exposes a uniform `window.Agent` so a headless harness
// (e.g. Playwright) can read state, enumerate legal actions, drive the game
// deterministically, and grab frames — the same convention used by /unciv/.
//
// Uniform contract (set by AgentKit.register):
//   Agent.game          -> string id ("2048", "sokoban", ...)
//   Agent.version       -> string
//   Agent.getState()    -> JSON-serializable snapshot (includes `seed`)
//   Agent.getActions()  -> array of legal action descriptors for the current state
//   Agent.dispatch(a)   -> apply action `a`; returns true if state changed
//   Agent.reset(seed?)  -> start a fresh, reproducible game (seed = number|string)
//   Agent.isTerminal()  -> boolean (game over / win)
//   Agent.getScore()    -> number
//   Agent.captureFrame()-> dataURL PNG of the play canvas (or null)
//   Agent.observe()     -> { game, state, actions, terminal, score }
//
// Human input and agent actions share the SAME internal action path, so logged
// trajectories match what a person would do. Each dispatch emits an
// `agent:step` CustomEvent on window; `agent:ready` fires once on registration.
(function (global) {
  'use strict';

  // Deterministic, seedable PRNG (mulberry32) — reproducible trajectories.
  function rng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hash an arbitrary seed (string/number) to a uint32.
  function hashSeed(v) {
    if (typeof v === 'number' && isFinite(v)) return v >>> 0;
    const str = String(v);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Set up a crisp, DPR-aware 2D canvas. Returns the context (already scaled so
  // you draw in CSS pixels). Call again on resize.
  function fitCanvas(canvas, cssW, cssH) {
    const dpr = global.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // Register a game's API as window.Agent, filling in conveniences + events.
  function register(api) {
    const required = ['game', 'getState', 'getActions', 'dispatch', 'reset', 'isTerminal'];
    for (const k of required) {
      if (typeof api[k] === 'undefined') console.warn('[AgentKit] game is missing `' + k + '`');
    }
    api.version = api.version || '1.0';
    if (!api.getScore) api.getScore = function () { return 0; };

    if (!api.captureFrame && api.canvas) {
      api.captureFrame = function () {
        try { return api.canvas.toDataURL('image/png'); } catch (e) { return null; }
      };
    }
    if (!api.observe) {
      api.observe = function () {
        return {
          game: api.game,
          state: api.getState(),
          actions: api.getActions(),
          terminal: api.isTerminal(),
          score: api.getScore()
        };
      };
    }

    // Wrap dispatch to emit a step event for headless data capture.
    const rawDispatch = api.dispatch.bind(api);
    api.dispatch = function (action) {
      const wasTerminal = api.isTerminal();
      const changed = !!rawDispatch(action);
      try {
        global.dispatchEvent(new CustomEvent('agent:step', {
          detail: {
            game: api.game, action: action, changed: changed,
            terminal: api.isTerminal(), score: api.getScore(), wasTerminal: wasTerminal
          }
        }));
      } catch (e) { /* CustomEvent unsupported — ignore */ }
      return changed;
    };

    global.Agent = api;
    try {
      global.dispatchEvent(new CustomEvent('agent:ready', { detail: { game: api.game } }));
    } catch (e) { /* ignore */ }
    return api;
  }

  global.AgentKit = { rng: rng, hashSeed: hashSeed, fitCanvas: fitCanvas, register: register };
})(window);
