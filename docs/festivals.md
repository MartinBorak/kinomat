# Festivals

How the site covered BE2CAN (14 to 21 October 2026), kept as the starting point for the next
festival. The code was removed when it ended; it lives in three commits:

| Commit    | What it added                                                                   |
| --------- | ------------------------------------------------------------------------------- |
| `a48e533` | The `/be2can` page and its menu entry, and the festival queries behind them     |
| `7badf1c` | The festival Instagram Story (`/reel/be2can` and its cover) and `--view=be2can` |
| `dad8f71` | A stored lineup, so a film stays listed after its marked showings have passed   |

`git cherry-pick a48e533 7badf1c dad8f71` brings them back; then rename `be2can` throughout and
replace the stored lineup.

## The page

`/<festival>` is the Program page with a smaller schedule behind it: the same `ProgramPage`, day
strip and filters, passed `section="<festival>"` so the header marks the right entry and every
day and filter link stays on the festival's URL (`toProgramHref(..., section)`).

## Which showings belong to it

No cinema feed says "festival". What there is:

- **Marked titles.** Some cinemas print the festival in the title (`BE2CAN: Pina`). The lineup is
  read off these: every film on a bill with a marked showing (`ilike(rawTitle, '%be2can%')`).
- **Unmarked showings of the same films.** Other cinemas print the bare title, so the page lists
  every showing of a lineup film, marked or not.
- **The days.** The strip offers only days with a marked showing; before and after, the same
  films are the ordinary run, not the festival.
- **A stored lineup.** Past screenings leave the table, so once a film's marked showings were all
  behind it, it dropped out while its unmarked ones still played. `FESTIVAL_LINEUPS` in
  `findScreenings.ts` lists the films by public id; marked titles still add any film it misses.
  Fill it in on day one next time rather than after a film disappears.

## The Story

`scripts/captureReel.mts --view=be2can` filmed today's festival day as an Instagram Story into
`reels/be2can/<day>/` (`story.mp4`, `cover.jpg`). Unlike the daily Reel it names cinemas and
times, orders films by first showing rather than by count, and scrolls slower (160 px/s against
350). The cover used the festival's wordmark (from its own site's SVG) and key-visual colours.
It had no caption template.

## Ending it

Remove the page, the menu entry and its test, the Story views and the `--view` option, and the
festival queries, so nothing festival-shaped is left without a user. `kinomat.sk/<festival>` then
404s; nothing linked it but the menu and the Story.
