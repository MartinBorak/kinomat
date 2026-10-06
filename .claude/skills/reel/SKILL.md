---
name: reel
description: Render the daily Instagram Reel - tomorrow's films scrolling past, most screened first - plus its cover, into reels/<day>/. Use when the user runs /reel or asks for the reel, the daily video, or the Instagram video for a day.
---

# Reel

One command renders the Reel and its cover for a day and writes them to `reels/<YYYY-MM-DD>/`
(gitignored) as `reel.mp4` and `cover.jpg`. The day is tomorrow in Bratislava unless the user
names another.

The format and the motion are fixed and must not be changed while running this skill: the view
is `src/app/[lang]/reel/` (page and `cover/`), the motion is in
`scripts/captureReel.mts` (0.6 s hold, a steady 350 px/s scroll, the logo stopping in
the middle of the screen, 2.5 s hold). A change to either is its own request, not part of a run.

## Before starting

- **The dev server must already be running.** Check, never start it yourself:
  `curl -sg -m 20 'http://[::1]:3000/reel' | grep -o '<title>[^<]*'` must print `<title>Kinomat`.
  If not, ask the user to start `pnpm dev` and stop. `[::1]` is deliberate: another project's app
  can hold `127.0.0.1:3000`.
- **The day must be in the local corpus.** The view reads the dev Postgres, so it shows whatever
  the last live run stored. If the run fails with `no films on <day>`, say so and suggest
  `/live-run`; do not substitute another day.
- `ffmpeg` must be on the path (`brew install ffmpeg` if missing, after asking).

## Run

```sh
node --import tsx scripts/captureReel.mts                 # tomorrow
node --import tsx scripts/captureReel.mts --day=2026-10-05 # a named day
```

Run it in the background and post a one-line status when it starts and when it ends. It takes
about two minutes for 45 films; frames are rendered into a temp folder and deleted afterwards.
An existing folder for the same day is overwritten.

If frames slow to a crawl while nothing uses the CPU, Chrome is being throttled as a background
page; the script already passes the flags against it, so check they are still there before
anything else.

## Report

In a few lines: the folder, the film count and video length from the script's output, and
`open reels/<day>/reel.mp4` so the user can watch it. Nothing is posted anywhere.
