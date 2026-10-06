# Kinomat

[kinomat.sk](https://kinomat.sk) is the programme of Bratislava's cinemas on one page: what is playing today and on the days ahead, across thirteen cinemas, filterable by cinema, genre, language and time, with a poster, a runtime and a price for each showing and a link to the cinema's own booking page. No accounts, no tracking, nothing to buy.

This repository is the site. The cinemas' programmes are collected by a separate pipeline, which resolves each cinema's own spelling of a title to the film it names and writes the result into Postgres; the site only reads. The schema they share is the [kinomat-core](https://github.com/MartinBorak/kinomat-core) package.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Cache Components) with TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Drizzle](https://orm.drizzle.team) over PostgreSQL
- [Temporal](https://tc39.es/proposal-temporal/) (via `temporal-polyfill`) for dates and times
- [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) for tests
- [pnpm](https://pnpm.io) as the package manager

## Getting started

Use the Node version in [`.nvmrc`](.nvmrc), then:

```bash
pnpm install
docker compose up -d --wait
pnpm db:setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). An empty database runs fine; every listing just says nothing is on.

Compose reads `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) and fails loudly if one is missing; the app reads `DATABASE_URL` from `.env.local`, of the form `postgres://<user>:<password>@localhost:5432/<database>`. Neither file is committed. `pnpm db:setup` applies the migrations and mirrors the cinema registry, both idempotent.

## Scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Run the site locally with live reload            |
| `pnpm build`        | Build for production (needs a migrated database) |
| `pnpm start`        | Run the production build                         |
| `pnpm lint`         | Lint with ESLint                                 |
| `pnpm format`       | Format with Prettier                             |
| `pnpm format:check` | Check formatting without writing                 |
| `pnpm typecheck`    | Type-check                                       |
| `pnpm test`         | Run the test suite once                          |
| `pnpm test:watch`   | Run the test suite in watch mode                 |
| `pnpm test:db`      | Run the query tests against Postgres             |
| `pnpm db:setup`     | Apply migrations and seed the cinemas            |

`pnpm test:db` runs the tests that need a real database, one file at a time because each starts by emptying it. Point it at a database you do not mind losing. Without a `DATABASE_URL` they skip, which is why `pnpm test` and CI's check job need no database at all.

`pnpm build` prerenders the landing page, so it needs a `DATABASE_URL` and a database with the migrations applied; CI stands up a throwaway Postgres for the build alone.

## Keeping the schedule fresh

Listings are cached and tagged. The pipeline, after writing a day, posts to `/api/obnovit` with a shared secret (`PUBLISH_SECRET`) and the whole schedule is rebuilt on the next request.

## Errors and analytics

Errors are reported to Sentry when `NEXT_PUBLIC_SENTRY_DSN` is set, which it is only on the deployed site. Page views and performance are counted by [Vercel Web Analytics](https://vercel.com/docs/analytics) and [Speed Insights](https://vercel.com/docs/speed-insights), which use no cookies, no local storage and no fingerprinting, and inject nothing outside the deployment.

## Licence

MIT. Film data and posters come from [TMDB](https://www.themoviedb.org) and [Wikidata](https://www.wikidata.org); this site is not endorsed or certified by TMDB.
