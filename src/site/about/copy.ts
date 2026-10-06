import { type Language } from 'kinomat-core/lib/language'

export type AboutCopy = {
  title: string
  pageDescription: string
  lead: string
  sections: readonly { title: string; paragraphs: readonly string[] }[]
  contact: string
}

/*
 * What a reader is owed about a site that shows other people's data: where it comes from, how far
 * to trust it, and what the site keeps about them. Plain sentences rather than terms; there is
 * nothing to agree to.
 */
export const aboutCopyByLanguage: Record<Language, AboutCopy> = {
  sk: {
    title: 'O Kinomate',
    pageDescription:
      'Kto robí Kinomat, odkiaľ berie program a informácie o filmoch a čo si o tebe pamätá.',
    lead: 'Program bratislavských kín na jednom mieste. Nekomerčný projekt.',
    sections: [
      {
        title: 'Odkiaľ je program',
        paragraphs: [
          'Program čítame z webových stránok kín, raz za deň. Kino ho môže zmeniť aj potom, takže pred cestou si ho over na stránke kina.',
          'Lístky nepredávame. Každé predstavenie odkazuje na kino, kde ich kúpiš. Cena pri predstavení je z tej istej stránky a platí o nej to isté: over si ju pri kúpe.',
        ],
      },
      {
        title: 'Chýba tu niečo?',
        paragraphs: [
          'Ktoré kiná tu sú, vidíš v zozname kín. Ak vieš o kine alebo premietaní, ktoré tu nie je, napíš nám.',
          'Ak máš kino a chceš byť v Kinomate, stačí nám program v akejkoľvek podobe.',
        ],
      },
      {
        title: 'Odkiaľ sú informácie o filmoch',
        paragraphs: [
          'Názvy, roky, dĺžky, réžiu, žánre a plagáty berieme z databáz TMDB a Wikidata. Kde sa pomýlia, opravujeme ich ručne.',
          'Tento produkt používa TMDB API, ale nie je schválený ani certifikovaný službou TMDB.',
        ],
      },
      {
        title: 'Súkromie',
        paragraphs: [
          'Kinomat nepoužíva cookies ani nič iné neukladá do tvojho prehliadača a nikoho nesleduje.',
          'Návštevnosť počítame anonymne a bez cookies: vidíme počty zobrazení stránok, nie návštevníkov.',
          'Ak nám napíšeš, tvoju adresu použijeme len na odpoveď.',
        ],
      },
    ],
    contact: 'Kontakt',
  },
  en: {
    title: 'About Kinomat',
    pageDescription:
      'Who makes Kinomat, where its showtimes and film details come from, and what it keeps about you.',
    lead: 'Bratislava’s cinema showtimes in one place. A non-commercial project.',
    sections: [
      {
        title: 'Where the showtimes come from',
        paragraphs: [
          'We read the schedule off each cinema’s website once a day. A cinema may change it after that, so check its own site before you go.',
          'We sell no tickets. Every showing links to the cinema, where you buy them. The price beside a showing comes from that same page, and the same goes for it: check it when you buy.',
        ],
      },
      {
        title: 'Something missing?',
        paragraphs: [
          'The list of cinemas shows which ones are in. If you know of a cinema or a screening that is not here, write to us.',
          'If you run a cinema and want to be in Kinomat, a schedule in any form is all we need.',
        ],
      },
      {
        title: 'Where the film details come from',
        paragraphs: [
          'Titles, years, runtimes, directors, genres and posters come from the TMDB and Wikidata databases. Where they are wrong, we correct them by hand.',
          'This product uses the TMDB API but is not endorsed or certified by TMDB.',
        ],
      },
      {
        title: 'Privacy',
        paragraphs: [
          'Kinomat sets no cookies, stores nothing else in your browser and tracks nobody.',
          'Visits are counted anonymously and without cookies: we see page view counts, not visitors.',
          'If you write to us, we use your address only to reply.',
        ],
      },
    ],
    contact: 'Contact',
  },
}
