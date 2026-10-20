# Uncle Says Closed plan

A static web app that answers one question for a hungry person in Singapore. Is my hawker centre open today, and if not, where do I go instead? An "uncle" voice delivers the answer. It points to the nearest open centre and checks the 2-hour forecast so you know whether to bring an umbrella. The data comes from NEA's closure dataset on data.gov.sg. It is snapshotted at build time, so visitors never hit the rate-limited API.

Units, in order: U1 data snapshot, U2 status domain, U3 UI, U4 weather, U5 refresh and deploy.

## How to read this

One box is one unit of work. Check a box only when its evidence exists, a file, a test run, a log line or a screenshot. Each unit ends in a check before the next starts. U5's deploy step waits for the operator.

## The data shape

Everything downstream reads these types. The CSV's quirks (`D/M/YYYY` dates, `TBC`, `NA`, free-text remarks) are parsed away in U1 and never reach the app.

```ts
type IsoDate = string & { readonly __brand: 'IsoDate' }   // YYYY-MM-DD, Asia/Singapore

type Closure =
  | { kind: 'cleaning'; quarter: 1 | 2 | 3 | 4; start: IsoDate; end: IsoDate; remarks?: string }
  | { kind: 'works'; start: IsoDate; end: IsoDate; remarks?: string }
  | { kind: 'tbc'; quarter: 1 | 2 | 3 | 4 }

type Centre = {
  id: string; name: string; address: string
  lat: number; lng: number
  foodStalls: number; marketStalls: number
  description: string; photoUrl?: string
  closures: Closure[]
}

type Status =
  | { kind: 'closed'; closure: Closure; reopensOn: IsoDate }
  | { kind: 'closing-soon'; closure: Closure; daysUntil: number }   // within 7 days
  | { kind: 'open'; next?: Closure }
  | { kind: 'unknown'; quarter: 1 | 2 | 3 | 4 }                     // current quarter is TBC
```

`statusOn(centre, today)` is a pure function from those types to `Status`. The uncle's lines are a table keyed by `Status['kind']`, with several lines per kind picked at random. Adding a mood means adding a row, not another branch.

## U1. Snapshot the data

**Files.**

- [ ] Create `scripts/snapshot.ts`. It downloads dataset `d_bda4baa634dd1cc7a6c7cad5f19e2d68` through `poll-download`, parses it into `Centre[]`, and writes `public/data/centres.json` plus a `fetchedAt` timestamp.
- [ ] Create `scripts/fixtures/closures-2026-10-20.csv`, a copy of today's CSV used by the tests.

**Build.**

- [ ] Send a `User-Agent` header and retry with backoff on `TOO_MANY_REQUESTS`. Python's default agent gets a 403, and repeated downloads hit the rate limit within a minute (both observed during research).
- [ ] Map `TBC` to `{kind: 'tbc'}`, map `NA` works dates to no closure, and keep non-`nil` remarks verbatim. Seven rows split a closure across blocks, such as "Blk 79 closed on 28/12, Blk 79A on 29/12".
- [ ] Fail the build on any other unparseable date instead of dropping the row.

**Verify.**

- [ ] `npm run snapshot` on the fixture prints `123 centres, 466 cleaning, 47 works, 26 tbc`. These numbers match `research/audit_closures.py` on the same CSV.

## U2. Compute status in pure functions

**Files.**

- [ ] Create `src/domain/status.ts` with `statusOn` and `nearestOpen(centres, from, today)`, which uses the haversine distance.
- [ ] Create `src/domain/uncle.ts` with the line table.
- [ ] Create `src/domain/today.ts`. It returns today's `IsoDate` in `Asia/Singapore` from `Intl.DateTimeFormat`, whatever the browser's timezone.

**Verify.**

- [ ] `npx vitest run` passes these cases against the fixture, each with a literal expected value:
  - [ ] Bukit Timah Market on 2026-10-20 is `closed`.
  - [ ] Adam Road Food Centre on 2026-12-01 is `closing-soon` with `daysUntil: 6`. Its Q4 window starts 2026-12-07.
  - [ ] Adam Road Food Centre on 2026-12-08 is `closed` (the last day of its window), and on 2026-12-09 it is `open`.
  - [ ] Exactly 3 centres are closed on 2026-10-20, matching the audit script.
  - [ ] `today()` called at 2026-10-20T23:30 UTC returns `2026-10-21`.
  - [ ] `nearestOpen` from Bukit Timah Market never returns a centre that is closed that day.

## U3. Build the UI

**Stack.** Vite with TypeScript and no framework. There are two views and no shared state worth a library. The output is static files.

**Files.**

- [ ] Create `index.html`, `src/main.ts` and `src/style.css`.

**Build.**

