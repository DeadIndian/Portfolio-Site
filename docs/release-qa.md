# Release QA

Date: 2026-10-07

**Verdict: the approved six-world journey is integrated as DeadIndian; Bharath's
Fedora/KDE desktop is preserved.** The owner approved the rendered HTML and
requested integration and publication to `main` on 7 October.

## Current verification

| Check | Result |
| --- | --- |
| ESLint and TypeScript | Passed |
| Unit tests | 96 passed |
| Fresh production build after the final CSS correction | Passed |
| Desktop/content suite | 18 passed across desktop/mobile Chromium |
| Journey integration suite | 8 passed; 4 intentional viewport-specific skips |
| Final release suite | 15 passed across all five browser profiles, no retries |
| Final accessibility rerun | Desktop/mobile checks passed after the CSS correction |
| Approved asset comparison | All 42 integrated assets match the approved demo |
| Final visual capture | All six worlds and both personas at 1440×1000 and 390×844; no overflow or page errors |

The desktop/content and journey results come from the saved run before this
continuation. They cover retained window position, size, minimization,
maximization, scroll and content settings; chapter links and browser history;
offscreen suit loading; armor disassembly; motion suspension; focus; terminal
commands; fallback; and automated accessibility. Application logic did not change
after those checks. The final visual review found inherited global header and
social-link styles; scoped overrides restore the approved journey appearance.
The production build and all release tests were repeated after that correction.

Chrome desktop/mobile and WebKit desktop/iPhone rendered live WebGL for both
personas. Firefox used and verified the explicit static fallback because this
host cannot create its WebGL context. Browser emulation does not establish
physical-device frame rates. WebKit used the existing local `libenchant`,
`libhidapi`, and `libmanette` libraries via `LD_PRELOAD`, since its bundled
launcher overwrites `LD_LIBRARY_PATH`.

The final release report is
`.workshop/journey-integration/verified-release-report/index.html`; its result
directory is `.workshop/journey-integration/verified-release-results/`.
The earlier core-suite evidence remains in `playwright-report/index.html`;
earlier release failures in that report are superseded by the final release run.
Screenshots and desktop/mobile contact sheets are under
`.workshop/journey-integration/qa/`, alongside `visual-results.json`.
These local artifacts stay on persistent disk and are excluded from Git.

The implementation and reproduction instructions are in
[journey-integration.md](journey-integration.md) and the repository README.
Git publication and any resulting hosting deployment are separate from these
local browser checks.

---

## Historical workshop checkpoint

Date: 2026-10-03

**Verdict: the evolving workshop passed local release verification.** The tested
application checkpoint is `10307c2` on `deadindian/feat/evolving-workshop`.
Bharath's professional desktop opens first; DeadIndian's five-chapter workshop
is complete. Deployment and the production domain are outside this local QA pass.

## Verification Record

OpenCode completed type checking, lint, 96 unit tests, and a fresh production
build followed by the full browser suite. The saved Playwright report records
47 passes, zero failures, zero flaky tests, and zero skipped tests; retries were
disabled. The browser run began at 02:21 UTC on 3 October and took 11.2 minutes.

The continuation reviewed that report and the saved viewport screenshots against
the unchanged application checkpoint, rechecked the live feeds, and completed
these documentation updates. No application code changed after the passing run.

| Check | Result |
| --- | --- |
| TypeScript, ESLint, production build | Passed |
| Unit tests | 96 passed |
| Production browser suite | 47 passed |
| Release routes, metadata, and critical journey | 15 passed across five browser profiles |
| Workshop chapters, objects, motion, and fallback | 12 passed across desktop/mobile Chromium |
| Desktop, content, terminal, and accessibility | 20 passed across desktop/mobile Chromium |
| Automated WCAG A/AA checks | No violations in the tested views and rules |
| Final responsive capture run | No horizontal overflow or uncaught page errors at 320, 768, and 1440px |
| Live public feeds | All five returned HTTP 200 and `status: "ok"` |

