import { parseBratislavaTime } from 'kinomat-core/lib/time'
import { describe, expect, it } from 'vitest'

import {
  type ListedFilm,
  type ProgrammeListing,
  type Showing,
} from '@/site/program/groupScreenings'
import {
  serializeJsonLd,
  toFilmListGraph,
  toListingGraph,
  toSiteGraph,
} from '@/site/seo/listingGraph'

const WAVES: ListedFilm = {
  id: 47,
  publicId: 'k7f3q2abcd',
  alias: null,
  titleSk: 'Vlny',
  titleEn: 'Waves',
  originalTitle: 'Vlny',
  releaseYear: 2024,
  runtimeMinutes: 131,
  imdbId: 'tt26670392',
  csfdId: null,
  posterPath: '/vlny.jpg',
  directors: ['Jiří Mádl'],
  genres: [{ id: 18, nameSk: 'Dráma', nameEn: 'Drama' }],
}

const LUMIERE = {
  id: 'kino-lumiere',
  name: 'Kino Lumière',
  address: 'Špitálska 4, Bratislava',
  cityId: 'bratislava' as const,
}

const SHOWING = {
  id: 1,
  startsAt: parseBratislavaTime('2026-09-05T20:15:00'),
  format: ['2d'],
  language: 'cs',
  subtitles: 'sk',
  bookingUrl: 'https://kino.lumiere.sk/vstupenky/1',
  eventNote: '',
  price: null,
}

const PROGRAMME: ProgrammeListing = {
  id: 1,
  films: [WAVES],
  cinemas: [{ ...LUMIERE, showings: [SHOWING] }],
}

