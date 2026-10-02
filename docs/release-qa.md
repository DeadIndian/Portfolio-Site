# Release QA

Date: 2026-09-27

**Verdict: ready for Vercel deployment.** This verdict covers the local production
build and live-provider checks below, not an already-deployed Vercel instance.

## Confirmed Target

- Production origin: `https://gollabharath.me`.
- Hosting: Vercel, using the Next.js preset and Node.js 22.
- Medium remains intentionally unconfigured; no Medium credential is required.
- The owner restored `stats.gollabharath.me`; its dependent feeds were rechecked.

## Fixed During QA

`next.config.ts` mixed `module.exports` and `export default`. Production responses
were missing the intended security headers and exposed `X-Powered-By: Next.js`.
The configuration now has a single export, retaining the development origins.
A Playwright regression test failed before the fix and passed after it.

`package.json` now pins Node.js 22 for the tested Vercel runtime. Playwright builds
and starts a fresh production server on port 3101 rather than reusing a dev server.
Cross-browser release tests and a non-opening HTML report were added.

## Results

| Check | Result |
| --- | --- |
| Production build and TypeScript | Passed |
| ESLint | Passed |
| Unit tests | 96 passed |
| Production Playwright suite | 39 passed, no failures or retries |
| Automated accessibility | No violations in the tested WCAG A/AA rules |
| Canonicals, social images, icons, route status codes | Passed |
| Security headers, including 404 responses | Passed |
| Production dependency audit | No reported vulnerabilities |
| External links | 33 of 35 returned HTTP 200; no confirmed 404s |

LinkedIn returned HTTP 999 and the public LeetCode profile returned a Cloudflare
HTTP 403 challenge. These two results are automation restrictions, not verified
broken links.

### Browser Coverage

| Profile | Content and navigation | 3D coverage |
| --- | --- | --- |
| Desktop Chromium 153 | Passed | Live WebGL |
| Android Chromium emulation | Passed | Live WebGL |
| Desktop Firefox 155 | Passed | Explicit static fallback |
| Desktop WebKit 26.6 | Passed | Live WebGL |
| iPhone WebKit emulation | Passed | Live WebGL |

The reactor's explosion, reassembly, rotation, five-layer separation, drag
handling, pause control, and renderer reuse passed the Chromium suite. Keyboard
focus return, nested dialogs, the terminal, desktop windows, resume navigation,
and narrow layouts were also checked. Cross-browser screenshots were inspected.

Headless Firefox could not create a WebGL context on this host. Its honest fallback
and working navigation were verified; live Firefox 3D and physical-device GPU
performance are not claimed. Chromium uses software rendering. WebKit ran with
isolated Linux libraries, without changing system packages; normal repeat runs
require the system dependencies documented in the README.

### Live Integrations

All five providers returned HTTP 200 with `status: "ok"`, and the real dashboard
rendered without uncaught browser errors:

- GitHub, including a 365-day contribution calendar.
- WakaTime.
- Discord through Lanyard.
- Spotify through Lanyard; an idle listening state is valid.
- LeetCode through the restored stats service.

These checks did not intercept provider requests. The deterministic browser suite
uses clearly identified fixtures separately. Provider health is a point-in-time
check, not a guarantee of future external availability.

The no-WebGL fallback passed the browser suite. A separate fault-injection check
blocked the HDR lighting asset and confirmed that the static preview and project
navigation remained usable.

## Reproduce And Deploy

Run the installation and verification commands in the README. The last full run's
HTML report is available with `npx playwright show-report`; reports and failure
artifacts are excluded from Git.

After deploying to Vercel and connecting the production domain, run:

```bash
PLAYWRIGHT_BASE_URL=https://gollabharath.me npm run test:e2e -- tests/e2e/release.spec.ts
```

Also check the five production `/api/signals/{provider}` endpoints without mocks.
Keep the stats subdomain running independently when changing the main domain's
DNS. Deployment, DNS propagation, and the final Vercel runtime have not been
performed or verified in this QA pass.
