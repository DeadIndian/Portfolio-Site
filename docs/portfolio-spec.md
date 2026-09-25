# Bharath / Dead Indian Portfolio

The visual direction below records the first implementation, which the owner
rejected. [design-v2.md](design-v2.md) supersedes that direction. Content, privacy
and public integration requirements remain applicable.

## Objective

Build a detailed, publicly accessible portfolio for Golla Bharath. Recruiters land
on the professional identity; open-source peers can switch to Dead Indian without
losing access to content. No login or artificial intro gate is required.

## Design

- Direction: an engineering editorial, not a terminal-only portfolio.
- Bharath: warm ivory, ink, terracotta; DM Sans with Cormorant Garamond accents.
- Dead Indian: charcoal, off-white, electric lime; IBM Plex Mono accents.
- Anchor: a physical-looking identity card that briefly reveals the second identity.
- One small, non-strobing reveal per session. Disable it for reduced motion.
- Deliberate grids, thin rules, numbered sections, large type, restrained motion.
- DFII: impact 4 + fit 5 + feasibility 4 + performance 4 - consistency risk 3 = 14.

## Content And Acceptance

1. Start in Bharath mode. Keep both identity choices visible on desktop and mobile.
2. Hero identifies role, Hyderabad location, and a direct work/contact action.
3. Preserve profile, experience, project metadata, source links, social links,
   keyboard-accessible terminal/help, interactive project browsing, and live stats.
4. Add searchable/filterable detailed projects, including newer Linux and Recurse
   work. Preserve Calculator and Tic-Tac-Toe from the earlier portfolio.
5. Separate the six explicitly identified Odin projects into a no-AI hall of fame.
   The no-AI claim is supplied by the owner, not inferred from repository metadata.
6. Show Linux desktop and self-hosting as a substantive section: Fedora KDE laptop,
   Debian Dell OptiPlex, Plasma add-ons, containers, and practical infrastructure.
7. Show actual community PR statuses, upstream attribution, and Recurse leadership.
   The user's current Club Head statement overrides outdated memory/boolean fields.
8. Include education, grouped skills, certifications, and an up-to-date printable
   resume derived from the provided JSON. Do not expose DOB or phone by default.
9. Include Medium feed support. Owner chose to connect it later; use explicitly
   labeled, verified GitHub engineering notes in the meantime. No invented articles.
10. Independently load GitHub, WakaTime, Discord, Spotify, and LeetCode. Preserve
    contribution heatmaps, repository sorting, language breakdowns, activity,
    Spotify progress, and community links where trustworthy source data exists.
11. Never present failed integrations as zero activity or fabricated live data.
    Source, update time, unavailable and cached states must be discernible.
12. Work at 320, 768, 1024, and 1440px, including keyboard-only navigation. Native
    dialogs trap focus, close on Escape, and return focus to their trigger.

## Architecture

- Next.js App Router, React, TypeScript, hand-authored CSS, Lucide icons.
- Static portfolio content in `src/data/portfolio.ts`; original JSON untouched.
- Interactive UI in `src/components/`; pages and read-only API routes in `src/app/`.
- Public provider normalization and caching in `src/lib/signals.ts`.
- No database, analytics tracker, credentials in client code, or write-capable API.
- Server-side fixed-host fetching for CORS-sensitive WakaTime and Medium.
- Public-only GitHub REST data. Never pass through the old token-backed repo list.
- Optional environment configuration for Medium; other public integrations work
  without adding credentials. Provider failures do not block the rest of the page.

## Commands

- Development: `npm run dev -- --port 3100`
- Build: `npm run build`
- Production: `npm run start -- --port 3100`
- Type checking: `npm run typecheck`
- Lint: `npm run lint`
- Unit tests: `npm test`
- Browser tests: `npm run test:e2e`

## Style And Tests

Use functional React components, local state, explicit external-data types, and
semantic HTML. Prefer native buttons, links, details, and dialogs. No memoization
without evidence of a need. Source data stays separate from presentation.

```tsx
<button
  type="button"
  aria-pressed={mode === "dead"}
  onClick={() => setMode("dead")}
>
  Dead Indian
</button>
```

Unit tests cover provider contracts, privacy filtering, missing/malformed data,
timeouts/cache behavior, and feed URL safety. Playwright verifies theme switching,
the reveal's reduced-motion behavior, project filters/details, terminal commands,
contact actions, mobile navigation, and no horizontal overflow. Run axe against
both themes and dialogs. Review actual desktop and mobile screenshots.

## Boundaries

- Always: preserve the supplied JSON; label project status honestly; verify builds.
- Ask first: publishing, changing existing remote services, exposing private data.
- Never: invent Medium URLs, fake presence/statistics, claim prototypes are shipped,
  claim all projects are AI-free, publish memory-server internals, commit secrets.

## Delivery Order

1. Verified content and typed provider contracts.
2. Core page, themes, identity reveal, and responsive structure.
3. Project explorer, Linux/community sections, writing, resume, terminal, live data.
4. Build, lint, unit tests, browser/accessibility checks, documentation.
