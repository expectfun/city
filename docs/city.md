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
- The address bar follows the reader (`index.html?scene=library`, nothing for the entry), kept in step with
  `history.replaceState` on every frame load. Back/Forward come from the frame's own history; the URL only
  makes a reload or a shared link open the same place.
- Walking between scenes crossfades (0.4 s, a cross-document view transition): a one-line `<style>` with
  `@view-transition` in the head of every place and tool page (both pages must opt in, and inline it works even
  before any script has loaded). If the next picture isn't in yet, `gesture-bridge.js` fades it in when it
  arrives instead of letting it pop. Firefox and reduced motion: the instant switch, as before.
  New pages need the same `<style>` line.
- The entry transition video (~2 MB) is only fetched when the visit starts at the entry, not on deep links.
- Link previews: `og:`/`twitter:` tags in `index.html`, image `pics/share.jpg` (1200×630, from the street).
- `gesture-bridge.js` remains the event bridge between scene iframe and shell.
- A scene can trim the shell's corner buttons by posting `{ type: 'city:chrome', music, immersive }`:
  `music: false` hides the music button, `immersive: true` hides all corner buttons and the flashlight beam.
  The shell resets both on every `city:scene` message, so other scenes are unaffected.
- City music (`js/audio.js`): one playlist that carries over from scene to scene, not tied to places.
  The first three tracks are generated live in the browser (`js/live-music.js`, Tone.js from cdnjs:
  original music, no audio file, no GitHub Pages bandwidth), each in a different mood:
  "Rain Alley" (the default: slow, melancholic synthwave under rain), "Night Drive" (fast, bright
  outrun) and "Ghost Signal" (dark, slow film-score ambience). Chords, tempo, sounds and sections are
  fixed; arps, melody notes and details are picked at random as it plays, so it never repeats exactly.
  A live track never ends, so after ~4.5 minutes the playlist moves on to the next live one, and never
  by itself to an mp3: the three Moby mp3s (`audio/`, ~26 MB together) download only when someone picks
  one in the music menu. After the last Moby track the playlist wraps back to the live tracks.
- `tools/tool-live-music.html` ("How the City composes"): an explainer that plays the live tracks with the
  same code and shows how they're made: a 16-step grid per instrument (rules vs. dice), chords and sections
  (click to jump), a Chance dial (0% = the same every time, like a recording), the live wave and spectrum,
  each instrument's recipe and envelope, mute/solo. It holds the city music while open, like the booth.
  It's the third of the rooftop's visualisations (`rooftop.html?viz=music`), loaded with `?embed=1` into the
  overlay and unloaded when you leave it, and it is styled like the other two. Still open: a way in from the
  library booth too, close to the Cybersound post.
- Music is on by default for a new visitor and starts on their first click (usually entry → street);
  the music button glows a few times then, so it's easy to find. Turning music off (or on) is
  remembered in `localStorage` (`city-music-enabled`).
- Idea, not now: per-scene themes that take over on entering a scene. Rejected for now: clicking
  quickly through scenes would keep switching the music.

## Wayfinding: immersion first

The City should feel like a place you walk through, not a website: no labels floating in the air,
no "click here". You find your way the way you would in a real city: by signs, doors, light and
what you recognise from where you've been. When a way isn't obvious, fix the picture first
(a sign, a lit doorway, a recognisable street end), not the interface.

- Square: the alley back to the street is drawn with the street's own signs (ROOFTOP, WORKSHOP,
  ARCADE) visible down it; a pink neon sign in the hotel's style points right to the Neo Tokyo Hotel.

- White rabbit (`js/rabbit.js`): a trail from the entry to the booth (on the ferry to the gateway → street → library → stairs → booth door).
  It isn't there when a scene opens; after 5 s it fades in like a hologram switching on, a hint for whoever
  lingers. Once the booth has been found it appears no more (`city-rabbit-done` in `localStorage`).
  Arriving with the Longplay message brings it back for that tab, after 2.5 s instead of 5
  (`city-rabbit-call` in `sessionStorage`), on the trail to where that post waits (`city-rabbit-to`):
  Cybersound → the booth (as above); Cyberpunk 2020 → the library terminal (in the library it sits at the
  terminal's foot instead, and upstairs it isn't there). Reaching that place answers the call.
  A scene sets the other trail's spot with `to: { terminal: { at: [...] } }`, or `null` for none.
- The Longplay message (red pill → the City): it comes in on the HUD ~3 s after the static clears, typed
  (~15 keys/s), stays 4.5 s once complete, then folds into a chip in its corner: "1" while unread, a quiet dot and an envelope
  once read. Click the chip to open the whole message again; click it, Esc or a click in the scene closes it.
  Leaving the first scene before it's all in folds it at once, unread. The chip goes along from scene to scene
  and survives a reload (`city-msg` in `sessionStorage`); reaching where it leads (the booth or the terminal)
  retires it. The text itself is the pill's `data-hint` / `data-hint-head` in the Longplay posts, and the place is
  its `data-hint-to` (`city: terminal` in a Longplay post's front matter; booth by default).
- Booth: nothing is labelled. The door, the crates and the terminal (its screen already says
  "READ ▸") explain themselves; an empty turntable opens the crates. Two cues remain where a click
  does something you can't guess: on hover over the turntable once a record is on, "▶ PLAY" /
  "❚❚ PAUSE"; and on the TV, a small "⛶" in the corner of the picture (like a TV's on-screen
  display) saying it can be watched bigger.

Possible later (not now, it works against immersion): the same hover labels in the other scenes
("↩ STREET", "NEO TOKYO HOTEL ▸"). Keep it as a fallback if people still get lost after the
pictures are clear.

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
