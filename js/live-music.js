/**
 * City music generated live in the browser with Tone.js (from a CDN, so it costs the site no
 * bandwidth, and it's original, so no licence questions). These are tracks in the city playlist
 * (js/audio.js decides when they play: music on, not paused, not held by the booth).
 *
 * Each theme is a function (transport, env) -> { out, nodes, tick(time, step), info }; tick runs every
 * 16th note. It never repeats exactly: arps, drips and melody notes are picked at random from the chord.
 * env is a hook for the explainer page (tools/tool-live-music.html): it supplies the dice (rnd), can mute
 * parts (on, layer) and hears every note (emit). The city playlist uses PLAIN: real dice, nothing muted.
 * info describes the theme (parts, chords, sections) for that page.
 */
(function () {
  'use strict';

  var TONE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
  var PLAIN = {
    rnd: function () { return Math.random(); },
    used: function () { return false; },
    on: function () { return true; },
    layer: function () {},
    emit: function () {}
  };

  /* ---------- "Rain Alley" — slow synthwave in A minor under the rain (first heard in the street) ---------- */
  function rainAlley(transport, env) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }
    env = env || PLAIN;
    var R = env.rnd;
    // Every note goes through trig(): it can be muted and is reported (for the explainer page).
    function trig(id, synth, note, dur, time, vel, chance) {
      if (!env.on(id)) return;
      if (note === null) synth.triggerAttackRelease(dur, time, vel);
      else synth.triggerAttackRelease(note, dur, time, vel);
      env.emit(id, time, note, chance === undefined ? env.used(id) : chance);
    }

    // Gain brings it level with the playlist mp3s (measured offline, a little softer on purpose).
    var out = keep(new T.Gain(5));
    var reverb = keep(new T.Reverb({ decay: 7, preDelay: 0.03, wet: 0.38 })).connect(out);
    var echo = keep(new T.FeedbackDelay({ delayTime: '8n.', feedback: 0.38, wet: 0.32 })).connect(reverb);

    // Rain: pink noise, band-limited, slowly breathing; plus single drops ringing in the reverb.
    var rainMute = keep(new T.Gain(1)).connect(out);
    env.layer('rain', rainMute);
    var rainGain = keep(new T.Gain(0.11)).connect(rainMute);
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

    var DRIPS = ['C6', 'E6', 'G6', 'A6', 'B6', 'D7'];
    var phraseByChance = false;

    function pick(a, tag) { return a[Math.floor(R(tag) * a.length)]; }
    function octaveUp(n) { return n.replace(/\d$/, function (d) { return String(+d + 1); }); }

    // Sections, in bars: 0-7 rain and pad; 8-15 + bass and hats; 16-31 + drums, arp, lead;
    // 32-39 breakdown (pad, arp, rain); then back to bar 8.
    function fold(bar) { return bar < 40 ? bar : 8 + ((bar - 40) % 32); }
    function section(bar) {
      var b = fold(bar);
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

      if (s === 0 && bar % 2 === 0) trig('pad', pad, chord.pad, '2m', time, 0.6);
      if (R('drip') < 0.06) trig('drip', drip, pick(DRIPS, 'drip'), '32n', time, 0.3 + R('vel') * 0.5);

      if (on.bass && BASS_STEPS[s]) {
        var n = s === 0 || R('bass') < 0.8 ? chord.root : octaveUp(chord.root);
        trig('bass', bass, n, '16n', time, s === 0 ? 0.9 : 0.65);
      }
      if (on.hats && s % 2 === 0) trig('hat', hat, null, '32n', time, s % 4 === 2 ? 0.9 : 0.45);
      if (on.drums) {
        if (s === 0 || s === 10) trig('kick', kick, 'C1', '8n', time, 0.9);
        if (s === 4 || s === 12) trig('snare', snare, null, '16n', time, 0.8);
      }
      if (on.arp && s % 2 === 0 && R('arp') < 0.8) {
        arpI += arpDir;
        if (arpI >= chord.tones.length - 1 || arpI <= 0) arpDir = -arpDir;
        arpI = Math.max(0, Math.min(chord.tones.length - 1, arpI));
        trig('arp', arp, chord.tones[arpI], '16n', time, 0.4 + R('vel') * 0.3);
      }
      if (on.lead) {
        // A new short phrase every other bar: 2-4 notes on random 8ths.
        if (s === 0 && bar % 2 === 0) {
          phrase = {};
          var count = 2 + Math.floor(R('lead') * 3);
          for (var i = 0; i < count; i++) phrase[2 * Math.floor(R('lead') * 16)] = pick(PENTA, 'lead');
          phraseByChance = env.used('lead');
        }
        var at = (bar % 2) * 16 + s;
        if (phrase && phrase[at]) trig('lead', lead, phrase[at], '4n', time, 0.6, phraseByChance);
      }
    }

    var info = {
      bpm: 84, key: 'A minor', mood: 'slow, melancholic synthwave under the rain',
      chords: ['Am9', 'Fmaj7', 'Cadd9', 'Em7'],
      chordAt: function (bar) { return Math.floor(bar / 2) % 4; },
      fold: fold,
      sections: [
        { name: 'Rain and pad', from: 0, to: 8 },
        { name: 'Bass and hats come in', from: 8, to: 16 },
        { name: 'Drums and arpeggio', from: 16, to: 24 },
        { name: 'A melody now and then', from: 24, to: 32 },
        { name: 'Break', from: 32, to: 40 }
      ],
      loopBack: 8,
      parts: [
        { id: 'rain', label: 'Rain', layer: true, what: 'Pink noise (random hiss, softer in the highs) through two filters that keep only its middle, swelling slowly up and down. It never stops.' },
        { id: 'drip', label: 'Drops', synth: drip, what: 'A pure sine "ping", very short, ringing in a big reverb. Every sixteenth there is a 6% chance of a drop, on a random high note.' },
        { id: 'pad', label: 'Pad', synth: pad, what: 'The chords: three slightly detuned saw waves per note, a new chord every two bars. A slow filter opens and closes their brightness, and the long attack makes them swell in.' },
        { id: 'bass', label: 'Bass', synth: bass, what: 'One saw wave with a filter that snaps open and shut on every note: a pluck. The rhythm is fixed; each note has a 20% chance to jump up an octave.' },
        { id: 'hat', label: 'Hi-hat', synth: hat, what: '35 milliseconds of white noise, high-passed so only the hiss is left.' },
        { id: 'kick', label: 'Kick', synth: kick, what: 'A sine wave that drops fast in pitch: that is how electronic kick drums are made.' },
        { id: 'snare', label: 'Snare', synth: snare, what: 'A short burst of white noise through a band-pass filter, into the reverb.' },
        { id: 'arp', label: 'Arpeggio', synth: arp, what: 'Square-wave blips walking up and down the notes of the chord. Each one has a 20% chance to be skipped, and the echo repeats it a dotted eighth later.' },
        { id: 'lead', label: 'Melody', synth: lead, what: 'Every two bars, 2 to 4 notes picked from the A minor pentatonic scale, at random places. A soft triangle wave with vibrato.' }
      ]
    };

    return { out: out, nodes: nodes, tick: tick, info: info };
  }

  /* ---------- "Night Drive" — fast, bright outrun in D minor: four on the floor, pumping bass, a hook ---------- */
  function nightDrive(transport, env) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }
    env = env || PLAIN;
    var R = env.rnd;
    // Every note goes through trig(): it can be muted and is reported (for the explainer page).
    function trig(id, synth, note, dur, time, vel, chance) {
      if (!env.on(id)) return;
      if (note === null) synth.triggerAttackRelease(dur, time, vel);
      else synth.triggerAttackRelease(note, dur, time, vel);
      env.emit(id, time, note, chance === undefined ? env.used(id) : chance);
    }

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

    var motifByChance = false;

    function pick(a, tag) { return a[Math.floor(R(tag) * a.length)]; }
    function octaveUp(n) { return n.replace(/(\d)$/, function (d) { return String(+d + 1); }); }

    // Sections, in bars: 0-3 intro (pad, muffled arp); 4-11 + kick, bass, hats; 12-27 + snare, lead;
    // 28-31 break (pad and arp); then back to bar 4.
    function fold(bar) { return bar < 32 ? bar : 4 + ((bar - 32) % 28); }
    function section(bar) {
      var b = fold(bar);
      return { beat: b >= 4 && b < 28, snare: b >= 12 && b < 28, lead: b >= 12 && b < 28, intro: b < 4 };
    }

    function tick(time, step) {
      var bar = Math.floor(step / 16), s = step % 16;
      var chord = CHORDS[bar % CHORDS.length];
      var on = section(bar);

      if (s === 0) {
        trig('pad', pad, chord.pad, '1m', time, 0.55);
        arpFilter.frequency.rampTo(on.intro ? 700 + (bar % 32) * 350 : 2400, 0.5, time);
        if (bar % 4 === 0) { motif = pick(MOTIFS, 'lead'); motifByChance = env.used('lead'); }
      }
      if (on.beat && s % 4 === 0) {
        padDuck.gain.setValueAtTime(0.35, time);
        padDuck.gain.linearRampToValueAtTime(1, time + 0.28);
        trig('kick', kick, 'C1', '8n', time, 0.95);
      }
      if (on.beat && s % 2 === 0) trig('bass', bass, chord.bass[(s / 2) % 2], '16n', time, s % 4 === 0 ? 0.9 : 0.7);
      if (on.beat && s % 4 === 2) trig('hat', hat, null, '16n', time, 0.7);
      if (on.snare && (s === 4 || s === 12)) trig('snare', snare, null, '8n', time, 0.85);
      if (R('arp') < 0.9) {
        arpI = (arpI + 1) % chord.tones.length;
        trig('arp', arp, chord.tones[arpI], '32n', time, 0.35 + R('vel') * 0.25);
      }
      if (on.lead && s % 2 === 0) {
        var i = motif[s / 2];
        if (i >= 0) {
          var n = chord.tones[i];
          if (bar % 8 >= 4) n = octaveUp(n);
          trig('lead', lead, n, '8n', time, 0.7, motifByChance);
        }
      }
    }

    var info = {
      bpm: 106, key: 'D minor', mood: 'fast, bright outrun: four on the floor, pumping bass, a hook',
      chords: ['Dm7', 'Bbmaj7', 'F', 'Cadd9'],
      chordAt: function (bar) { return bar % 4; },
      fold: fold,
      sections: [
        { name: 'Intro: pad, muffled arpeggio', from: 0, to: 4 },
        { name: 'Beat and bass come in', from: 4, to: 12 },
        { name: 'Snare and the hook', from: 12, to: 28 },
        { name: 'Break', from: 28, to: 32 }
      ],
      loopBack: 4,
      parts: [
        { id: 'pad', label: 'Pad', synth: pad, what: 'The chords, one per bar: three detuned saw waves per note. On every beat its volume dips and swells back, as if pushed aside by the kick: the "pumping" sound of synthwave.' },
        { id: 'bass', label: 'Bass', synth: bass, what: 'Eighth notes jumping between the root and its octave: a saw wave with a snappy filter. Completely fixed: no dice here.' },
        { id: 'arp', label: 'Arpeggio', synth: arp, what: 'Fast square-wave notes running through the chord, every sixteenth; 10% are skipped. In the intro a filter keeps it muffled and opens bar by bar.' },
        { id: 'lead', label: 'Hook', synth: lead, what: 'The tune: one of four short shapes, picked at random every four bars and fitted to the current chord, jumping up an octave in the second half of each eight bars. Two detuned saws gliding between notes.' },
        { id: 'kick', label: 'Kick', synth: kick, what: 'On every beat ("four on the floor"): a sine wave dropping fast in pitch.' },
        { id: 'snare', label: 'Snare', synth: snare, what: 'White noise through a band-pass into a short, bright room: the big 80s snare.' },
        { id: 'hat', label: 'Hi-hat', synth: hat, what: 'Noise on the off-beats, between the kicks.' }
      ]
    };

    return { out: out, nodes: nodes, tick: tick, info: info };
  }

  /* ---------- "Ghost Signal" — dark, slow, film-score ambience in C minor: drone, brass swells, bells ---------- */
  function ghostSignal(transport, env) {
    var T = window.Tone;
    var nodes = [];
    function keep(n) { nodes.push(n); return n; }
    env = env || PLAIN;
    var R = env.rnd;
    // Every note goes through trig(): it can be muted and is reported (for the explainer page).
    function trig(id, synth, note, dur, time, vel, chance) {
      if (!env.on(id)) return;
      if (note === null) synth.triggerAttackRelease(dur, time, vel);
      else synth.triggerAttackRelease(note, dur, time, vel);
      env.emit(id, time, note, chance === undefined ? env.used(id) : chance);
    }

    var out = keep(new T.Gain(3.6));  // a little softer than the others: it is ambience
    var hall = keep(new T.Reverb({ decay: 11, preDelay: 0.06, wet: 0.5 })).connect(out);
    var echo = keep(new T.FeedbackDelay({ delayTime: '4n.', maxDelay: 2, feedback: 0.45, wet: 0.35 })).connect(hall);  // 1.4 s at 64 BPM

    // Drone: two wide saws under a dark low-pass, gliding to each new root.
    var droneMute = keep(new T.Gain(1)).connect(hall);
    env.layer('drone', droneMute);
    var droneFilter = keep(new T.Filter({ frequency: 320, type: 'lowpass', Q: 1.2 })).connect(droneMute);
    var droneSweep = keep(new T.LFO(0.025, 220, 520)).connect(droneFilter.frequency);
    var droneGain = keep(new T.Gain(0.09)).connect(droneFilter);
    var droneA = keep(new T.FatOscillator('C2', 'sawtooth', 18)).connect(droneGain);
    var droneB = keep(new T.FatOscillator('G2', 'sawtooth', 24)).connect(droneGain);

    // Wind: brown noise through a wandering band-pass.
    var windMute = keep(new T.Gain(1)).connect(out);
    env.layer('wind', windMute);
    var windGain = keep(new T.Gain(0.05)).connect(windMute);
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

    function pick(a, tag) { return a[Math.floor(R(tag) * a.length)]; }

    // Sections, in bars (a bar is ~3.75 s): 0-3 drone and wind; 4+ brass; 6+ bells;
    // 12-23 + heartbeat and the signal; 24-31 brass, bells, drone; then back to bar 4.
    function fold(bar) { return bar < 32 ? bar : 4 + ((bar - 32) % 28); }
    function section(bar) {
      var b = fold(bar);
      return { brass: b >= 4, bells: b >= 6, pulse: b >= 12 && b < 24 };
    }

    function tick(time, step) {
      var bar = Math.floor(step / 16), s = step % 16;
      var chord = CHORDS[Math.floor(bar / 4) % CHORDS.length];
      var on = section(bar);

      if (s === 0 && bar % 4 === 0) {
        droneA.frequency.rampTo(chord.drone[0], 6, time);
        droneB.frequency.rampTo(chord.drone[1], 6, time);
        if (on.brass) trig('brass', brass, chord.brass, '3m', time, 0.5);
      }
      if (on.bells && s % 2 === 0 && R('bell') < 0.06) trig('bell', bell, pick(BELLS, 'bell'), '8n', time, 0.3 + R('vel') * 0.4);
      if (on.pulse && (s === 0 || s === 3)) trig('beat', beat, 'A0', '8n', time, s === 0 ? 0.8 : 0.5);
      if (on.pulse) {
        if (s === 0 && !code && R('signal') < 0.25) {
          // A short burst of dots and dashes on 32nds-ish steps.
          code = { at: 0, taps: [] };
          var len = 3 + Math.floor(R('signal') * 5);
          for (var i = 0; i < len; i++) code.taps.push(R('signal') < 0.6 ? '32n' : '16n');
          code.byChance = env.used('signal');
        }
        if (code && s % 2 === 0) {
          var d = code.taps[code.at++];
          if (d) trig('signal', signal, 'A5', d, time, 0.6, code.byChance);
          if (code.at >= code.taps.length) code = null;
        }
      }
    }

    var info = {
      bpm: 64, key: 'C minor', mood: 'dark, slow film-score ambience',
      chords: ['Cm9', 'Abmaj7', 'Fm9', 'Dbmaj7'],
      chordAt: function (bar) { return Math.floor(bar / 4) % 4; },
      fold: fold,
      sections: [
        { name: 'Drone and wind', from: 0, to: 4 },
        { name: 'Brass swells, then bells', from: 4, to: 12 },
        { name: 'Heartbeat and the signal', from: 12, to: 24 },
        { name: 'Brass and bells', from: 24, to: 32 }
      ],
      loopBack: 4,
      parts: [
        { id: 'drone', label: 'Drone', layer: true, what: 'Two wide saw waves held low under a dark filter that slowly breathes. When the chord changes they glide to the new root over six seconds instead of jumping.' },
        { id: 'wind', label: 'Wind', layer: true, what: 'Brown noise (even darker than pink) through a narrow filter that wanders up and down: it sounds like wind.' },
        { id: 'brass', label: 'Brass', synth: brass, what: 'The chords, every four bars: saw waves with a three-second attack and a filter that opens as they swell, the classic film-synth brass. The step from Cm9 down to Dbmaj7 is what gives the dread.' },
        { id: 'bell', label: 'Bells', synth: bell, what: 'FM synthesis: one wave bends the pitch of another very fast, which makes metallic, bell-like overtones. Each eighth there is a 6% chance of a bell.' },
        { id: 'beat', label: 'Heartbeat', synth: beat, what: 'A low, muffled "lub-dub" on every bar, only in the middle of the track.' },
        { id: 'signal', label: 'Signal', synth: signal, what: 'Now and then a far-off radio tapping short and long blips, made up on the spot: a square wave through a narrow filter and a long echo.' }
      ]
    };

    return { out: out, nodes: nodes, tick: tick, info: info };
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
        var theme = THEMES[key].build(T.Transport, PLAIN);
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
