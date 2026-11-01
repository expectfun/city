(function () {
  'use strict';

  var isInFrame = false;
  try {
    isInFrame = window.top && window.top !== window;
  } catch (_) {
    isInFrame = true;
  }
  if (!isInFrame) return;

  function safeText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function filename() {
    try {
      var path = window.location.pathname || '';
      var parts = path.split('/');
      return (parts[parts.length - 1] || '').toLowerCase();
    } catch (_) {
      return '';
    }
  }

  function sceneInfo() {
    var file = filename();
    var map = {
      'street.html': { scene: 'street', env: 'outdoor' },
      'square.html': { scene: 'square', env: 'outdoor' },
      'entry.html': { scene: 'entry', env: 'outdoor' },
      'station.html': { scene: 'station', env: 'outdoor' },

      'game.html': { scene: 'game', env: 'indoor' },
      'arcade.html': { scene: 'arcade', env: 'indoor' },
      'library.html': { scene: 'library', env: 'indoor' },
      'terminal.html': { scene: 'terminal', env: 'indoor' },
      'tablet.html': { scene: 'tablet', env: 'indoor' },
      'upstairs.html': { scene: 'upstairs', env: 'indoor' },
      'booth.html': { scene: 'booth', env: 'indoor' },
      'daemon.html': { scene: 'daemon', env: 'indoor' },
      'rooftop.html': { scene: 'rooftop', env: 'outdoor' },
      'workshop.html': { scene: 'workshop', env: 'indoor' },
      'hotel.html': { scene: 'hotel', env: 'outdoor' },
      'lobby.html': { scene: 'lobby', env: 'indoor' },
      'cafe.html': { scene: 'cafe', env: 'indoor' },
      'bar.html': { scene: 'bar', env: 'indoor' },
      'map.html': { scene: 'map', env: 'indoor' },
      'cubicle.html': { scene: 'cubicle', env: 'indoor' }
    };
    return map[file] || { scene: file || 'unknown', env: 'outdoor' };
  }

  function sendScene() {
    try {
      var info = sceneInfo();
      var file = filename();
      window.parent.postMessage({ type: 'city:scene', scene: info.scene, env: info.env, file: file || 'index.html' }, '*');
    } catch (_) {}
  }

  function isProbablyDoorHref(href) {
    if (!href) return false;
    if (href === '#') return false;
    if (href.indexOf('#') === 0) return false;
    if (/^(javascript:|data:|blob:)/i.test(href)) return false;
    return true;
  }

  function collectLinks() {
    var out = [];
    var seen = new Set();
    try {
      var anchors = document.querySelectorAll('a[href]');
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        if (!a || !a.getAttribute) continue;
        var href = (a.getAttribute('href') || '').trim();
        if (!isProbablyDoorHref(href)) continue;

        // Avoid listing UI triggers / overlays that aren't navigation.
        if (a.classList && (a.classList.contains('map-graph-trigger') || a.classList.contains('secret-hotspot'))) continue;
        // Avoid listing "escape hatches" out of the city shell.
        if (a.classList && a.classList.contains('standalone-exit')) continue;
        if ((a.getAttribute('target') || '').toLowerCase() === '_top') continue;

        var text = safeText(a.getAttribute('aria-label')) || safeText(a.textContent);
        if (!text) text = href;

        var key = href + '|' + text;
        if (seen.has(key)) continue;
        seen.add(key);

        out.push({
          href: href,
          text: text,
          external: /^https?:/i.test(href) || (a.getAttribute('target') === '_blank')
        });
      }
    } catch (_) {}
    return out;
  }

  function sendLinks() {
    try {
      var file = filename() || 'index.html';
      var links = collectLinks();
      window.parent.postMessage({ type: 'city:links', file: file, links: links }, '*');
    } catch (_) {}
  }

  var sent = false;
  function send() {
    if (sent) return;
    sent = true;
    try {
      window.parent.postMessage({ type: 'city:gesture' }, '*');
    } catch (_) {}
    window.removeEventListener('pointerdown', onAny, true);
    window.removeEventListener('keydown', onKey, true);
  }

  function onAny() { send(); }
  function onKey(e) {
    if (!e) return;
    var k = e.key;
    if (k === 'Tab' || k === 'Shift' || k === 'Meta' || k === 'Alt' || k === 'Control') return;
    send();
  }

  window.addEventListener('pointerdown', onAny, true);
  window.addEventListener('keydown', onKey, true);
  sendScene();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendLinks, { once: true });
  } else {
    sendLinks();
  }

  var spotRaf = 0;
  var spotLastX = 0;
  var spotLastY = 0;
  function sendSpotPosition(x, y) {
    try {
      window.parent.postMessage({ type: 'city-spot-move', x: x, y: y }, '*');
    } catch (_) {}
  }
  function onPointerMove(e) {
    if (e.pointerType === 'touch') return;
    spotLastX = e.clientX;
    spotLastY = e.clientY;
    if (spotRaf) return;
    spotRaf = window.requestAnimationFrame(function () {
      spotRaf = 0;
      sendSpotPosition(spotLastX, spotLastY);
    });
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
})();
