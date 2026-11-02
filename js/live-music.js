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

  /* ---------- "Night Drive" — fast, bright outrun in D minor: four on the floor, pumping bass, a hook ---------- */
  function nightDrive(transport) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }

    var out = keep(new T.Gain(3.3));  // level with the others (measured offline)
    var reverb = keep(new T.Reverb({ decay: 3.2, preDelay: 0.02, wet: 0.28 })).connect(out);
    var echo = keep(new T.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.26 })).connect(reverb);

    // Pad ducks on every beat, like a sidechained synthwave pad.
    var padDuck = keep(new T.Gain(1)).connect(reverb);
    var padFilter = keep(new T.Filter({ frequency: 2200, type: 'lowpass', Q: 0.6 })).connect(padDuck);
    var pad = keep(new T.PolySynth(T.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
      envelope: { attack: 0.25, decay: 0.6, sustain: 0.75, release: 1.2 }
    })).connect(padFilter);
    pad.volume.value = -24;

    var bass = keep(new T.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 3, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.35, release: 0.08 },
      filterEnvelope: { attack: 0.003, decay: 0.12, sustain: 0.2, release: 0.1, baseFrequency: 110, octaves: 3 }
    })).connect(out);
    bass.volume.value = -14;

    // Arp starts muffled in the intro and opens up.
    var arpFilter = keep(new T.Filter(700, 'lowpass')).connect(echo);
    var arp = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.002, decay: 0.09, sustain: 0, release: 0.08 } })).connect(arpFilter);
    arp.volume.value = -25;

    var leadFilter = keep(new T.Filter(2600, 'lowpass')).connect(echo);
    var vibrato = keep(new T.Vibrato(5.5, 0.08)).connect(leadFilter);
    var lead = keep(new T.MonoSynth({
      oscillator: { type: 'fatsawtooth', count: 2, spread: 12 },
      portamento: 0.035,
      filter: { Q: 1, type: 'lowpass' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.5 },
      filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 900, octaves: 2 }
    })).connect(vibrato);
    lead.volume.value = -20;

    var kick = keep(new T.MembraneSynth({ pitchDecay: 0.035, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 } })).connect(out);
    kick.volume.value = -10;
    // Big gated-sounding snare: noise into a short, bright room.
    var snareRoom = keep(new T.Reverb({ decay: 1.1, wet: 0.5 })).connect(out);
    var snareFilter = keep(new T.Filter(2400, 'bandpass')).connect(snareRoom);
    var snare = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 } })).connect(snareFilter);
    snare.volume.value = -14;
    var hatFilter = keep(new T.Filter(8000, 'highpass')).connect(out);
    var hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.06, sustain: 0 } })).connect(hatFilter);
    hat.volume.value = -30;

    transport.bpm.value = 106;
    transport.swing = 0;

    // Dm7 – Bbmaj7 – F – Cadd9, a bar each.
    var CHORDS = [
      { bass: ['D2', 'D3'], pad: ['D3', 'F3', 'A3', 'C4'], tones: ['D4', 'F4', 'A4', 'C5', 'D5'] },
      { bass: ['Bb1', 'Bb2'], pad: ['Bb2', 'D3', 'F3', 'A3'], tones: ['Bb3', 'D4', 'F4', 'A4', 'Bb4'] },
      { bass: ['F1', 'F2'], pad: ['F3', 'A3', 'C4', 'E4'], tones: ['F4', 'A4', 'C5', 'E5', 'F5'] },
      { bass: ['C2', 'C3'], pad: ['C3', 'E3', 'G3', 'D4'], tones: ['C4', 'E4', 'G4', 'D5', 'E5'] }
    ];
    // Hook shapes: an index into the chord's tones on each 8th (-1 = rest). One is picked every 4 bars.
    var MOTIFS = [
      [4, -1, 3, -1, 2, 3, -1, 1],
      [2, -1, 2, 3, 4, -1, 3, -1],
      [-1, 4, -1, 4, 3, 2, 1, -1],
      [0, 2, 4, -1, 3, -1, 2, -1]
    ];
    var motif = MOTIFS[0], arpI = 0;

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function octaveUp(n) { return n.replace(/(\d)$/, function (d) { return String(+d + 1); }); }

    // Sections, in bars: 0-3 intro (pad, muffled arp); 4-11 + kick, bass, hats; 12-27 + snare, lead;
    // 28-31 break (pad and arp); then back to bar 4.
    function section(bar) {
      var b = bar < 32 ? bar : 4 + ((bar - 32) % 28);
      return { beat: b >= 4 && b < 28, snare: b >= 12 && b < 28, lead: b >= 12 && b < 28, intro: b < 4 };
    }

    function tick(time, step) {
      var bar = Math.floor(step / 16), s = step % 16;
      var chord = CHORDS[bar % CHORDS.length];
      var on = section(bar);

      if (s === 0) {
        pad.triggerAttackRelease(chord.pad, '1m', time, 0.55);
        arpFilter.frequency.rampTo(on.intro ? 700 + (bar % 32) * 350 : 2400, 0.5, time);
        if (bar % 4 === 0) motif = pick(MOTIFS);
      }
      if (on.beat && s % 4 === 0) {
        padDuck.gain.setValueAtTime(0.35, time);
        padDuck.gain.linearRampToValueAtTime(1, time + 0.28);
        kick.triggerAttackRelease('C1', '8n', time, 0.95);
      }
      if (on.beat && s % 2 === 0) bass.triggerAttackRelease(chord.bass[(s / 2) % 2], '16n', time, s % 4 === 0 ? 0.9 : 0.7);
      if (on.beat && s % 4 === 2) hat.triggerAttackRelease('16n', time, 0.7);
      if (on.snare && (s === 4 || s === 12)) snare.triggerAttackRelease('8n', time, 0.85);
      if (Math.random() < 0.9) {
        arpI = (arpI + 1) % chord.tones.length;
        arp.triggerAttackRelease(chord.tones[arpI], '32n', time, 0.35 + Math.random() * 0.25);
      }
      if (on.lead && s % 2 === 0) {
        var i = motif[s / 2];
        if (i >= 0) {
          var n = chord.tones[i];
          if (bar % 8 >= 4) n = octaveUp(n);
          lead.triggerAttackRelease(n, '8n', time, 0.7);
        }
      }
    }

    return { out: out, nodes: nodes, tick: tick };
  }

  /* ---------- "Ghost Signal" — dark, slow, film-score ambience in C minor: drone, brass swells, bells ---------- */
  function ghostSignal(transport) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }

    var out = keep(new T.Gain(3.6));  // a little softer than the others: it is ambience
    var hall = keep(new T.Reverb({ decay: 11, preDelay: 0.06, wet: 0.5 })).connect(out);
    var echo = keep(new T.FeedbackDelay({ delayTime: '4n.', feedback: 0.45, wet: 0.35 })).connect(hall);

    // Drone: two wide saws under a dark low-pass, gliding to each new root.
    var droneFilter = keep(new T.Filter({ frequency: 320, type: 'lowpass', Q: 1.2 })).connect(hall);
    var droneSweep = keep(new T.LFO(0.025, 220, 520)).connect(droneFilter.frequency);
    var droneGain = keep(new T.Gain(0.09)).connect(droneFilter);
    var droneA = keep(new T.FatOscillator('C2', 'sawtooth', 18)).connect(droneGain);
    var droneB = keep(new T.FatOscillator('G2', 'sawtooth', 24)).connect(droneGain);

    // Wind: brown noise through a wandering band-pass.
    var windGain = keep(new T.Gain(0.05)).connect(out);
    var windFilter = keep(new T.Filter({ frequency: 500, type: 'bandpass', Q: 1.5 })).connect(windGain);
    var windSweep = keep(new T.LFO(0.04, 250, 1100)).connect(windFilter.frequency);
    var wind = keep(new T.Noise('brown')).connect(windFilter);

    // Brass-like swells: slow saws with a filter that opens as they swell.
    var brassFilter = keep(new T.Filter({ frequency: 1400, type: 'lowpass', Q: 0.7 })).connect(hall);
    var brass = keep(new T.PolySynth(T.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 3.2, decay: 2, sustain: 0.65, release: 5 },
      filter: { Q: 0.5, type: 'lowpass' },
      filterEnvelope: { attack: 3.5, decay: 3, sustain: 0.5, release: 5, baseFrequency: 180, octaves: 3 }
    })).connect(brassFilter);
    brass.volume.value = -27;

    var bell = keep(new T.FMSynth({
      harmonicity: 3.01, modulationIndex: 11,
      envelope: { attack: 0.002, decay: 1.6, sustain: 0, release: 2.5 },
      modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.5 }
    })).connect(echo);
    bell.volume.value = -26;

    // A faint heartbeat, and now and then a far-off signal tapping in code.
    var beatFilter = keep(new T.Filter(180, 'lowpass')).connect(out);
    var beat = keep(new T.MembraneSynth({ pitchDecay: 0.06, octaves: 3, envelope: { attack: 0.002, decay: 0.45, sustain: 0, release: 0.1 } })).connect(beatFilter);
    beat.volume.value = -11;
    var signalFilter = keep(new T.Filter({ frequency: 1900, type: 'bandpass', Q: 6 })).connect(echo);
    var signal = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.003, decay: 0.05, sustain: 0.4, release: 0.03 } })).connect(signalFilter);
    signal.volume.value = -30;

    droneA.start(); droneB.start(); droneSweep.start();
    wind.start(); windSweep.start();
    transport.bpm.value = 64;
    transport.swing = 0;

    // Cm9 – Abmaj7 – Fm9 – Dbmaj7 (the Phrygian step down gives the dread), four bars each.
    var CHORDS = [
      { drone: ['C2', 'G2'], brass: ['C3', 'G3', 'Bb3', 'D4', 'Eb4'] },
      { drone: ['Ab1', 'Eb2'], brass: ['Ab2', 'Eb3', 'G3', 'C4'] },
      { drone: ['F1', 'C2'], brass: ['F2', 'Ab3', 'C4', 'G4'] },
      { drone: ['Db2', 'Ab2'], brass: ['Db3', 'F3', 'Ab3', 'C4'] }
    ];
    var BELLS = ['C5', 'Eb5', 'F5', 'G5', 'Bb5', 'D6'];
    var code = null;

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    // Sections, in bars (a bar is ~3.75 s): 0-3 drone and wind; 4+ brass; 6+ bells;
    // 12-23 + heartbeat and the signal; 24-31 brass, bells, drone; then back to bar 4.
    function section(bar) {
      var b = bar < 32 ? bar : 4 + ((bar - 32) % 28);
      return { brass: b >= 4, bells: b >= 6, pulse: b >= 12 && b < 24 };
    }

    function tick(time, step) {
      var bar = Math.floor(step / 16), s = step % 16;
      var chord = CHORDS[Math.floor(bar / 4) % CHORDS.length];
      var on = section(bar);

      if (s === 0 && bar % 4 === 0) {
        droneA.frequency.rampTo(chord.drone[0], 6, time);
        droneB.frequency.rampTo(chord.drone[1], 6, time);
        if (on.brass) brass.triggerAttackRelease(chord.brass, '3m', time, 0.5);
      }
      if (on.bells && s % 2 === 0 && Math.random() < 0.06) bell.triggerAttackRelease(pick(BELLS), '8n', time, 0.3 + Math.random() * 0.4);
      if (on.pulse && (s === 0 || s === 3)) beat.triggerAttackRelease('A0', '8n', time, s === 0 ? 0.8 : 0.5);
      if (on.pulse) {
        if (s === 0 && !code && Math.random() < 0.25) {
          // A short burst of dots and dashes on 32nds-ish steps.
          code = { at: 0, taps: [] };
          var len = 3 + Math.floor(Math.random() * 5);
          for (var i = 0; i < len; i++) code.taps.push(Math.random() < 0.6 ? '32n' : '16n');
        }
        if (code && s % 2 === 0) {
          var d = code.taps[code.at++];
          if (d) signal.triggerAttackRelease('A5', d, time, 0.6);
          if (code.at >= code.taps.length) code = null;
        }
      }
    }

    return { out: out, nodes: nodes, tick: tick };
  }

  var THEMES = {
    'rain-alley': { title: 'Rain Alley (live synth)', build: rainAlley },
    'night-drive': { title: 'Night Drive (live synth)', build: nightDrive },
    'ghost-signal': { title: 'Ghost Signal (live synth)', build: ghostSignal }
  };

  /* ---------- engine: one theme at a time; a new one starts after the old one fades out ---------- */
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

  var FADE_IN = 2.5, FADE_OUT = 1.2;
  var want = null;      // the theme that should be playing (or is starting), or null
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

  function fadeOut(l) {
    try { l.master.gain.rampTo(0, FADE_OUT); } catch (_) {}
    setTimeout(function () { teardown(l); }, FADE_OUT * 1000 + 100);
  }

  function play(key, volume) {
    if (!THEMES[key] || want === key) return;
    want = key;
    var my = ++token;
    var old = live;
    live = null;
    if (old) fadeOut(old);
    var wait = old ? FADE_OUT * 1000 + 200 : 0;
    loadTone().then(function () {
      if (my !== token) return;
      var T = window.Tone;
      return T.start().then(function () {
        return new Promise(function (r) { setTimeout(r, wait); });
      }).then(function () {
        if (my !== token) return;
        var master = new T.Gain(0).toDestination();
        var theme = THEMES[key].build(T.Transport);
        theme.out.connect(master);
        var step = 0;
        var repeatId = T.Transport.scheduleRepeat(function (time) { theme.tick(time, step++); }, '16n');
        T.Transport.start('+0.1');
        master.gain.rampTo(volume, FADE_IN);
        live = { key: key, master: master, theme: theme, repeatId: repeatId };
      });
    }).catch(function (e) { console.warn('live music:', e); if (my === token) want = null; });
  }

  function stop() {
    want = null;
    token++;
    var l = live;
    live = null;
    if (l) fadeOut(l);
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
