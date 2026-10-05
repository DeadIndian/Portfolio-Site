# Golla Bharath / Dead Indian

## Current visual preview

The latest design is a standalone 3D journey through six themed worlds. Open
[the demo instructions](design-demos/README.md) and
[the review checkpoint](design-demos/REVIEW.md) for the current work.

```sh
python3 -m http.server 3120 --bind 0.0.0.0 --directory design-demos
```

Review it at **http://localhost:3120/**. Application integration follows the
owner's visual feedback and approval.

## Existing application

Bharath's Fedora/KDE desktop opens first. **Meet DeadIndian** enters an original,
evolving 3D workshop: five personal chapters about learning, Linux, sharing useful
tools, his people, and the JARVIS ambition. Built with Next.js 16, React 19,
Three.js, React Three Fiber, Drei, GSAP and hand-authored CSS.

## Run

Requires Node.js 22 and npm.

```bash
npm ci
mkdir -p .workshop/tmp
export TMPDIR="$PWD/.workshop/tmp"
npm run dev -- --port 3110
```

Open **http://localhost:3110** for Bharath's desktop or
**http://localhost:3110/#workshop-learning** for the personal journey.
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
- DeadIndian's workshop is a detailed miniature room with a learning desk,
  handmade collection, monitor, task lamp, home server, guest seat, and an
  unfinished JARVIS workbench. The room develops as the chapters progress.
- The monitor cycles through illustrated Kubuntu, Arch/Hyprland, and Fedora/KDE
  desktop memories. The handmade shelf opens the six Odin builds. Tools link to
  real projects. The guest seat pulls up to the desk. The five-layer arc reactor
  can be taken apart and reassembled; JARVIS links to the actual prototype.
- Direct chapter links: `#workshop-learning`, `#workshop-linux`, `#workshop-tools`,
  `#workshop-people`, and `#workshop-future`. Browser back/forward keeps the story
  and scene together. `#desktop` returns to Bharath.
- One persistent WebGL renderer serves both worlds. It switches to on-demand
  rendering for reduced motion, manual pause, overlays, and hidden documents.
  Local scene posters and readable text remain available if WebGL is unavailable
  or its context is lost. Every 3D interaction has an ordinary button alternative.
- Twenty projects: an application-style file browser in the desktop, a searchable
  directory under the workshop's **Project files**, and source-linked case studies.
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

The workshop's **Full story** opens an accessible, continuous reading view.
The room is an artistic interpretation of owner-confirmed accounts. Its desktop
studies are illustrations; the calculator screenshot and portrait are actual
portfolio artifacts. The name's origin stays undisclosed. There is no real shell
execution, fake contact submission, invented activity count or listening state.

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
in `src/data/portfolio.ts`. Personal chapters and desktop memories live in
`src/data/workshop.ts`. The interfaces and shared content live in
`src/components/worlds/`; workshop styling is in `src/app/workshop.css` and
desktop/shared styling is in `src/app/worlds.css`.
The original photo and project screenshots were recovered from the previous
portfolio. The 3D geometry and poster renders were built for this site.

KDE's Flow wallpaper is by Sandra Smukaste (CC BY-SA 4.0); the studio HDR lighting
is from Poly Haven (CC0). Public attribution and source links are at `/credits`.
The accepted personal context is in [deadindian-direction.md](docs/deadindian-direction.md).
The active design and implementation notes are in [workshop-build.md](docs/workshop-build.md).
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
- `workshop.spec.ts` covers real 3D monitor clicks, all five chapters, URL/history
  navigation, project links, chair and reactor interactions, retained desktop
  windows/renderer, motion controls, the reading overlay, and WebGL loss/fallback.
- `release.spec.ts` runs in all five projects: `desktop`, `mobile`, `firefox`,
  `webkit`, and `mobile-webkit` (iPhone emulation). Its three smoke tests cover
  security headers and 404s, canonical metadata and decodable local share/icon
  images, and the critical project-search/dossier, keyboard focus, desktop,
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
