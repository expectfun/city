# City (current structure)

`city/` is an interactive mini-site with a single shell entry page and scene navigation via iframe + hotspots.

## Entry points

- Canonical entry: `city/index.html`
- Home page link should point to: `city/index.html`
- Legacy scene/shell redirects were removed on purpose.

## Current folder layout

- `city/index.html` — shell UI (iframe container, doors list, music, flashlight, transitions)
- `city/places/` — all location pages
- `city/tools/` — tool/terminal pages
- `city/pics/` — image/video/gif assets (semantic filenames)
- `city/audio/` — mp3 tracks
- `city/js/` — project JavaScript files
- `city/data/` — data + PDFs + text payloads
- `city/posts/` — local post copies used by terminal
- `city/docs/` — project docs

## Places

All location pages now live in `city/places/`:

- `entry.html`
- `street.html`
- `square.html`
- `station.html`
- `arcade.html`
- `game.html`
- `library.html`
- `upstairs.html` — library upper floor
- `booth.html` — Cybersound listening booth
- `terminal.html`
- `tablet.html`
- `daemon.html`
- `rooftop.html`
- `workshop.html`
- `hotel.html`
- `lobby.html`
- `cafe.html`
- `bar.html`
- `map.html`
- `cubicle.html`
- `book.html`

## Tools

All tool pages now live in `city/tools/`:

- `tool-ai-news.html`
- `tool-brunle.html`
- `tool-bubble-sort.html`
- `tool-charcount.html`
- `tool-defi-amm.html`
- `tool-flow.html`
- `tool-geoquiz.html`

## JS placement

All project JS was consolidated into `city/js/`:

- `audio.js`
- `gesture-bridge.js`
- `idol-music.js`
- `nav-data.js`
- `scene-common.js`
- `wells-data.js`
- `test-browser-click.mjs`

## Data/docs placement

- PDFs moved to `city/data/`:
  - `blueprint.pdf`
  - `forster.pdf`
  - `plan.pdf`
- Text/data:
  - `city/data/wells.txt`
  - `city/js/wells-data.js`
- Documentation:
  - `city/docs/city.md`

## Naming conventions adopted

- Media uses semantic names (no numeric prefixes), e.g.:
  - `street-main.jpg`
  - `square-main.jpg`
  - `library-terminal.jpg`
  - `library-tablet.jpg`
  - `entry-transition.mp4`
  - `hall-loop.gif`
- Audio uses semantic names:
  - `audio/lights.mp3`
  - `audio/aeron.mp3`
  - `audio/discontent.mp3`

## Runtime notes

- `index.html` loads `places/entry.html` in iframe by default.
- Shell route normalization maps bare scene names (`street.html`) to `places/street.html`.
- `tools/*` and `posts/*` routes are allowed directly.
- `gesture-bridge.js` remains the event bridge between scene iframe and shell.
- A scene can trim the shell's corner buttons by posting `{ type: 'city:chrome', music, immersive }`:
  `music: false` hides the music button, `immersive: true` hides all corner buttons and the flashlight beam.
  The shell resets both on every `city:scene` message, so other scenes are unaffected.

## Wayfinding: immersion first

The City should feel like a place you walk through, not a website: no labels floating in the air,
no "click here". You find your way the way you would in a real city: by signs, doors, light and
what you recognise from where you've been. When a way isn't obvious, fix the picture first
(a sign, a lit doorway, a recognisable street end), not the interface.

- Square: the alley back to the street is drawn with the street's own signs (ROOFTOP, WORKSHOP,
  ARCADE) visible down it; a pink neon sign in the hotel's style points right to the Neo Tokyo Hotel.

Possible later (not now, it works against immersion): hint labels like the booth's, flashing on
entry and showing on hover ("↩ STREET", "NEO TOKYO HOTEL ▸"). Keep it as a fallback if people
still get lost after the pictures are clear.

## Listening booth

`places/booth.html` (library → stairs → `upstairs.html` → booth) plays the records from the
Cybersound longread (`https://expectfun.github.io/longplay/cybersound/`) and shows the post itself.

- TV: the YouTube video; click to zoom into a full-screen video view.
- Terminal: live green text; click to open the reader (post text, video in the corner, sides list, cue prompt).
- Turntable / crates: pick and play records; an empty turntable opens the crates.
- The post is fetched live from longplay. Parts meant for the longplay site only are dropped: anything
  marked `data-longplay-only`, and the blue/red pills (`.pills`) with the paragraph introducing them
  (`js/longplay-only.js`, shared with the library terminal's longplay posts).

### City music vs. booth music (open question)

The booth has its own player, which clashes with the city's music button. The booth is soundproof:
walking in holds the city music silent (`__CITY_AUDIO_API__.hold(true)`), and nothing restarts it
while inside, not a click and not the tab becoming visible again. Leaving resumes it if it was playing.

Current behaviour:

- Booth view: the city's music button is hidden; flashlight and links stay.
- Reader and full-screen video: all corner buttons are hidden (each view has its own `[ESC] BACK TO BOOTH`).

Other approaches considered, not decided:

- One button for "what's playing here": in the booth the corner music button controls the record
  instead of the city playlist, so the user sees a single sound system.
- Show the music button but disabled/dimmed while a record plays ("City music paused — the booth is playing").
- Hide all corner buttons in the booth view too (rejected for now: the links/map are the city's
  consistent navigation and a second way out).

## Known external dependencies (intentional)

- Tone.js CDN in `js/idol-music.js`
- External iframes/links in some tools/scenes (`expectfun`, `shir-man`, `city.cyberpunk.ru`, etc.)
- pdf.js CDN in `places/book.html`

These are not broken links; they are current product behavior.
