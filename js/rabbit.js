// The white rabbit: a quiet trail from the City's entry (riding the ferry to the gateway) to the listening booth, where the Longplay posts are
// read. On the street, in the library and upstairs it sits by the way on (under the LIBRARY sign, halfway up the
// stairs, at the booth door), twitching an ear now and then. Not clickable: the scene's own hotspots work as before.
// It isn't there when a scene opens: the visitor looks around first. After APPEAR_DELAY it fades in like a
// hologram switching on, a hint for whoever lingers. Once the booth has been found (booth.html sets
// city-rabbit-done in localStorage), it has done its job and appears no more, unless a message from Longplay
// says to follow it (the shell sets city-rabbit-call for the tab): then it is back, and sooner, until the booth.
// (It used to hop in to its spot; the run is in git history, f2ba95d.)
// A scene sets window.CITY_RABBIT before loading this:
//   { at: [x, y, scale], facing: 1 }
// in the scene's 1376 × 768 picture coordinates; scale is for perspective, facing -1 turns it to the left.
// The message names where the post waits (city-rabbit-to: booth, the default, or terminal), and the trail splits in
// the library. A scene can give the rabbit another spot on the way to one of them, or none (null):
//   { at: [...], to: { terminal: { at: [...] } } }
(function () {
  var cfg = window.CITY_RABBIT, scene = document.querySelector('.scene');
  var called = false, dest = 'booth';
  try {
    called = sessionStorage.getItem('city-rabbit-call') === '1';
    if (called) dest = sessionStorage.getItem('city-rabbit-to') || 'booth';
  } catch (_) {}
  if (cfg && cfg.to && dest in cfg.to) cfg = cfg.to[dest];
  if (!cfg || !scene || !cfg.at) return;
  try { if (!called && localStorage.getItem('city-rabbit-done') === '1') return; } catch (_) {}
  var APPEAR_DELAY = called ? 2500 : 5000;
  var NS = 'http://www.w3.org/2000/svg';
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var style = document.createElement('style');
  style.textContent =
    '.rabbit { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; transform: scale(1.02); opacity: 0; }' +
    // Appearing: a few flickers, cyan at first, settling into its white glow.
    '.rabbit.appear { animation: rabbit-appear 2.6s ease-out forwards; }' +
    '.rabbit.appear .fur { animation: rabbit-tint 2.6s ease-out forwards; }' +
    '@keyframes rabbit-appear { 0% { opacity: 0; } 12% { opacity: .32; } 16% { opacity: .06; } 28% { opacity: .5; } 32% { opacity: .18; }' +
    ' 46% { opacity: .66; } 50% { opacity: .42; } 100% { opacity: 1; } }' +
    '@keyframes rabbit-tint { 0%, 40% { fill: #9ff4ff; } 100% { fill: #edf1f7; } }' +
    '.rabbit.appear.still { animation: rabbit-fade 2.5s ease-out forwards; }' +
    '.rabbit.appear.still .fur { animation: none; }' +
    '@keyframes rabbit-fade { to { opacity: 1; } }' +
    '.rabbit .fur { fill: #edf1f7; }' +
    '.rabbit .who { filter: drop-shadow(0 0 3px rgb(255 255 255 / 0.35)); }' +
    '.rabbit .shadow { fill: rgb(0 0 0 / 0.45); }' +
    '.rabbit .eye { fill: #b0213a; }' +
    '.rabbit .inner { fill: #f3c6cf; }' +
    '.rabbit .ear { transform-box: fill-box; transform-origin: 50% 100%; }' +
    '.rabbit .ear.twitch { animation: rabbit-twitch .5s ease-in-out; }' +
    '@keyframes rabbit-twitch { 30% { transform: rotate(-16deg); } 60% { transform: rotate(6deg); } }';
  document.head.appendChild(style);

  // drawn facing right, sitting on (0, 0), about 40 units long at scale 1
  var SIT =
    '<ellipse class="shadow" cx="-2" cy="0" rx="15" ry="2.6"/>' +
    '<g class="who">' +
    '<circle class="fur" cx="-13.5" cy="-10" r="3.6"/>' +
    '<ellipse class="fur" cx="-3" cy="-10" rx="12" ry="10"/>' +
    '<ellipse class="fur" cx="6" cy="-1.8" rx="4.2" ry="2"/>' +
    '<ellipse class="fur" cx="9" cy="-21" rx="7" ry="6"/>' +
    '<g class="ear ear-back"><ellipse class="fur" cx="6" cy="-33" rx="2.6" ry="8.5" transform="rotate(-14 6 -33)"/></g>' +
    '<g class="ear ear-front"><ellipse class="fur" cx="10.8" cy="-33" rx="2.5" ry="8" transform="rotate(9 10.8 -33)"/>' +
    '<ellipse class="inner" cx="10.9" cy="-33" rx="1" ry="5.5" transform="rotate(9 10.9 -33)"/></g>' +
    '<circle class="eye" cx="11.8" cy="-22" r="1.1"/>' +
    '</g>';

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rabbit');
  svg.setAttribute('viewBox', '0 0 1376 768');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  var g = document.createElementNS(NS, 'g'), x = cfg.at[0], y = cfg.at[1], s = cfg.at[2] || 1, dir = cfg.facing || 1;
  g.innerHTML = SIT;
  g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + s * dir + ' ' + s + ')');
  svg.appendChild(g);
  scene.insertBefore(svg, scene.querySelector('.hotspots'));   // under the hotspots, which stay clickable through it

  if (still) svg.classList.add('still');
  setTimeout(function () { svg.classList.add('appear'); }, APPEAR_DELAY);

  if (still) return;
  var ear = g.querySelector('.ear-front');
  (function twitch() {
    setTimeout(function () {
      ear.classList.remove('twitch'); void ear.getBBox(); ear.classList.add('twitch');
      twitch();
    }, 3500 + Math.random() * 5000);
  })();
})();
