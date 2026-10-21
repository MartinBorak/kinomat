import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { Temporal } from 'temporal-polyfill'

/*
 * Films the /reel view frame by frame in headless Chrome and encodes out/reel.mp4. Frames are
 * placed, not recorded: each one sets the list's offset for its instant and is then captured, so
 * the motion is exact however long a capture takes.
 * Usage: capture.mts [--day=YYYY-MM-DD] [--base=http://[::1]:3000] [--cover-only].
 * The day defaults to tomorrow in Bratislava. [::1] reaches next dev, which listens on every
 * address, rather than another app that may hold 127.0.0.1:3000.
 */
const args = process.argv.slice(2)
function readArg(name: string) {
  return args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
}
const DAY =
  readArg('day') ?? Temporal.Now.plainDateISO('Europe/Bratislava').add({ days: 1 }).toString()
const VIEW_URL = `${readArg('base') ?? 'http://[::1]:3000'}/reel?den=${DAY}`
const COVER_ONLY = args.includes('--cover-only')
function toCoverUrl(viewUrl: string) {
  const url = new URL(viewUrl)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/cover`
  return url.toString()
}
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333
// Output goes to reels/<day the Reel shows>/ at the repo root; frames are scratch, deleted after.
const REELS_DIR = new URL('../reels/', import.meta.url)
const FRAMES_DIR = new URL(`file://${tmpdir()}/kinomat-reel-frames/`)

const FPS = 30
const INTRO_HOLD = 0.6
const OUTRO_HOLD = 2.5
// Two cards (about 175 px each) a second; a viewer pauses to read.
const SPEED = 350
const RAMP = 0.8
const VIEWPORT_HEIGHT = 768

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Just the DevTools protocol this script speaks: commands with replies, and one-shot events.
type CdpMessage = {
  id?: number
  method?: string
  params?: unknown
  result?: unknown
  error?: { message: string }
}
type Cdp = {
  send: <T = unknown>(method: string, params?: object) => Promise<T>
  once: (event: string) => Promise<unknown>
  close: () => void
}
type Evaluated<T> = { result: { value: T } }
type Screenshot = { data: string }
type Target = { type: string; webSocketDebuggerUrl: string }

async function connect(url: string): Promise<Cdp> {
  const socket = new WebSocket(url)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const pending = new Map<number, (message: CdpMessage) => void>()
  const waiting = new Map<string, (params: unknown) => void>()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage
    if (message.id !== undefined) {
      pending.get(message.id)?.(message)
    }
    if (message.method !== undefined) {
      waiting.get(message.method)?.(message.params)
    }
  })
  const ids = { next: 1 }
  return {
    send: <T,>(method: string, params: object = {}) =>
      new Promise<T>((resolve, reject) => {
        const id = ids.next++
        pending.set(id, (message) =>
          message.error
            ? reject(new Error(`${method}: ${message.error.message}`))
            : resolve(message.result as T),
        )
        socket.send(JSON.stringify({ id, method, params }))
      }),
    once: (event) => new Promise((resolve) => waiting.set(event, resolve)),
    close: () => socket.close(),
  }
}

/*
 * Where the list stands at each instant: a hold, one steady scroll that eases in and out over
 * RAMP seconds, and a hold on the end card. Constant speed in between, so nothing jumps.
 */
function buildTimeline(distance: number): number[] {
  const cruise = Math.max(0, distance / SPEED - RAMP)
  const scrollSeconds = cruise + 2 * RAMP
  const peak = distance / (cruise + RAMP)
  function positionAt(t: number) {
    return t < RAMP
      ? (peak * t * t) / (2 * RAMP)
      : t < RAMP + cruise
        ? (peak * RAMP) / 2 + peak * (t - RAMP)
        : distance - (peak * (scrollSeconds - t) ** 2) / (2 * RAMP)
  }
  function hold(seconds: number, at: number) {
    return Array.from({ length: Math.round(seconds * FPS) }, () => at)
  }
  const scroll = Array.from({ length: Math.round(scrollSeconds * FPS) }, (_, frame) =>
    positionAt(frame / FPS),
  )
  return [...hold(INTRO_HOLD, 0), ...scroll, ...hold(OUTRO_HOLD, distance)]
}

