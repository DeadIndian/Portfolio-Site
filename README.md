# Golla Bharath / DeadIndian

Bharath opens on the Fedora/KDE computer desktop. **DeadIndian** enters the
approved six-world 3D journey: Minecraft, One Piece, Iron Man/JARVIS, Linux,
community, and an open ending. **Bharath** in the journey header returns to the
desktop with its windows and content state intact.

The owner approved this integration and publication to `main` on 7 October 2026.
The standalone visual reference remains in `design-demos/`; the running website
uses native components and scoped styles under `src/components/journey/`.

## Run

Requires Node.js 22 and npm.

```bash
npm ci
mkdir -p .workshop/tmp
export TMPDIR="$PWD/.workshop/tmp"
npm run dev -- --port 3110
```

Open **http://localhost:3110** for Bharath's desktop or
**http://localhost:3110/#blocks** for the personal journey.
The dev server binds to `0.0.0.0` for access from other devices.

For a production server:

```bash
npm run build
npm run start -- --port 3110
```

The API routes require a Node server. This is not a static-export/GitHub Pages
build. No database or API credentials are required for the default public feeds.

## Deployment

The production target is Vercel at **https://gollabharath.me**. Import this project
with Vercel's Next.js preset and the default `npm run build` command; `package.json`
pins the tested Node.js 22 runtime. Add the domain in the Vercel project settings
and configure its DNS after deployment. No deployment is performed by the test tools.

Keep `stats.gollabharath.me` running independently when changing the main site's
DNS: the GitHub contribution calendar and LeetCode feed depend on it. Both feeds
must respond successfully before launch. `MEDIUM_USERNAME` remains optional and
can be configured later; the portfolio clearly labels its unconnected state.

## What's Here

- Bharath's dark desktop has KDE Flow wallpaper, a 3D CRT, application icons,
  a dock, and windows that drag, resize, minimize, restore, and maximize.
  The desktop stays mounted across persona switches, preserving its open windows.
- DeadIndian's six worlds preserve the approved models, typography, lighting,
  transitions, stories, and actions. The detailed Iron Man suit separates into
  28 armor sections, without the rejected black support figure.
- Direct chapter links: `#blocks`, `#voyage`, `#reactor`, `#linux`, `#connections`,
  and `#beyond`. `#desktop` returns to Bharath. Old workshop chapter links still
  resolve to the closest current chapter. Browser Back/Forward works across both.
- Each persona retains its renderer and interaction state after its first visit.
  Only the visible scene animates. Motion controls and system reduced-motion
  settings apply to both; local posters keep every chapter usable without WebGL.
  The journey's assets are loaded when it is first opened.
- Twenty projects in the desktop's application-style file browser, with detailed
  case studies, actual source links, and the existing tools and content panels.
- Six no-AI Odin builds presented as a physical-looking floppy-disk collection.
  The owner's claim applies only to these builds, not to the portfolio or assets.
- Experience, education, skills, certificates, Recurse leadership, Linux desktop,
  self-hosting, and community KDE pull requests with their researched status.
- Verified engineering notes plus a configurable Medium RSS feed.
- GitHub, WakaTime, Discord, Spotify and LeetCode panels, including activity
  calendars, language breakdowns, repo sorting, presence and track progress.
- A keyboard terminal: press `/` or `Ctrl/Cmd+K`. Run `help`, `whoami`, `theme`,
  `projects`, `linux`, `foss`, `recurse`, `odin`, `writing`, `stats`, `resume`,
  `contact`, or a social-platform name. Tab completes; arrow keys recall history.
- An updated `/resume` page with print/PDF styles. It does not link to the old,
  outdated Drive resume.

Each chapter's **The story** opens an accessible reading dialog. The personal
accounts remain the owner's own, and the name's origin stays undisclosed.
The Linux screens are illustrations; the calculator and portrait are original
portfolio artifacts. The terminal is an interface, not a real shell.

## Connect Medium

Create `.env.local` with your handle:

```dotenv
MEDIUM_USERNAME=your-handle
```

Restart the server. The application fetches `https://medium.com/feed/@your-handle`
server-side, strips markup and shows the latest articles. Until connected, it
explicitly labels Medium as unconnected and shows public GitHub guides instead.
No invented Medium profile or articles are included.

## Feed Behavior

| Feed                 | Source                                                | Server Cache | Notes                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub profile/repos | Public GitHub REST                                    | 5 minutes    | No authentication; repo list, stars and languages exclude forks and private records. Public repo count still includes all public repos.                                          |
| GitHub calendar      | Existing `/stats/github/contributions/daily` endpoint | 5 minutes    | Only the calendar endpoint is fetched, never the old privileged repository payload. This source omits collection time; the UI explicitly labels its timestamp as retrieval time. |
| WakaTime             | Public `deadindian/stats/all_time`                    | 5 minutes    | Uses the account's actual public range. No estimated annual total.                                                                                                               |
| Discord              | Lanyard user `972801524092776479`                     | 15 seconds   | Requires continued membership/tracking in Lanyard. Offline is distinct from a failed request.                                                                                    |
| Spotify              | Public listening activity through Lanyard             | 15 seconds   | Requires Spotify activity sharing in Discord. Idle does not imply the Spotify API is broken. No Spotify OAuth secrets are needed.                                                |
| LeetCode             | Existing `/stats/leetcode` endpoint                   | 5 minutes    | Respects provider collection time. Period submissions are summed from the calendar; the legacy acceptance-rate calculation is deliberately omitted.                              |
| Medium               | Public RSS                                            | 15 minutes   | Optional handle; fixed host, no arbitrary URL proxy.                                                                                                                             |

