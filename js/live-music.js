/**
 * City music generated live in the browser with Tone.js (from a CDN, so it costs the site no
 * bandwidth, and it's original, so no licence questions). These are tracks in the city playlist
 * (js/audio.js decides when they play: music on, not paused, not held by the booth).
 *
 * Each theme is a function (transport) -> { out, nodes, tick(time, step) }; tick runs every 16th note.
 * It never repeats exactly: arps, drips and melody notes are picked at random from the chord.
 */
(function () {
  'use strict';

  var TONE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';

  /* ---------- "Rain Alley" — slow synthwave in A minor under the rain (first heard in the street) ---------- */
  function rainAlley(transport) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }

    // Gain brings it level with the playlist mp3s (measured offline, a little softer on purpose).
    var out = keep(new T.Gain(5));
    var reverb = keep(new T.Reverb({ decay: 7, preDelay: 0.03, wet: 0.38 })).connect(out);
    var echo = keep(new T.FeedbackDelay({ delayTime: '8n.', feedback: 0.38, wet: 0.32 })).connect(reverb);

    // Rain: pink noise, band-limited, slowly breathing; plus single drops ringing in the reverb.
    var rainGain = keep(new T.Gain(0.11)).connect(out);
    var rainLow = keep(new T.Filter(2600, 'lowpass')).connect(rainGain);
    var rainHigh = keep(new T.Filter(500, 'highpass')).connect(rainLow);
    var rain = keep(new T.Noise('pink')).connect(rainHigh);
    var rainSwell = keep(new T.LFO(0.07, 0.07, 0.14)).connect(rainGain.gain);
    var drip = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.05 } })).connect(reverb);
    drip.volume.value = -30;

    // Pad: wide detuned saws through a slowly opening low-pass.
    var padFilter = keep(new T.Filter({ frequency: 900, type: 'lowpass', Q: 0.8 })).connect(reverb);
    var padSweep = keep(new T.LFO(0.035, 500, 1500)).connect(padFilter.frequency);
    var pad = keep(new T.PolySynth(T.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 28 },
      envelope: { attack: 1.8, decay: 1.2, sustain: 0.7, release: 3.5 }
    })).connect(padFilter);
    pad.volume.value = -25;

    // Bass: plucked saw with a filter envelope.
    var bass = keep(new T.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.45, release: 0.4 },
      filterEnvelope: { attack: 0.005, decay: 0.22, sustain: 0.15, release: 0.4, baseFrequency: 70, octaves: 2.6 }
    })).connect(out);
    bass.volume.value = -15;

    // Arp: soft square blips into the dotted-eighth echo.
    var arpFilter = keep(new T.Filter(2000, 'lowpass')).connect(echo);
    var arp = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.004, decay: 0.14, sustain: 0, release: 0.12 } })).connect(arpFilter);
    arp.volume.value = -27;

    // Lead: a few lonely triangle notes with vibrato, now and then.
    var vibrato = keep(new T.Vibrato(4.5, 0.12)).connect(echo);
    var lead = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.06, decay: 0.3, sustain: 0.5, release: 1.4 } })).connect(vibrato);
    lead.volume.value = -19;

    // Drums: lo-fi and far away.
    var kick = keep(new T.MembraneSynth({ pitchDecay: 0.04, octaves: 5, envelope: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.1 } })).connect(out);
    kick.volume.value = -15;
    var snareFilter = keep(new T.Filter(1700, 'bandpass')).connect(reverb);
    var snare = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } })).connect(snareFilter);
    snare.volume.value = -17;
    var hatFilter = keep(new T.Filter(7500, 'highpass')).connect(out);
    var hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0 } })).connect(hatFilter);
    hat.volume.value = -33;

    rain.start();
    rainSwell.start();
    padSweep.start();
    transport.bpm.value = 84;
    transport.swing = 0.12;
    transport.swingSubdivision = '16n';

    // Am9 – Fmaj7 – Cadd9 – Em7, two bars each.
    var CHORDS = [
      { root: 'A1', pad: ['A3', 'C4', 'E4', 'G4', 'B4'], tones: ['A4', 'C5', 'E5', 'G5', 'B5'] },
      { root: 'F1', pad: ['F3', 'A3', 'C4', 'E4'], tones: ['F4', 'A4', 'C5', 'E5', 'A5'] },
      { root: 'C2', pad: ['C3', 'E3', 'G3', 'D4'], tones: ['C5', 'D5', 'E5', 'G5', 'C6'] },
      { root: 'E1', pad: ['E3', 'G3', 'B3', 'D4'], tones: ['E4', 'G4', 'B4', 'D5', 'E5'] }
    ];
    var PENTA = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    var BASS_STEPS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    var arpDir = 1, arpI = 0, phrase = null;

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function octaveUp(n) { return n.replace(/\d$/, function (d) { return String(+d + 1); }); }

    // Sections, in bars: 0-7 rain and pad; 8-15 + bass and hats; 16-31 + drums, arp, lead;
    // 32-39 breakdown (pad, arp, rain); then back to bar 8.
    function section(bar) {
      var b = bar < 40 ? bar : 8 + ((bar - 40) % 32);
      return {
        bass: b >= 8 && b < 32,
        hats: b >= 8 && b < 32,
        drums: b >= 16 && b < 32,
        arp: b >= 16,
        lead: b >= 24 && b < 32
      };
    }

    function tick(time, step) {
      var bar = Math.floor(step / 16), s = step % 16;
      var chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
      var on = section(bar);

      if (s === 0 && bar % 2 === 0) pad.triggerAttackRelease(chord.pad, '2m', time, 0.6);
      if (Math.random() < 0.06) drip.triggerAttackRelease(pick(['C6', 'E6', 'G6', 'A6', 'B6', 'D7']), '32n', time, 0.3 + Math.random() * 0.5);

      if (on.bass && BASS_STEPS[s]) {
        var n = s === 0 || Math.random() < 0.8 ? chord.root : octaveUp(chord.root);
        bass.triggerAttackRelease(n, '16n', time, s === 0 ? 0.9 : 0.65);
      }
      if (on.hats && s % 2 === 0) hat.triggerAttackRelease('32n', time, s % 4 === 2 ? 0.9 : 0.45);
      if (on.drums) {
        if (s === 0 || s === 10) kick.triggerAttackRelease('C1', '8n', time, 0.9);
        if (s === 4 || s === 12) snare.triggerAttackRelease('16n', time, 0.8);
      }
      if (on.arp && s % 2 === 0 && Math.random() < 0.8) {
        arpI += arpDir;
        if (arpI >= chord.tones.length - 1 || arpI <= 0) arpDir = -arpDir;
        arpI = Math.max(0, Math.min(chord.tones.length - 1, arpI));
        arp.triggerAttackRelease(chord.tones[arpI], '16n', time, 0.4 + Math.random() * 0.3);
      }
      if (on.lead) {
        // A new short phrase every other bar: 2-4 notes on random 8ths.
        if (s === 0 && bar % 2 === 0) {
          phrase = {};
          var count = 2 + Math.floor(Math.random() * 3);
          for (var i = 0; i < count; i++) phrase[2 * Math.floor(Math.random() * 16)] = pick(PENTA);
        }
        var at = (bar % 2) * 16 + s;
        if (phrase && phrase[at]) lead.triggerAttackRelease(phrase[at], '4n', time, 0.6);
      }
    }

    return { out: out, nodes: nodes, tick: tick };
  }

  var THEMES = {
    'rain-alley': { title: 'Rain Alley (live synth)', build: rainAlley }
  };

  /* ---------- engine: one theme at a time, faded in and out ---------- */
  var loading = null;
  function loadTone() {
    if (window.Tone && window.Tone.Transport) return Promise.resolve();
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = TONE_SRC;
        s.onload = resolve;
        s.onerror = function (e) { loading = null; reject(e); };
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  var FADE_IN = 2.5, FADE_OUT = 1.0;
  var want = null;      // the theme that should be playing, or null
  var live = null;      // { key, master, theme, repeatId }
  var token = 0;

  function teardown(l) {
    var T = window.Tone;
    try { T.Transport.clear(l.repeatId); } catch (_) {}
    // A theme may have started again during the fade-out: then the transport is its.
    if (!live) { try { T.Transport.stop(); } catch (_) {} }
    l.theme.nodes.forEach(function (n) { try { n.dispose(); } catch (_) {} });
    try { l.master.dispose(); } catch (_) {}
  }

  function play(key, volume) {
    if (!THEMES[key]) return;
    if (want === key && live && live.key === key) return;
    want = key;
    var my = ++token;
    loadTone().then(function () {
      if (my !== token) return;
      var T = window.Tone;
      return T.start().then(function () {
        if (my !== token) return;
        if (live) { teardown(live); live = null; }
        var master = new T.Gain(0).toDestination();
        var theme = THEMES[key].build(T.Transport);
        theme.out.connect(master);
        var step = 0;
        var repeatId = T.Transport.scheduleRepeat(function (time) { theme.tick(time, step++); }, '16n');
        T.Transport.start('+0.1');
        master.gain.rampTo(volume, FADE_IN);
        live = { key: key, master: master, theme: theme, repeatId: repeatId };
      });
    }).catch(function (e) { console.warn('scene music:', e); if (my === token) want = null; });
  }

  function stop() {
    want = null;
    token++;
    var l = live;
    live = null;
    if (!l) return;
    try { l.master.gain.rampTo(0, FADE_OUT); } catch (_) {}
    setTimeout(function () { teardown(l); }, FADE_OUT * 1000 + 150);
  }

  window.__CITY_LIVE_MUSIC__ = {
    has: function (key) { return !!THEMES[key]; },
    title: function (key) { return THEMES[key] ? THEMES[key].title : ''; },
    play: play,
    stop: stop,
    isPlaying: function () { return !!want; },
    // For tests: build a theme on an offline context.
    _themes: THEMES,
    _load: loadTone
  };
})();
