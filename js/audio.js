/**
 * City soundtrack — 3-track mp3 playlist with crossfade.
 * Two <audio> elements, volume-based crossfade, no Web Audio API.
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
    { src: 'audio/lights.mp3', name: 'Bring the Big Lights' },
    { src: 'audio/aeron.mp3', name: 'Aeron 95' },
    { src: 'audio/discontent.mp3', name: 'Discontent' }
  ];

  var VOLUME = 0.38;
  var FADE_MS = 1200;
  var XFADE_MS = 2000;

  var enabled = false;
  try {
    if (localStorage.getItem('city-music-enabled') === 'on') enabled = true;
  } catch (_) {}

  var armed = false;
  var trackIdx = 0;
  var xfading = false;

  var players = [new Audio(), new Audio()];
  var activeSlot = 0;
  var fades = [];

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

  function crossfadeToNext() {
    if (xfading || !enabled) return;
    xfading = true;

    var oldSlot = activeSlot;
    var oldEl = players[oldSlot];
    var newSlot = (oldSlot + 1) % 2;
    var newEl = players[newSlot];
    var nextTrack = (trackIdx + 1) % TRACKS.length;

    newEl.src = TRACKS[nextTrack].src;
    newEl.volume = 0;

    function go() {
      newEl.removeEventListener('canplaythrough', go);
      trackIdx = nextTrack;
      activeSlot = newSlot;
      xfading = false;

      fade(oldEl, oldEl.volume, 0, XFADE_MS, function () {
        oldEl.pause();
        oldEl.removeAttribute('src');
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

  function onTimeUpdate() {
    var el = activeEl();
    if (!el.duration || xfading) return;
    var remaining = el.duration - el.currentTime;
    if (remaining > 0 && remaining <= (XFADE_MS / 1000) + 0.3) {
      crossfadeToNext();
    }
  }

  function onEnded() {
    if (!xfading && enabled) crossfadeToNext();
  }

  function notifyTrack() {
    try {
      var btn = document.getElementById('music-toggle');
      if (btn) btn.title = 'Music — ' + TRACKS[trackIdx].name;
    } catch (_) {}
  }

  function startTrack() {
    if (!enabled) return;
    var el = activeEl();
    if (!el.paused && el.currentSrc && !el.ended) return;
    clearAllFades();
    el.src = TRACKS[trackIdx].src;
    el.load();
    el.volume = 0;
    el.play().catch(function () {});
    fade(el, 0, VOLUME, FADE_MS);
    notifyTrack();
  }

  function stopTrack() {
    clearAllFades();
    var el = activeEl();
    fade(el, el.volume, 0, 400, function () {
      el.pause();
    });
  }

  function setEnabled(on) {
    enabled = !!on;
    try {
      localStorage.setItem('city-music-enabled', enabled ? 'on' : 'off');
    } catch (_) {}
    if (enabled) startTrack();
    else {
      stopTrack();
      setTimeout(function () {
        for (var i = 0; i < players.length; i++) {
          players[i].pause();
          players[i].removeAttribute('src');
          players[i].load();
        }
      }, 450);
    }
  }

  function getEnabled() { return enabled; }
  function getTrackName() { return TRACKS[trackIdx].name; }
  function getTracks() { return TRACKS.slice(); }
  function getTrackIndex() { return trackIdx; }
  function isPaused() { return !enabled || activeEl().paused; }

  function pausePlayback() {
    if (!enabled) return;
    var el = activeEl();
    clearAllFades();
    fade(el, el.volume, 0, 400, function () { el.pause(); });
  }

  function resumePlayback() {
    if (!enabled) return;
    var el = activeEl();
    if (!el.paused && el.currentSrc) return;
    clearAllFades();
    el.volume = 0;
    el.play().catch(function () {});
    fade(el, 0, VOLUME, FADE_MS);
  }

  function playTrackAtIndex(idx) {
    if (idx < 0 || idx >= TRACKS.length) return;
    trackIdx = idx;
    if (!enabled) {
      setEnabled(true);
      return;
    }
    clearAllFades();
    var el = activeEl();
    fade(el, el.volume, 0, 400, function () {
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.src = TRACKS[trackIdx].src;
      el.load();
      el.volume = 0;
      el.play().catch(function () {});
      fade(el, 0, VOLUME, FADE_MS);
      notifyTrack();
    });
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
    function onAny() { disarm(); startTrack(); }
    function onKey(e) {
      if (!e) return;
      var k = e.key;
      if (k === 'Tab' || k === 'Shift' || k === 'Meta' || k === 'Alt' || k === 'Control') return;
      disarm();
      startTrack();
    }
    window.addEventListener('pointerdown', onAny, true);
    window.addEventListener('keydown', onKey, true);
  }

  function onVisibility() {
    if (!enabled) return;
    var el = activeEl();
    if (document.hidden) {
      clearAllFades();
      fade(el, el.volume, 0, 400, function () { el.pause(); });
    } else {
      el.play().catch(function () {});
      fade(el, 0, VOLUME, FADE_MS);
    }
  }

  function init() {
    for (var i = 0; i < players.length; i++) {
      players[i].preload = 'auto';
      players[i].addEventListener('timeupdate', onTimeUpdate, { passive: true });
      players[i].addEventListener('ended', onEnded);
    }
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    window.addEventListener('message', function (e) {
      try {
        if (!e || !e.data) return;
        if (e.data.type === 'city:gesture') {
          startTrack();
          return;
        }
      } catch (_) {}
    }, { passive: true });
    armAutostart();
    if (enabled) {
      try {
        if (navigator.userActivation && navigator.userActivation.hasBeenActive) startTrack();
      } catch (_) {}
    }
  }

  try {
    window.__CITY_AUDIO_API__ = {
      start: function () { startTrack(); },
      stop: stopAndMute,
      setEnabled: setEnabled,
      getEnabled: getEnabled,
      getTrackName: getTrackName,
      getTracks: getTracks,
      getTrackIndex: getTrackIndex,
      isPaused: isPaused,
      pause: pausePlayback,
      resume: resumePlayback,
      playTrack: playTrackAtIndex
    };
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
