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

## Known external dependencies (intentional)

- Tone.js CDN in `js/idol-music.js`
- External iframes/links in some tools/scenes (`expectfun`, `shir-man`, `city.cyberpunk.ru`, etc.)
- pdf.js CDN in `places/book.html`

These are not broken links; they are current product behavior.