- [ ] Home view. A search box over centre names and addresses, a "Near me" button that uses browser geolocation, and a strip of centres closed today ("Uncle's bad news board").
- [ ] Centre card. The uncle's verdict in large type, then the reopening date or the next closure, the stall count, the description, and when it is closed, "Go here instead", which links the nearest open centre with its distance.
- [ ] Show "data as of `fetchedAt`" in the footer. Show the remarks verbatim when present.
- [ ] When geolocation is denied, fall back to search with no error dialog.

**Verify.** Playwright MCP against `npm run dev`, with the clock pinned to 2026-10-20 and the geolocation mocked:

- [ ] Search "Bukit Timah", open the card, and save `closed.png`. Pass when it shows a closed verdict and an open alternative.
- [ ] Mock the location near Adam Road and press "Near me". Save `near-me.png`. Pass when Adam Road is first.
- [ ] Deny geolocation and save `denied.png`. Pass when search still works and no error dialog appears.
- [ ] At 375px width, save `mobile.png`. Pass when there is no horizontal scroll.

## U4. Add the weather line

**Build.**

- [ ] On the centre card, fetch `https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast` from the browser. Pick the nearest of the 47 forecast areas by `label_location` and add a line such as "Thundery showers until midnight. Chope the seat in the middle, not the edge."
- [ ] If the fetch fails or is rate-limited, hide the line. The verdict never waits on the weather.

**Verify.**

- [ ] With the forecast route blocked in Playwright, the card renders the same verdict and no weather line. Save `no-weather.png`.
- [ ] With the forecast route stubbed to "Thundery Showers", the rain line appears. Save `rain.png`.

## U5. Refresh daily and deploy to GitHub Pages

One workflow does the snapshot, the build and the deploy. The JSON is never committed. It lives only in the Pages artifact, so the repo history stays code-only.

- [ ] Add `.github/workflows/deploy.yml` with three triggers. `push` to `main`, `schedule` at `0 21 * * *` (05:00 Singapore time, before breakfast), and `workflow_dispatch` for a manual refresh.
- [ ] Steps are `npm ci`, `npm run snapshot` with `DATA_GOV_SG_API_KEY` from repo secrets, `npm test`, `npm run build`, `actions/upload-pages-artifact` on `dist/`, then `actions/deploy-pages`.
- [ ] A failed snapshot or test fails the run before deploy, so the last good site stays live.
- [ ] Set `base` in `vite.config.ts` to `/<repo-name>/` because Pages serves project sites under a subpath.
- [ ] Pause for the operator. Create the public repo under `git@github-personal:`, add the secret, set Pages source to "GitHub Actions", and approve the first deploy.

**Verify.**

- [ ] Trigger `workflow_dispatch` and confirm the Pages URL shows the "data as of" footer with that run's timestamp.

## Appendix A. Research evidence

All of these were measured on 2026-10-20 with the scripts in `research/`.

- The closure CSV has 123 centres, 466 dated cleaning windows, 47 works windows and 26 `TBC` windows. Every centre has coordinates, so the separate Hawker Centres GeoJSON (129 features) is not needed.
- 3 centres are closed on 2026-10-20. They are Bukit Timah Market, Clementi West Street 2 Blk 726, and Kim Keat Palm Market and Food Centre.
- The 2-hour forecast returns 47 named areas with coordinates and a valid period.
- The download API returned `TOO_MANY_REQUESTS` after about six requests in a minute, with a message recommending an API key.

## Appendix B. Alternatives rejected

| Option | Why it lost |
|---|---|
| Query data.gov.sg from the browser for closures | The rate limit would fail under any real traffic, and the data changes only quarterly. |
| Next.js or React | It adds a server or framework for two views and one JSON file. |
| Join the Hawker Centres GeoJSON | The closure CSV already has coordinates. A name join adds a failure mode for no gain. |
| A food hygiene "hall of shame" | The suspension records in the eating-establishments list date from 2015 and 2016. Shaming named businesses with stale data is unfair and a legal risk. |

## Appendix C. Risks

- NEA may rename columns or change the date format. U1 fails the build instead of shipping wrong answers.
- GitHub disables scheduled workflows in a public repo after 60 days without commits. GitHub emails a warning first, and one click re-enables it. Until then the site keeps serving the last snapshot.
- Scheduled runs can start late when GitHub is busy. A 05:00 schedule leaves hours of slack before lunch.
- Next year's dates appear only when NEA publishes them. Near year end, `statusOn` returns `open` with no `next`, and the card says the schedule is not out yet.
- A remark can make a multi-block centre partly open. U3 shows the remark next to the verdict, because parsing free text is not worth the risk.

## Appendix D. Later ideas

- **Grade check.** Look up any eating place's NEA hygiene grade and demerit points. The list holds 36,687 licences (A 16,477, B 14,686, C 222, no grade 5,302), and 1,444 carry demerit points. Matching is by free-text address, so it needs its own search.
- **Healthier Dining map.** HPB publishes a Healthier Dining Partners list. Not yet inspected.
- **Hawker price tracker.** The CPI dataset may break out hawker food items. The download was rate-limited, so this is unverified.
