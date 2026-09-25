# Golla Bharath / Dead Indian

Two different experiences, not a light/dark theme: Bharath's 3D engineering
studio and Dead Indian's interactive Linux desktop. Built with Next.js 16,
React 19, Three.js, React Three Fiber, Drei, GSAP and hand-authored CSS.

## Run

Requires Node.js 22 and npm.

```bash
npm ci
npm run dev -- --port 3100
```

Open **http://127.0.0.1:3100**. The port avoids the existing services on 3000-3002.

For a production server:

```bash
npm run build
npm run start -- --port 3100
```

The API routes require a Node server. This is not a static-export/GitHub Pages
build. No database or API credentials are required for the default public feeds.

## What's Here

- Bharath is the default: a reflective 3D hardware assembly with real explode,
  assemble and rotation controls, project dossiers, and a professional directory.
- Dead Indian is a separate desktop: KDE Flow wallpaper, a 3D CRT, keyboard and
  penguin, application icons, a dock, and movable windows. Windows minimize,
  restore, maximize and retain their position when minimized.
- A gateway briefly reveals the alternate identity once per browser session.
  The persona transition replaces the layout, navigation and objects. Reduced
  motion disables the automatic reveal and animated transition.
- One persistent WebGL renderer serves both scenes, avoiding repeated context and
  environment initialization. Local poster renders prevent an empty loading area;
  devices without WebGL still get every content section.
- Twenty projects: a searchable directory in the studio, an application-style
  file browser in the desktop, and detailed source-linked case studies.
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

The old portfolio's content and useful interactions were rebuilt rather than its
blocking boot sequence. The studio uses dossiers; the desktop uses applications.
The 3D interactions have ordinary button alternatives. There is no real shell
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
in `src/data/portfolio.ts`. The two interfaces and shared content live in
`src/components/worlds/`; their design system is in `src/app/worlds.css`.
The original photo and project screenshots were recovered from the previous
portfolio. The 3D geometry and poster renders were built for this site.

KDE's Flow wallpaper is by Sandra Smukaste (CC BY-SA 4.0); the studio HDR lighting
is from Poly Haven (CC0). Public attribution and source links are at `/credits`.
The new direction is documented in [design-v2.md](docs/design-v2.md), informed by
Anthropic's canonical frontend-design guidance and the Taste skills.

See [content sources](docs/content-sources.md) for provenance and important
corrections, including archived Gamify, prototype status, upstream credits and
the distinction between KDE community projects and core KDE.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright starts the dev server if needed and tests desktop/mobile Chromium,
including 320-1440px layouts, genuine 3D rendering and renderer reuse, desktop
window interactions, nested dialogs, identity transitions, terminal commands,
privacy, WebGL fallback, service failures and axe accessibility. Browser tests use
software WebGL so a physical GPU is not required; these are not hardware FPS tests.
Browser tests intercept provider requests with clearly marked deterministic
fixtures; live-provider checks are separate and depend on external availability.
Set `PLAYWRIGHT_BASE_URL` to test an already-running production build.

Fonts are bundled locally, so builds and page rendering do not depend on Google
Fonts. The app makes no analytics or tracking requests. Nothing is automatically
committed, pushed or deployed.
