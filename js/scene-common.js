(function () {
  'use strict';

  try {
    if (window.self !== window.top) {
      document.body.classList.add('in-shell');
    }
  } catch (_) {
    document.body.classList.add('in-shell');
  }

  var root = document.documentElement;
  if (root) root.dataset.theme = 'dark';

  var spot = document.querySelector('.spot');
  if (!spot) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var raf = 0;
  var lastX = 0;
  var lastY = 0;

  if (root) root.style.setProperty('--spot-ready', '0');

  function onPointerMove(e) {
    if (e.pointerType === 'touch') return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (raf) return;
    raf = window.requestAnimationFrame(function () {
      raf = 0;
      if (!root) return;
      root.style.setProperty('--spot-x', lastX + 'px');
      root.style.setProperty('--spot-y', lastY + 'px');
      root.style.setProperty('--spot-ready', '1');
    });
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
})();
