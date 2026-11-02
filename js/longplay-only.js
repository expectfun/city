/**
 * Posts fetched live from the longplay site (expectfun.github.io/longplay) may carry parts that belong
 * to longplay only. Mark anything with data-longplay-only in a post to keep it out of the City.
 * The blue/red pills (and the paragraph introducing them, right before) are dropped even unmarked:
 * the red one leads to the City, and here the reader is already in it.
 */
(function () {
  'use strict';
  window.dropLongplayOnly = function (root) {
    root.querySelectorAll('.pills').forEach(function (pills) {
      var intro = pills.previousElementSibling;
      if (intro && intro.tagName === 'P' && /таблет|pill/i.test(intro.textContent)) intro.remove();
      pills.remove();
    });
    root.querySelectorAll('[data-longplay-only]').forEach(function (n) { n.remove(); });
  };
})();
