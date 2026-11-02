/**
 * City soundtrack — a playlist that carries over from scene to scene.
 * The first tracks are generated live in the browser (js/live-music.js: no audio file, no bandwidth);
 * Rain Alley is the default. A live track never ends, so after LIVE_SECS the playlist moves on to the
 * next live one, and never on its own to an mp3: the Moby tracks only download when someone picks one. Two <audio> elements crossfade
 * the mp3s; volume-based, no Web Audio API for them.
 *
 * Music is on by default for a new visitor and starts with their first click (browsers allow no
 * sound before that). Turning it off is remembered, and so is turning it on.
 */
(function () {
  'use strict';

  var isInFrame = false;
  try {
    isInFrame = window.top && window.top !== window;
  } catch (_) {
    isInFrame = true;
  }
  if (isInFrame) return;

  var TRACKS = [
    { live: 'rain-alley', name: 'Rain Alley (live synth)' },
    { live: 'night-drive', name: 'Night Drive (live synth)' },
    { live: 'ghost-signal', name: 'Ghost Signal (live synth)' },
    { src: 'audio/lights.mp3', name: 'Bring the Big Lights' },
    { src: 'audio/aeron.mp3', name: 'Aeron 95' },
    { src: 'audio/discontent.mp3', name: 'Discontent' }
  ];

  var VOLUME = 0.38;
  var FADE_MS = 1200;
  var XFADE_MS = 2000;
  var LIVE_SECS = 270;
  var liveSecs = 0;

  var storedChoice = null;
  try { storedChoice = localStorage.getItem('city-music-enabled'); } catch (_) {}
  var enabled = storedChoice !== 'off';

  var armed = false;
  // A scene can hold the soundtrack (the listening booth is soundproof): while held nothing
  // starts it — not a click, not the tab coming back. Releasing lets it play again.
  var held = false;
  var userPaused = false;
  var gestureSeen = false;
  var announced = false;
  var trackIdx = 0;
  var xfading = false;

  var players = [new Audio(), new Audio()];
  var activeSlot = 0;
  var fades = [];

  function live() { return window.__CITY_LIVE_MUSIC__ || null; }
  function isLive(i) { return !!TRACKS[i].live; }
  function hasActivation() {
    try { if (navigator.userActivation) return navigator.userActivation.hasBeenActive; } catch (_) {}
    return gestureSeen;
  }
  function shouldPlay() {
    return enabled && !held && !userPaused && !document.hidden && hasActivation();
  }

  function clearAllFades() {
    for (var i = 0; i < fades.length; i++) clearInterval(fades[i]);
    fades = [];
  }

  function fade(el, from, to, ms, done) {
    from = Math.max(0, Math.min(1, from));
    to = Math.max(0, Math.min(1, to));
    el.volume = from;
    if (ms <= 0) {
      el.volume = to;
      if (done) done();
      return 0;
    }
    var start = Date.now();
    var id = setInterval(function () {
      var t = Math.min(1, (Date.now() - start) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t >= 1) {
        clearInterval(id);
        var idx = fades.indexOf(id);
        if (idx !== -1) fades.splice(idx, 1);
        if (done) done();
      }
    }, 40);
    fades.push(id);
    return id;
  }

  function activeEl() { return players[activeSlot]; }

  function mp3Playing() { var el = activeEl(); return !el.paused && !!el.currentSrc; }

  function fadeOutMp3(ms) {
    var el = activeEl();
    if (el.paused) return;
    clearAllFades();
    fade(el, el.volume, 0, ms, function () { el.pause(); });
  }

  function startMp3(i) {
    var el = activeEl();
    clearAllFades();
    if (el.dataset.track === String(i) && el.currentSrc) {
      // Same track, paused: carry on where it was.
      if (!el.paused) return;
      el.volume = 0;
      el.play().catch(function () {});
      fade(el, 0, VOLUME, FADE_MS);
      return;
    }
    function load() {
      el.src = TRACKS[i].src;
      el.dataset.track = String(i);
      el.load();
      el.volume = 0;
      el.play().catch(function () {});
      fade(el, 0, VOLUME, FADE_MS);
    }
    if (!el.paused) fade(el, el.volume, 0, 400, function () { el.pause(); load(); });
    else load();
  }

  // Make what's heard match the state: the current track playing, or silence.
  function apply() {
    var l = live();
    if (!shouldPlay()) {
      if (l) l.stop();
      fadeOutMp3(400);
      return;
    }
    if (isLive(trackIdx)) {
      fadeOutMp3(600);
      if (l) l.play(TRACKS[trackIdx].live, VOLUME);
    } else {
      if (l) l.stop();
      startMp3(trackIdx);
    }
    notifyTrack();
    if (!announced) {
      announced = true;
      // First sound of the visit: the shell can point at the music button.
      try { window.dispatchEvent(new CustomEvent('city-music-start', { detail: { auto: storedChoice === null } })); } catch (_) {}
    }
  }

  function crossfadeToNext() {
    if (xfading || !shouldPlay() || isLive(trackIdx)) return;
    var nextTrack = (trackIdx + 1) % TRACKS.length;
    if (isLive(nextTrack)) {
      trackIdx = nextTrack;
      liveSecs = 0;
      apply();
      return;
    }
    xfading = true;

    var oldEl = players[activeSlot];
    var newSlot = (activeSlot + 1) % 2;
    var newEl = players[newSlot];

    newEl.src = TRACKS[nextTrack].src;
    newEl.dataset.track = String(nextTrack);
    newEl.volume = 0;

    function go() {
      newEl.removeEventListener('canplaythrough', go);
      xfading = false;
      if (!shouldPlay()) return;
      trackIdx = nextTrack;
      activeSlot = newSlot;

      fade(oldEl, oldEl.volume, 0, XFADE_MS, function () {
        oldEl.pause();
        oldEl.removeAttribute('src');
        delete oldEl.dataset.track;
        oldEl.load();
      });
      newEl.play().catch(function () {});
      fade(newEl, 0, VOLUME, XFADE_MS);
      notifyTrack();
    }

    if (newEl.readyState >= 4) {
      go();
    } else {
      newEl.addEventListener('canplaythrough', go, { once: true });
      newEl.load();
    }
  }

  function onTimeUpdate(e) {
    var el = activeEl();
    if (e.target !== el || !el.duration || xfading) return;
    var remaining = el.duration - el.currentTime;
    if (remaining > 0 && remaining <= (XFADE_MS / 1000) + 0.3) {
      crossfadeToNext();
    }
  }

  function onEnded(e) {
    if (e.target === activeEl() && !xfading && enabled) crossfadeToNext();
  }

  function notifyTrack() {
    try {
      var btn = document.getElementById('music-toggle');
      if (btn) btn.title = 'Music — ' + TRACKS[trackIdx].name;
    } catch (_) {}
  }

  function setEnabled(on) {
    enabled = !!on;
    if (enabled) userPaused = false;
    try {
      localStorage.setItem('city-music-enabled', enabled ? 'on' : 'off');
      storedChoice = enabled ? 'on' : 'off';
    } catch (_) {}
    apply();
    if (!enabled) {
      setTimeout(function () {
        if (enabled) return;
        for (var i = 0; i < players.length; i++) {
          players[i].pause();
          players[i].removeAttribute('src');
          delete players[i].dataset.track;
          players[i].load();
        }
      }, 450);
    }
  }

  // Called on a user gesture (or on load, if the page was already used): sound is allowed now.
  function kick() {
    gestureSeen = true;
    apply();
  }

  function getEnabled() { return enabled; }
  function getTrackName() { return TRACKS[trackIdx].name; }
  function getTracks() { return TRACKS.slice(); }
  function getTrackIndex() { return trackIdx; }

  // Live tracks take turns: count the seconds one is actually heard, then hand over to the next live one.
  function liveClock() {
    if (!isLive(trackIdx) || !shouldPlay()) return;
    var l = live();
    if (!l || !l.isPlaying()) return;
    if (++liveSecs < LIVE_SECS) return;
    var next = trackIdx;
    do { next = (next + 1) % TRACKS.length; } while (!isLive(next));
    trackIdx = next;
    liveSecs = 0;
    apply();
  }
  function isPaused() {
    if (!enabled) return true;
    if (isLive(trackIdx)) { var l = live(); return !(l && l.isPlaying()); }
    return !mp3Playing();
  }

  function pausePlayback() {
    if (!enabled) return;
    userPaused = true;
    apply();
  }

  function resumePlayback() {
    userPaused = false;
    apply();
  }

  function playTrackAtIndex(idx) {
    if (idx < 0 || idx >= TRACKS.length) return;
    trackIdx = idx;
    liveSecs = 0;
    userPaused = false;
    gestureSeen = true;
    if (!enabled) setEnabled(true);
    else apply();
  }

  function setHold(on) {
    on = !!on;
    if (on === held) return;
    held = on;
    apply();
  }

  function stopAndMute() {
    setEnabled(false);
  }

  function armAutostart() {
    if (armed) return;
    armed = true;

    function disarm() {
      window.removeEventListener('pointerdown', onAny, true);
      window.removeEventListener('keydown', onKey, true);
      armed = false;
    }
    function onAny() { disarm(); kick(); }
    function onKey(e) {
      if (!e) return;
      var k = e.key;
      if (k === 'Tab' || k === 'Shift' || k === 'Meta' || k === 'Alt' || k === 'Control') return;
      disarm();
      kick();
    }
    window.addEventListener('pointerdown', onAny, true);
    window.addEventListener('keydown', onKey, true);
  }

  function init() {
    for (var i = 0; i < players.length; i++) {
      players[i].preload = 'auto';
      players[i].addEventListener('timeupdate', onTimeUpdate, { passive: true });
      players[i].addEventListener('ended', onEnded);
    }
    document.addEventListener('visibilitychange', apply, { passive: true });
    window.addEventListener('message', function (e) {
      try {
        if (e && e.data && e.data.type === 'city:gesture') kick();
      } catch (_) {}
    }, { passive: true });
    armAutostart();
    setInterval(liveClock, 1000);
    if (enabled) {
      try {
        if (navigator.userActivation && navigator.userActivation.hasBeenActive) kick();
      } catch (_) {}
    }
  }

  try {
    window.__CITY_AUDIO_API__ = {
      start: kick,
      stop: stopAndMute,
      setEnabled: setEnabled,
      getEnabled: getEnabled,
      getTrackName: getTrackName,
      getTracks: getTracks,
      getTrackIndex: getTrackIndex,
      isPaused: isPaused,
      pause: pausePlayback,
      resume: resumePlayback,
      playTrack: playTrackAtIndex,
      hold: setHold
    };
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