async function main() {
  const outDir: { url?: URL } = {}
  const profile = `${tmpdir()}/kinomat-reel-chrome`
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--hide-scrollbars',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  try {
    const targets = await (async function waitForChrome(attempt = 0): Promise<Target[]> {
      try {
        return (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as Target[]
      } catch (error) {
        if (attempt > 40) {
          throw error
        }
        await sleep(250)
        return waitForChrome(attempt + 1)
      }
    })()
    const page = targets.find((target) => target.type === 'page')
    if (page === undefined) {
      throw new Error('headless Chrome opened no page')
    }
    const cdp = await connect(page.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 432,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 2.5,
      mobile: true,
    })
    async function open(url: string) {
      const loaded = cdp.once('Page.loadEventFired')
      await cdp.send('Page.navigate', { url })
      await loaded
      await cdp.send('Runtime.evaluate', {
        awaitPromise: true,
        expression: `Promise.all([document.fonts.ready, ...[...document.images].map((image) => image.complete ? null : new Promise((done) => { image.onload = image.onerror = done }))])`,
      })
    }

    await open(toCoverUrl(VIEW_URL))
    const day = await cdp.send<Evaluated<string>>('Runtime.evaluate', {
      returnByValue: true,
      expression: `document.querySelector('[data-reel-day]').dataset.reelDay`,
    })
    if (day.result.value !== DAY) {
      throw new Error(`asked for ${DAY}, the view shows ${day.result.value}`)
    }
    outDir.url = new URL(`${day.result.value}/`, REELS_DIR)
    await mkdir(outDir.url, { recursive: true })
    const cover = await cdp.send<Screenshot>('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 95,
    })
    await writeFile(new URL('cover.jpg', outDir.url), Buffer.from(cover.data, 'base64'))
    console.log(`reels/${day.result.value}/cover.jpg written`)
    if (COVER_ONLY) {
      cdp.close()
      return
    }

    await open(VIEW_URL)
    const { result } = await cdp.send<Evaluated<{ top: number; height: number }[]>>(
      'Runtime.evaluate',
      {
        returnByValue: true,
        expression: `[...document.querySelectorAll('#reel-list [data-reel-card]')].map((card) => ({ top: card.offsetTop, height: card.offsetHeight }))`,
      },
    )
    const cards = result.value
    if (cards.length < 2) {
      throw new Error(`no films on ${DAY}`)
    }
    // The scroll ends with the end card's middle, where the logo is, in the middle of the screen.
    const endCard = cards.at(-1)!
    const timeline = buildTimeline(endCard.top + endCard.height / 2 - VIEWPORT_HEIGHT / 2)
    console.log(
      `${cards.length - 1} films, ${timeline.length} frames, ${(timeline.length / FPS).toFixed(1)} s`,
    )

    await rm(FRAMES_DIR, { recursive: true, force: true })
    await mkdir(FRAMES_DIR, { recursive: true })
    const started = Date.now()
    for (const [index, offset] of timeline.entries()) {
      // No animation-frame wait: a background page gets few, and the capture paints a fresh frame anyway.
      await cdp.send('Runtime.evaluate', {
        expression: `document.getElementById('reel-list').style.transform = 'translateY(${(-offset).toFixed(2)}px)'`,
      })
      const shot = await cdp.send<Screenshot>('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 95,
      })
      await writeFile(
        new URL(`frame-${String(index).padStart(5, '0')}.jpg`, FRAMES_DIR),
        Buffer.from(shot.data, 'base64'),
      )
      if (index % 150 === 0) {
        console.log(
          `frame ${index}/${timeline.length}  ${((Date.now() - started) / 1000).toFixed(0)} s`,
        )
      }
    }
    cdp.close()
  } finally {
    chrome.kill()
  }
  if (COVER_ONLY) {
    return
  }

  const encode = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-framerate',
      String(FPS),
      '-i',
      new URL('frame-%05d.jpg', FRAMES_DIR).pathname,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '18',
      '-movflags',
      '+faststart',
      new URL('reel.mp4', outDir.url).pathname,
    ],
    { stdio: 'inherit' },
  )
  if (encode.status !== 0) {
    throw new Error('ffmpeg failed')
  }
  await rm(FRAMES_DIR, { recursive: true, force: true })
  console.log(`${new URL('reel.mp4', outDir.url).pathname} written`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
