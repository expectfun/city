// The white rabbit: a trail from the City's entry to the listening booth, where the Longplay posts are read.
// On the street, in the library and upstairs, the first time a scene is seen in a session the rabbit hops in
// and stops by the way on (the door under the LIBRARY sign, the stairs, the booth), then sits there, twitching
// an ear now and then; on later visits it's already sitting. Not clickable: the scene's own hotspots work as
// before. A scene sets window.CITY_RABBIT before loading this:
//   { key: 'street', path: [[x, y, scale], ...] }
// in the scene's 1376 × 768 picture coordinates; the last point is where it sits, scale is for perspective.
(function () {
  var cfg = window.CITY_RABBIT, scene = document.querySelector('.scene');
  if (!cfg || !scene || !cfg.path || cfg.path.length < 2) return;
  var NS = 'http://www.w3.org/2000/svg';
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var style = document.createElement('style');
  style.textContent =
    '.rabbit { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; transform: scale(1.02); }' +
    '.rabbit .fur { fill: #edf1f7; }' +
    '.rabbit .who { filter: drop-shadow(0 0 3px rgb(255 255 255 / 0.35)); transition: opacity .4s ease; }' +
    '.rabbit .shadow { fill: rgb(0 0 0 / 0.45); }' +
    '.rabbit .eye { fill: #b0213a; }' +
    '.rabbit .inner { fill: #f3c6cf; }' +
    '.rabbit .ear { transform-box: fill-box; transform-origin: 50% 100%; }' +
    '.rabbit .ear.twitch { animation: rabbit-twitch .5s ease-in-out; }' +
    '@keyframes rabbit-twitch { 30% { transform: rotate(-16deg); } 60% { transform: rotate(6deg); } }';
  document.head.appendChild(style);

  // drawn facing right, standing on (0, 0), about 40 units long at scale 1
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
  var RUN =
    '<ellipse class="shadow" cx="0" cy="0" rx="13" ry="2.2"/>' +
    '<g class="who">' +
    '<ellipse class="fur" cx="-12" cy="-5" rx="6.5" ry="2.4" transform="rotate(28 -12 -5)"/>' +
    '<ellipse class="fur" cx="12" cy="-7" rx="5" ry="1.8" transform="rotate(-32 12 -7)"/>' +
    '<circle class="fur" cx="-17" cy="-13.5" r="3.2"/>' +
    '<ellipse class="fur" cx="-2" cy="-12" rx="15" ry="7.5" transform="rotate(-9 -2 -12)"/>' +
    '<ellipse class="fur" cx="13" cy="-19" rx="6.5" ry="5.5"/>' +
    '<ellipse class="fur" cx="4" cy="-25" rx="2.2" ry="8.5" transform="rotate(58 4 -25)"/>' +
    '<ellipse class="fur" cx="6.5" cy="-27.5" rx="2" ry="8" transform="rotate(66 6.5 -27.5)"/>' +
    '<circle class="eye" cx="15.5" cy="-20" r="1"/>' +
    '</g>';

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rabbit');
  svg.setAttribute('viewBox', '0 0 1376 768');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  var g = document.createElementNS(NS, 'g');
  svg.appendChild(g);
  var hot = scene.querySelector('.hotspots');
  scene.insertBefore(svg, hot);   // under the hotspots, which stay clickable through it

  var path = cfg.path, end = path[path.length - 1], before = path[path.length - 2];
  var facing = end[0] >= before[0] ? 1 : -1;
  function place(x, y, s, dir, pose) {
    if (g.dataset.pose !== pose) { g.innerHTML = pose === 'sit' ? SIT : RUN; g.dataset.pose = pose; }
    g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (s * dir).toFixed(3) + ' ' + s.toFixed(3) + ')');
  }
  function sit() {
    place(end[0], end[1], end[2], facing, 'sit');
    (function twitch() {
      setTimeout(function () {
        var ear = g.querySelector('.ear-front');
        if (ear && !still) { ear.classList.remove('twitch'); void ear.getBBox(); ear.classList.add('twitch'); }
        twitch();
      }, 3500 + Math.random() * 5000);
    })();
  }

  var seen = 'city-rabbit:' + cfg.key, ran = false;
  try { ran = sessionStorage.getItem(seen) === '1'; sessionStorage.setItem(seen, '1'); } catch (_) {}
  if (ran || still) return sit();

  // the run: hops along the path, each about 55 units long at the scale where it starts, in a little arc
  var segs = [], total = 0;
  for (var i = 1; i < path.length; i++) {
    var a = path[i - 1], b = path[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a: a, b: b, len: len, from: total });
    total += len;
  }
  function at(d) {
    for (var k = 0; k < segs.length; k++) {
      var sg = segs[k];
      if (d <= sg.from + sg.len || k === segs.length - 1) {
        var t = sg.len ? Math.min(1, (d - sg.from) / sg.len) : 1;
        return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * t, y: sg.a[1] + (sg.b[1] - sg.a[1]) * t,
                 s: sg.a[2] + (sg.b[2] - sg.a[2]) * t, dir: sg.b[0] >= sg.a[0] ? 1 : -1 };
      }
    }
  }
  var HOP_MS = 260, d = 0, hopFrom = 0, hopLen = 0, hopStart = 0;
  g.style.opacity = '0';
  setTimeout(function () {
    g.style.opacity = '';
    requestAnimationFrame(function frame(now) {
      if (!hopStart || now - hopStart >= HOP_MS) {   // a new hop
        if (hopStart) d = hopFrom + hopLen;
        if (d >= total - 0.5) return sit();
        hopFrom = d;
        hopLen = Math.min(total - d, 55 * at(d).s);
        hopStart = now;
      }
      var t = (now - hopStart) / HOP_MS, p = at(hopFrom + hopLen * t);
      place(p.x, p.y - Math.sin(Math.PI * t) * 16 * p.s, p.s, p.dir, 'run');
      requestAnimationFrame(frame);
    });
  }, cfg.delay || 900);
})();