describe('toListingGraph', () => {
  it('describes each film and cinema once and one event per showing pointing at them', () => {
    const graph = toListingGraph([PROGRAMME], 'en', 'bratislava')['@graph']

    expect(graph).toHaveLength(3)
    expect(graph[0]).toEqual({
      '@type': 'Movie',
      '@id': '#film-k7f3q2abcd',
      url: 'https://kinomat.sk/en/bratislava/filmy/k7f3q2abcd',
      name: 'Waves',
      alternateName: 'Vlny',
      datePublished: '2024',
      duration: 'PT131M',
      image: 'https://image.tmdb.org/t/p/w500/vlny.jpg',
      director: [{ '@type': 'Person', name: 'Jiří Mádl' }],
      genre: ['Drama'],
      sameAs: ['https://www.imdb.com/title/tt26670392/'],
    })
    expect(graph[1]).toEqual({
      '@type': 'MovieTheater',
      '@id': '#cinema-kino-lumiere',
      name: 'Kino Lumière',
      // Our page is its url; the cinema's own site is what it is the same as.
      url: 'https://kinomat.sk/en/bratislava/kina/kino-lumiere',
      sameAs: 'https://www.kino-lumiere.sk/',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Špitálska 4',
        addressLocality: 'Bratislava',
        addressCountry: 'SK',
      },
    })
    expect(graph[2]).toEqual({
      '@type': 'ScreeningEvent',
      name: 'Waves',
      // Summer time, so the offset is what tells a machine 20:15 was Bratislava's and not UTC's.
      startDate: '2026-09-05T20:15:00+02:00',
      location: { '@id': '#cinema-kino-lumiere' },
      workPresented: { '@id': '#film-k7f3q2abcd' },
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      inLanguage: 'cs',
      subtitleLanguage: 'sk',
      videoFormat: ['2d'],
      url: 'https://kino.lumiere.sk/vstupenky/1',
      offers: { '@type': 'Offer', url: 'https://kino.lumiere.sk/vstupenky/1' },
    })
  })

  it('names a film in the reader’s language and says nothing about what no catalogue told it', () => {
    const bare: ListedFilm = {
      ...WAVES,
      titleEn: '',
      releaseYear: null,
      runtimeMinutes: 0,
      imdbId: null,
      posterPath: null,
      directors: [],
      genres: [],
    }
    const [movie] = toListingGraph([{ ...PROGRAMME, films: [bare] }], 'sk', 'bratislava')['@graph']

    expect(movie).toEqual({
      '@type': 'Movie',
      '@id': '#film-k7f3q2abcd',
      url: 'https://kinomat.sk/bratislava/filmy/k7f3q2abcd',
      name: 'Vlny',
    })
  })

  it('offers the ticket at its price, and as a range where the cinema sells two tiers', () => {
    function offersAt(price: Showing['price']): unknown {
      const listing: ProgrammeListing = {
        ...PROGRAMME,
        cinemas: [{ ...LUMIERE, showings: [{ ...SHOWING, price }] }],
      }

      return toListingGraph([listing], 'sk', 'bratislava')['@graph'].find(
        (node) => node['@type'] === 'ScreeningEvent',
      )?.offers
    }

    expect(offersAt({ min: 7, max: 7 })).toEqual({
      '@type': 'Offer',
      url: 'https://kino.lumiere.sk/vstupenky/1',
      price: 7,
      priceCurrency: 'EUR',
    })
    expect(offersAt({ min: 11.9, max: 12.9 })).toEqual({
      '@type': 'AggregateOffer',
      url: 'https://kino.lumiere.sk/vstupenky/1',
      lowPrice: 11.9,
      highPrice: 12.9,
      priceCurrency: 'EUR',
    })
  })

  it('lists a double feature as one event presenting both films', () => {
    const second = {
      ...WAVES,
      id: 48,
      publicId: 'abcdk7f3q2',
      alias: null,
      titleSk: 'Sestry',
      titleEn: 'Sisters',
    }
    const graph = toListingGraph([{ ...PROGRAMME, films: [WAVES, second] }], 'sk', 'bratislava')[
      '@graph'
    ]
    const event = graph.find((node) => node['@type'] === 'ScreeningEvent')

    expect(graph.filter((node) => node['@type'] === 'Movie')).toHaveLength(2)
    expect(event).toMatchObject({
      name: 'Vlny + Sestry',
      workPresented: [{ '@id': '#film-k7f3q2abcd' }, { '@id': '#film-abcdk7f3q2' }],
    })
  })

  it('states a film and a cinema once however many showings they share', () => {
    const twice: ProgrammeListing = {
      ...PROGRAMME,
      cinemas: [{ ...LUMIERE, showings: [SHOWING, { ...SHOWING, id: 2 }] }],
    }
    const graph = toListingGraph([twice, { ...twice, id: 2 }], 'sk', 'bratislava')['@graph']

    expect(graph.filter((node) => node['@type'] === 'Movie')).toHaveLength(1)
    expect(graph.filter((node) => node['@type'] === 'MovieTheater')).toHaveLength(1)
    expect(graph.filter((node) => node['@type'] === 'ScreeningEvent')).toHaveLength(4)
  })
})

describe('toFilmListGraph', () => {
  // The summary page a movie carousel reads: each film's page, in the order the listing shows them.
  it('lists each film’s page in order, by its alias where it has one', () => {
    const [list] = toFilmListGraph(
      [
        { publicId: 'k7f3q2abcd', alias: 'vlny' },
        { publicId: 'abcdk7f3q2', alias: null },
      ],
      'en',
      'kosice',
    )['@graph']

    expect(list).toEqual({
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: 'https://kinomat.sk/en/kosice/filmy/vlny' },
        { '@type': 'ListItem', position: 2, url: 'https://kinomat.sk/en/kosice/filmy/abcdk7f3q2' },
      ],
    })
  })
})

describe('toSiteGraph', () => {
  it('names the site and who publishes it', () => {
    const graph = toSiteGraph('sk')['@graph']

    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Organization'])
    expect(graph[0]).toMatchObject({ name: 'Kinomat', url: 'https://kinomat.sk/' })
  })
})

describe('serializeJsonLd', () => {
  it('keeps a title from closing the script tag it is printed in', () => {
    const graph = toListingGraph(
      [{ ...PROGRAMME, films: [{ ...WAVES, titleSk: '</script><b>' }] }],
      'sk',
      'bratislava',
    )

    expect(serializeJsonLd(graph)).not.toContain('</script>')
    expect(JSON.parse(serializeJsonLd(graph))).toEqual(graph)
  })
})