Each feed loads independently. Requests have a six-second deadline, byte limits,
in-flight deduplication, short failure backoff, and labeled stale fallback.
Server-side fallback expires after 60 seconds for presence/music and 24 hours for
static stats. The browser refreshes presence/music every 30 seconds and coding
stats every five minutes, pauses polling while hidden, and refreshes on return.
The old stats service sometimes responds slowly; a missing calendar must not
prevent the GitHub summary or other panels from rendering.

## Content And Privacy

`resumeData.json` remains unchanged. The server selects public fields before
passing data to the client; date of birth and phone number are not serialized.
The memory server is research input only: its notes, addresses, credentials and
administrative endpoints are not part of the app or its runtime integrations.

Edit project case studies, Odin entries, writing links, community links and socials
in `src/data/portfolio.ts`. Personal chapters live in
`src/components/journey/content.js`. The journey's scoped rendering controller,
models, and React host live beside it; local assets are under `public/journey/`.
Journey styles are in `src/app/journey.css`. The desktop and shared interfaces
remain in `src/components/worlds/` and `src/app/worlds.css`.
The original photo and project screenshots were recovered from the previous
portfolio. Five journey worlds and the desktop are procedural; the licensed Iron Man model
and its poster renders are attributed in `/credits` and the bundled asset credits.

KDE's Flow wallpaper is by Sandra Smukaste (CC BY-SA 4.0); the studio HDR lighting
is from Poly Haven (CC0). Public attribution and source links are at `/credits`.
The accepted personal context is in [deadindian-direction.md](docs/deadindian-direction.md).
The integration notes are in [journey-integration.md](docs/journey-integration.md).
The [workshop-build.md](docs/workshop-build.md) file records the retired design.
The earlier [design-v2.md](docs/design-v2.md) is historical.

See [content sources](docs/content-sources.md) for provenance and important
corrections, including archived Gamify, prototype status, upstream credits and
the distinction between KDE community projects and core KDE.

## Verify

```bash
mkdir -p .workshop/tmp
export TMPDIR="$PWD/.workshop/tmp"
npm run typecheck
npm run lint
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
```

On Linux, install missing system libraries with `npx playwright install-deps`.
If elevated privileges are needed, use your own terminal or CI provisioning;
do not share a sudo password with an agent.

By default, `npm run test:e2e` runs `npm run build` and then
`npm run start -- --port 3111`, testing a fresh production build at
**http://localhost:3111**. Keep port 3111 free: Playwright never reuses an existing
server. Tests run with one worker to avoid software-3D resource contention.

- `worlds.spec.ts` runs only in the existing `desktop` and `mobile` Chromium
  projects. It covers 320-1440px layouts, real desktop 3D, window geometry,
  nested dialogs, identity transitions, terminal commands, privacy, feed failure
  states and axe accessibility.
- `journey.spec.ts` covers retained window geometry and content through two persona
  round trips, chapter links/history, delayed suit loading, 28-part disassembly,
  hidden-renderer suspension, shared motion, keyboard focus, and mobile fallback.
- `release.spec.ts` runs in all five projects: `desktop`, `mobile`, `firefox`,
  `webkit`, and `mobile-webkit` (iPhone emulation). Its three smoke tests cover
  security headers and 404s, canonical metadata and decodable local share/icon
  images, and the critical project-file/dossier, story/map focus, desktop,
  terminal and resume journey under reduced motion.
- Release smoke tests record ready WebGL or an explicit static fallback in test
  annotations and fail on uncaught browser errors or unexpected console errors.
  A recorded fallback is not proof of 3D rendering; the Chromium suite still
  requires genuine 3D. Chromium uses SwiftShader and mobile DPR is capped at 1.
  These headless/emulated checks make no real-device GPU or hardware FPS claims.

An explicit `PLAYWRIGHT_BASE_URL` skips the local build and server startup and
targets an existing server, including the Vercel deployment:

```bash
PLAYWRIGHT_BASE_URL=https://gollabharath.me npm run test:e2e -- tests/e2e/release.spec.ts
```

The terminal list reporter is accompanied by an HTML report that does not open
automatically. Review it with `npx playwright show-report`; retain
`playwright-report/` and `test-results/` for release review, including failure
screenshots and traces.

Use the production test server for release metadata checks. Next.js development
mode can emit local-origin generated image URLs. Visual review uses viewport
screenshots and individual canvas captures: on this host, SwiftShader can truncate
WebGL layers in full-page captures even when the live viewport renders correctly.

Development source, assets, and plans belong in the persistent Git worktree.
`.workshop/` holds local browser profiles, test-only libraries, logs, and review
screenshots on disk and is excluded from Git. Keep `TMPDIR` set as above and push
completed feature-branch milestones.

Header, metadata, local image and 404 checks use real responses from the selected
server. Browser UI tests intercept provider/writing requests with deterministic
fixtures, including honest unavailable/unconfigured states, even when targeting
Vercel. Live external-feed availability and deployment API/asset checks are
separate release checks; mocked UI success does not verify those services.

Fonts are bundled locally, so builds and page rendering do not depend on Google
Fonts. The app makes no analytics or tracking requests. Nothing is automatically
committed, pushed or deployed.