The local HTML report is `playwright-report/index.html`; the last-run status is
`test-results/.last-run.json`. Both are excluded from Git. The production server
used port 3111; the persistent development preview uses port 3110.

## Browser Coverage

| Profile | Passing tests | Scene observed in the release journey |
| --- | --- | --- |
| Desktop Chromium | 19 | Live WebGL in both worlds |
| Android Chromium emulation | 19 | Live WebGL in both worlds |
| Desktop Firefox | 3 | Explicit static fallback in both worlds |
| Desktop WebKit | 3 | Live WebGL in both worlds |
| iPhone WebKit emulation | 3 | Live WebGL in both worlds |

The Chromium checks cover all five chapters and their meaningful object actions:
the handmade shelf, Linux monitor, shared tools, guest chair, and reactor.
They also cover direct URLs and browser history, preserved desktop windows and
renderer, nested dossiers, terminal commands, keyboard focus, motion controls,
the continuous reading view, WebGL context loss, and complete WebGL unavailability.

Firefox could not create a WebGL context on this host, so its scene coverage is
the usable static fallback. Chromium uses SwiftShader. Physical-device GPU
performance and live Firefox 3D have not been measured. WebKit's extra Linux
libraries are isolated under `.workshop/system-deps/root`; see
[workshop-build.md](workshop-build.md) for the host-specific setup.

## Visual Review

The final review inspected the learning and future chapters at 320, 768, and
1440px, plus separate phone/tablet captures of the lower-page controls, chapter
navigation, and footer. The earlier desktop captures of Linux, tools, and people
were also inspected. Room framing, text wrapping, and controls remain usable in
the reviewed views; all five chapter links fit the narrow layout.

Evidence lives on persistent disk under `.workshop/qa/`:

- `final-{320,768,1440}-{learning,future}.png`
- `final-{320,768}-footer.png`
- `1440-{linux,tools,people}.png`
- `final-visual.mjs`, the final responsive capture script

Use viewport and canvas captures for scene review. SwiftShader can truncate
WebGL layers in full-page screenshots on this host. The room and its desktop
studies are illustrations; the calculator screenshot and portrait are real
portfolio artifacts. Asset provenance is documented on `/credits`.

## Fixes Included In The Tested Checkpoint

- Restore persona-switch focus after the destination leaves `inert`.
- Correct desktop resize coordinates and reset geometry after viewport changes.
- Improve chapter-number contrast, tablet scene framing, and phone navigation.
- Use native resume navigation after the reproduced workshop round-trip stall.
- Remove the request for absent Fedora artwork.
- Preserve the existing security headers, canonical metadata, real 404 responses,
  privacy checks, and graceful provider failure states.

## Live Integrations

The continuation queried the preview's API routes without mocks on 3 October,
around 04:24 UTC. GitHub, WakaTime, Discord, Spotify, and LeetCode each returned
HTTP 200 with `status: "ok"` and data. GitHub included a 366-day contribution
calendar. Spotify was idle, a valid listening state. `/api/writing` returned
HTTP 200 with `status: "unconfigured"`, matching the intentionally unconnected
Medium feed.

The deterministic browser suite uses identified fixtures for independent failure
states; the live check above used the real providers. Provider availability is
a point-in-time result. The dependency audit and outbound-link sweep recorded
on 27 September were not repeated for this documentation checkpoint.

## Reproduce And Deploy

The target remains Vercel at `https://gollabharath.me`, using the Next.js preset
and Node.js 22. Follow the installation and verification commands in the
[README](../README.md), keeping `TMPDIR` under the persistent `.workshop/`
directory. Run `npx playwright show-report` to inspect the saved browser report.

After deployment and domain setup, verify the deployed application with:

```bash
PLAYWRIGHT_BASE_URL=https://gollabharath.me npm run test:e2e -- tests/e2e/release.spec.ts
```

Also check all five production `/api/signals/{provider}` endpoints without mocks.
Keep `stats.gollabharath.me` running independently when changing the main site's
DNS. This checkpoint does not claim a Vercel deployment or production verification.
