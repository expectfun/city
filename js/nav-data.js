(function () {
  window.CITY_NAV = {
    doors: {
      'entry.html': [{ href: 'street.html', text: 'Street' }],
      'street.html': [
        { href: 'arcade.html', text: 'Arcade' },
        { href: 'library.html', text: 'Library' },
        { href: 'rooftop.html', text: 'Rooftop' },
        { href: 'square.html', text: 'Forward -> Square' },
        { href: 'workshop.html', text: 'Workshop' }
      ],
      'square.html': [
        { href: 'street.html', text: 'Street' },
        { href: 'station.html', text: 'Station' },
        { href: 'hotel.html', text: 'Neo Tokyo Hotel' },
        { href: 'daemon.html', text: 'Daemon (System)' }
      ],
      'station.html': [
        { href: 'square.html', text: 'Back to Street' },
        { href: 'http://city.cyberpunk.ru', text: 'Departures -> city.cyberpunk.ru', external: true }
      ],
      'arcade.html': [
        { href: 'game.html', text: 'Arcade machine' },
        { href: 'street.html', text: 'Back to Street' }
      ],
      'library.html': [
        { href: 'book.html', text: 'Book' },
        { href: 'terminal.html', text: 'Terminal' },
        { href: 'tablet.html', text: 'Tablet - The Time Machine' },
        { href: 'street.html', text: 'Back to Street' }
      ],
      'book.html': [{ href: 'library.html', text: 'Back to Library' }],
      'game.html': [
        { href: 'arcade.html', text: 'Back' },
        { href: 'https://expectfun.github.io/brunogames/brumba.html', text: 'Open full', external: true }
      ],
      'terminal.html': [
        { href: 'library.html', text: 'Back' },
        { href: 'street.html', text: 'Exit to Street' },
        { href: 'posts/jagged-intelligence.html', text: 'Jagged Intelligence - original' },
        { href: 'https://addyosmani.com/blog/good-spec/', text: 'Good Spec - original', external: true }
      ],
      'tablet.html': [
        { href: 'terminal.html', text: 'Back to Terminal' },
        { href: 'library.html', text: 'Library Room' }
      ],
      'daemon.html': [
        { href: 'square.html', text: 'Back to Street' },
        { href: 'entry.html', text: 'Entry' },
        { href: 'street.html', text: 'Street' },
        { href: 'index.html', text: 'Exit' }
      ],
      'rooftop.html': [
        { href: 'street.html', text: 'Back to Street' },
        { href: 'rooftop.html?viz=1', text: 'Visualizations (overlay)' }
      ],
      'tool-defi-amm.html': [{ href: 'rooftop.html', text: 'Back to Rooftop' }],
      'workshop.html': [
        { href: 'street.html', text: 'Back to Street' },
        { href: 'tools/tool-flow.html', text: 'Terminal - Flow' },
        { href: 'tools/tool-charcount.html', text: 'Terminal - Charcount' },
        { href: 'https://expectfun.github.io/vibetools/', text: 'Vibe tools (external)', external: true }
      ],
      'tool-flow.html': [{ href: 'workshop.html', text: 'Back to Workshop' }],
      'tool-charcount.html': [{ href: 'workshop.html', text: 'Back to Workshop' }],
      'hotel.html': [
        { href: 'square.html', text: 'Street' },
        { href: 'lobby.html', text: 'Lobby' },
        { href: 'station.html', text: 'Station' }
      ],
      'lobby.html': [{ href: 'hotel.html', text: 'Back to Hotel' }],
      'cafe.html': [
        { href: 'hotel.html', text: 'Hotel' },
        { href: 'map.html', text: 'Map' }
      ],
      'map.html': [
        { href: 'cafe.html', text: 'Back to cyber cafe' },
        { href: 'cubicle.html', text: 'Cubicle' }
      ],
      'cubicle.html': [{ href: 'map.html', text: 'Back to map' }],
      'bar.html': [{ href: 'square.html', text: 'Back to Street' }]
    },
    graph: {
      nodes: [
        'arcade.html', 'bar.html', 'book.html', 'cafe.html', 'daemon.html', 'entry.html',
        'game.html', 'hotel.html', 'street.html', 'index.html', 'library.html', 'lobby.html',
        'map.html', 'rooftop.html', 'station.html', 'square.html', 'tablet.html', 'terminal.html',
        'workshop.html', 'cubicle.html'
      ],
      edges: [
        ['arcade.html', 'game.html'], ['arcade.html', 'street.html'], ['arcade.html', 'index.html'],
        ['bar.html', 'square.html'], ['bar.html', 'index.html'],
        ['book.html', 'library.html'], ['book.html', 'index.html'],
        ['cafe.html', 'hotel.html'], ['cafe.html', 'map.html'], ['cafe.html', 'index.html'],
        ['daemon.html', 'index.html'], ['daemon.html', 'station.html'],
        ['entry.html', 'street.html'], ['entry.html', 'index.html'],
        ['game.html', 'street.html'], ['game.html', 'index.html'],
        ['hotel.html', 'lobby.html'], ['hotel.html', 'square.html'], ['hotel.html', 'cafe.html'], ['hotel.html', 'index.html'],
        ['street.html', 'arcade.html'], ['street.html', 'library.html'], ['street.html', 'rooftop.html'],
        ['street.html', 'square.html'], ['street.html', 'workshop.html'], ['street.html', 'index.html'],
        ['library.html', 'street.html'], ['library.html', 'book.html'], ['library.html', 'terminal.html'],
        ['library.html', 'tablet.html'], ['library.html', 'index.html'],
        ['lobby.html', 'hotel.html'], ['lobby.html', 'index.html'],
        ['map.html', 'cafe.html'], ['map.html', 'cubicle.html'],
        ['rooftop.html', 'street.html'], ['rooftop.html', 'index.html'],
        ['station.html', 'square.html'], ['station.html', 'daemon.html'], ['station.html', 'index.html'],
        ['square.html', 'hotel.html'], ['square.html', 'street.html'], ['square.html', 'station.html'],
        ['square.html', 'bar.html'], ['square.html', 'index.html'],
        ['tablet.html', 'index.html'], ['tablet.html', 'library.html'],
        ['terminal.html', 'index.html'], ['terminal.html', 'library.html'],
        ['workshop.html', 'street.html'], ['workshop.html', 'index.html']
      ]
    },
    videoTransitions: {
      'entry.html': { to: 'street.html', src: 'pics/entry-transition.mp4' }
    }
  };
})();
