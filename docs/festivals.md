# Festivals

How the site covered BE2CAN (14 to 21 October 2026) and FFi, Filmový festival inakosti (18 to 24
November 2026), kept as the starting point for the next festival. The code was removed when each
ended; it lives in these commits:

| Commit    | What it added                                                                    |
| --------- | -------------------------------------------------------------------------------- |
| `a48e533` | BE2CAN: the `/be2can` page and its menu entry, and the festival queries          |
| `7badf1c` | BE2CAN: the festival Instagram Story (`/reel/be2can`, its cover, `--view`)       |
| `dad8f71` | BE2CAN: a stored lineup, so a film stays listed after its marked showings passed |
| `fc3e3b3` | FFi: the `/ffi` page, its menu entry and the festival queries                    |
| `3952542` | FFi: the page lists films by first showing rather than by title                  |
| `78495e1` | FFi: the page keeps to the festival's cinemas                                    |
| `ea4e601` | FFi: the Story, its cover over the festival's blurred key visual                 |
| `23dde42` | FFi: the Story's caption template in the reel skill                              |

The city work (`ca3d4c7` onwards) came between the two, so FFi's commits fit today's code better:
start from them, rename `ffi` throughout, and replace the dates, cinemas and lineup.

## The page

`/<festival>` is the Program page with a smaller schedule behind it: the same `ProgramPage`, day
strip and filters, passed `section="<festival>"` so the header marks the right entry and every
day and filter link stays on the festival's URL (`toProgramHref(..., section)`). It belongs to no
city, and the menu offered it only on the festival's city's pages and its own.

## Which showings belong to it

No cinema feed says "festival". What there is:

- **Marked titles.** Some cinemas print the festival in the title (`BE2CAN: Pina`). BE2CAN's
  lineup was read off these: every film on a bill with a marked showing. FFi marked only its
  shorts, so that did not work.
- **A stored lineup.** FFi's films were listed by public id, taken from the festival's own
  programme by start time, together with its days and its cinemas (Lumière, Edison Filmhub). A
  lineup film's showings at other cinemas, or outside the days, are its ordinary run. BE2CAN
  needed one too: past screenings leave the table, so a film whose marked showings were all behind
  it dropped out. Fill it in on day one.
- **Unmarked showings of the same films.** Other cinemas print the bare title, so the page lists
  every showing of a lineup film within the festival's days and cinemas, marked or not.

## The Story

`scripts/captureReel.mts --view=<festival>` filmed a festival day as an Instagram Story into
`reels/<festival>/<day>/` (`story.mp4`, `cover.jpg`). Unlike the daily Reel it names cinemas and
times, orders films by first showing rather than by count, and scrolls slower (160 px/s against
350). BE2CAN's cover used its wordmark and key-visual colours; FFi's put its circle mark over its
blurred key visual. FFi's was rendered for tomorrow, and its caption opened with the festival's
full name, tagged its Instagram account, listed each film with director and every cinema and
time, and linked `kinomat.sk/ffi`, with five hashtags at most.

## Ending it

Remove the page, the menu entry and its test, the Story views and the `--view` option, the
festival queries and any sort or section type they alone used, and the skill's note, so nothing
festival-shaped is left without a user. `kinomat.sk/<festival>` then 404s; nothing linked it but
the menu and the Story.
