// Neo-Nova synth loop — kawaii cyberpunk vibes
// Requires Tone.js (loaded via CDN)

(function () {
  'use strict';

  var loaded = false;
  var playing = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.Tone && window.Tone.Transport) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function (e) { reject(e); };
      document.head.appendChild(s);
    });
  }

  function startMusic() {
    if (playing) return;
    playing = true;

    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Master volume
    Tone.Destination.volume.value = -12;

    // Simple lead synth
    var lead = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 }
    }).toDestination();
    lead.volume.value = -10;

    // Bass synth
    var bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.2 }
    }).toDestination();
    bass.volume.value = -6;

    // Chord pad
    var pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.5, release: 0.8 }
    }).toDestination();
    pad.volume.value = -16;

    // Melody notes
    var melody = ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'F4', 'Eb4', 'C4',
                  'Ab3', 'C4', 'Eb4', 'F4', 'Eb4', 'C4', 'Bb3', 'Ab3'];
    var melodyIdx = 0;

    // Chords (4 bars)
    var chords = [
      ['C4', 'Eb4', 'G4'],
      ['Ab3', 'C4', 'Eb4'],
      ['Eb3', 'G3', 'Bb3'],
      ['Bb3', 'D4', 'F4']
    ];
    var bassNotes = ['C2', 'Ab1', 'Eb2', 'Bb1'];

    Tone.Transport.bpm.value = 120;

    // Lead melody on 8th notes
    var leadLoop = new Tone.Loop(function (time) {
      var note = melody[melodyIdx % melody.length];
      lead.triggerAttackRelease(note, '8n', time);
      melodyIdx++;
    }, '8n').start(0);

    // Chords every bar
    var chordLoop = new Tone.Loop(function (time) {
      var bar = Math.floor(Tone.Transport.seconds / (60 / Tone.Transport.bpm.value * 4)) % 4;
      pad.triggerAttackRelease(chords[bar], '1m', time);
    }, '1m').start(0);

    // Bass every 2 beats
    var bassLoop = new Tone.Loop(function (time) {
      var bar = Math.floor(Tone.Transport.seconds / (60 / Tone.Transport.bpm.value * 4)) % 4;
      bass.triggerAttackRelease(bassNotes[bar], '4n', time);
    }, '2n').start(0);

    // Store refs for cleanup
    window.__idol_synth_refs = { lead: lead, bass: bass, pad: pad, leadLoop: leadLoop, chordLoop: chordLoop, bassLoop: bassLoop };

    Tone.Transport.start();
  }

  function stopMusic() {
    if (!playing) return;
    playing = false;

    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Cleanup synths
    var refs = window.__idol_synth_refs;
    if (refs) {
      try { refs.leadLoop.dispose(); } catch(e) {}
      try { refs.chordLoop.dispose(); } catch(e) {}
      try { refs.bassLoop.dispose(); } catch(e) {}
      try { refs.lead.dispose(); } catch(e) {}
      try { refs.bass.dispose(); } catch(e) {}
      try { refs.pad.dispose(); } catch(e) {}
      window.__idol_synth_refs = null;
    }
  }

  // Public API
  window.__IDOL_MUSIC__ = {
    init: function () {
      return loadScript('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js');
    },
    play: function () {
      if (!window.Tone) {
        console.warn('Tone.js not loaded yet');
        return;
      }
      Tone.start().then(function () {
        startMusic();
      }).catch(function (e) {
        console.warn('Tone.start() failed:', e);
      });
    },
    stop: stopMusic,
    isPlaying: function () { return playing; }
  };
})();
