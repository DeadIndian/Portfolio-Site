# Portfolio Content Sources

## Scope And Evidence

`src/data/portfolio.ts` is a static content module, not a live status feed. Its
evidence snapshot is **24 September 2026**. Research used the supplied resume,
read-only GitHub API and source inspection, the previous portfolio, and the
owner-authorized Basic Memory server. Private memory contents are not published.

The original `resumeData.json` was read and preserved. It is an input, not an
authority over newer source findings or the owner's explicit corrections. Its
SHA-256 before this work was:

```text
75ce9ae328abdb74fcc3f06207d0bec9d21e7511c896bc506df5a6abe020dfb7
```

Evidence is distinguished as follows:

- **Owner-confirmed:** personal context, the current Recurse Club Head role and
  the six no-AI Odin builds. These are first-party statements, not conclusions
  drawn from commit metadata.
- **Supplied source research:** repository/code findings, release records and PR
  states reported in the completed research. This delegation applies those
  findings; it does not claim to have repeated every source audit or runtime test.
- **Resume-origin:** project intent and technical details carried forward where
  no newer correction was supplied. A resume description does not verify that a
  service is running, a payment succeeds or software is used in production.
- **Narrow lookup in this delegation:** public GitHub metadata was used to resolve
  repository paths, especially `deads-sticky-notes`, `Portfolio-Site`,
  `recursekmit/Recurse-HQ`, `studio-1440` and
  `library-management-desktop-app`. These lookups establish links, not runtime
  behaviour, authorship of every file or deployment health.

Links to branches are moving references. PR states and archive status can change;
the module should be revised when there is new evidence, not silently presented
as a continuously refreshed source.

## Export Contract

The module exports only the requested type, interface and six arrays:

- `ProjectCategory`: `Full Stack`, `Infrastructure`, `Linux & FOSS`, `Experiments`.
- `Project`: the requested required fields and optional `live`, `note`, `image`
  and `featured` fields, without additional fields.
- `projects: Project[]`: 20 entries, including all 11 projects in the original
  JSON and the nine requested additions.
- `odinProjects`: exactly six entries with `id`, `title`, `repo`, `focus`,
  `number` and optional `image`.
- `contributions`: four upstream community PRs, with only `Merged`, `Open` or
  `Closed` as status values.
- `engineeringNotes`: three public writing links with their actual source types.
- `socials`: the nine supplied accounts, each with `name`, `url` and `handle`.
- `communities`: the three supplied Discord communities, without member counts.

There are no profile or experience exports. The main application retains
responsibility for consuming the original JSON and applying the documented
profile corrections without exposing private fields.

## Editorial Rules

- First-person copy describes work and technical choices, not invented impact.
  There are no fabricated users, performance gains, revenue, completion times or
  popularity counts.
- `year` is required by the interface. Unknown years are represented by `''`,
  not a guessed year or a repository timestamp repurposed as a completion date.
  The two `2026` values refer to the verified Wallpaper Carousel and Sticky Notes
  releases, not claims about when all development began or ended.
- Odin numbers `01` through `06` are display ordering, not dates, duration or a
  verified build chronology.
- A public repository, a deployment manifest or a package dependency does not
  establish a released application, live deployment or working integration.
- Every project has a GitHub source link. Only the explicitly approved ADB URL is
  included as `live`. Other optional live links are absent, not guessed or empty.
- Exactly four projects are featured: ADB, TransitOps, Tailscale Plasma Widget and
  Gamify. ADB uses `/images/adb.webp`; Gamify uses `/images/gamify.webp`.
  TransitOps and Tailscale have no image field. Tic-Tac-Toe uses
  `/images/tictactoe.webp`; the Odin Calculator uses `/images/calculator.webp`.
  These are the requested asset references; supplying assets belongs to the UI
  work and this delegation does not create or alter them.

## Project Provenance

| Project                             | Primary source                                                                                                                                                                                                                                             | Evidence and wording boundary                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advanced Discord Bot                | [Repository](https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot), [architecture](https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot/blob/main/ARCHITECTURE.md), [PR #2](https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot/pull/2) | Supplied research: the README explicitly credits DeadIndian as maintainer and the plugin-architecture PR was merged. The stack is Node.js, discord.js, Fastify and MongoDB. Worker/capability mediation has core and raw-client exceptions; it is not an absolute secure sandbox. The approved public URL is https://adb.gollabharath.me.                                                                                                                            |
| TransitOps                          | [Repository](https://github.com/DeadIndian/TransitOps)                                                                                                                                                                                                     | Supplied research confirms real Prisma transaction paths with row locking. Preserve that implementation detail rather than describing a hypothetical design. Source references disagree about HTTP versus HTTPS; omit the live link and do not infer production use.                                                                                                                                                                                                 |
| Tailscale Plasma Widget             | [Repository](https://github.com/DeadIndian/tailscale-widget)                                                                                                                                                                                               | Resume-origin implementation details: C++/Qt/QML, CLI JSON parsing, a diffing peer model, argument-array process calls and operator-permission guidance. Describe the widget, not a proven absence of all injection risks or a verified package-store release.                                                                                                                                                                                                       |
| Gamify                              | [Repository](https://github.com/DeadIndian/Gamify)                                                                                                                                                                                                         | Supplied research: archived at the snapshot date. Present an archived community project and a former lead-maintainer role, not ongoing leadership. Do not hardcode stars, forks or contributor-account counts, or turn contributor accounts into a managed-team size. The old https://gamify.pages.dev link is unverified and omitted.                                                                                                                               |
| Wallpaper Carousel                  | [Repository](https://github.com/DeadIndian/Wallpaper-Carousel), [releases](https://github.com/DeadIndian/Wallpaper-Carousel/releases)                                                                                                                      | Supplied research: v0.1.0 released 22 September 2026; C++/Qt 6/QML wallpaper picker with an optional slideshow, derived from KDE GPL code. No published COPR package is established.                                                                                                                                                                                                                                                                                 |
| Sticky Notes                        | [Repository](https://github.com/DeadIndian/deads-sticky-notes), [releases](https://github.com/DeadIndian/deads-sticky-notes/releases)                                                                                                                      | Supplied research: v1.0.0 released 16 August 2026. Derivative of the official KDE Notes widget with the owner's colour and ghost behaviour. Do not attribute all inherited code or the entire C++ implementation to the owner.                                                                                                                                                                                                                                       |
| kde-ship                            | [Repository](https://github.com/DeadIndian/kde-ship)                                                                                                                                                                                                       | Supplied research: Python/Bash tooling includes a Claude plugin. It is not an AI-free project, and tooling for publishing does not prove published packages exist.                                                                                                                                                                                                                                                                                                   |
| Recurse-HQ                          | [Club repository](https://github.com/recursekmit/Recurse-HQ)                                                                                                                                                                                               | Supplied research: React, React Three Fiber, Drei, Rapier and GSAP; a first-person 3D club-site experiment with the owner's initial commit. Do not claim sole authorship, tested production performance or a verified live site. Current Club Head is separately owner-confirmed.                                                                                                                                                                                    |
| Studio1440                          | [Repository](https://github.com/DeadIndian/studio-1440)                                                                                                                                                                                                    | Supplied research: Next.js/Firebase/Cloudinary catalog with order handoff to WhatsApp and Instagram. There is no integrated checkout to claim.                                                                                                                                                                                                                                                                                                                       |
| Gpu-run                             | [Repository](https://github.com/DeadIndian/Gpu-run)                                                                                                                                                                                                        | Supplied research: Rust/Tokio CLI for a local GPU queue, at MVP scope. No verified packaged/store release, distributed scheduler or performance result.                                                                                                                                                                                                                                                                                                              |
| Study Point                         | [Repository](https://github.com/DeadIndian/library-management-desktop-app)                                                                                                                                                                                 | Supplied research: Python/PyQt5/SQLite desktop seat and fee management. The repository name differs from the project title. Do not infer an audited accounting system or business deployment.                                                                                                                                                                                                                                                                        |
| Git-Notify                          | [Repository](https://github.com/DeadIndian/Git-Notify)                                                                                                                                                                                                     | Supplied research: Node.js/Express webhook bridge from GitHub and Gitea to Discord. Do not infer a running public endpoint or delivery guarantees.                                                                                                                                                                                                                                                                                                                   |
| AI Content Farm                     | [Repository](https://github.com/DeadIndian/AI-Content-Farm)                                                                                                                                                                                                | Resume-origin Go media pipeline with SQLite jobs, provider routing, FFmpeg and a local TTS sidecar. Keep it experimental; no verified content publication, audience or reliability metrics. Docker-socket access is privileged, not a security sandbox.                                                                                                                                                                                                              |
| Vijaya Store                        | [Repository](https://github.com/DeadIndian/EcommerceMobileApp)                                                                                                                                                                                             | Supplied research: Flutter customer/admin source and shared Dart code exist beside a Next.js API. The README's planned-Flutter wording is stale. Source existence and Razorpay dependencies do not verify shipped apps, functioning payments or a business rollout.                                                                                                                                                                                                  |
| Jarvis                              | [Repository](https://github.com/DeadIndian/Jarvis)                                                                                                                                                                                                         | Supplied research corrects the resume: the current public implementation is phone-first Kotlin/Compose with MediaPipe on-device inference and optional cloud/agent/MCP paths, not a required Python brain. Native VAD is unwired, wake-word support is absent and current app memory is RAM-only. v2 server-brain notes are planning, not shipped architecture. These are application limitations, not disclosures about the owner's personal memory infrastructure. |
| ArogyaKrishi                        | [Repository](https://github.com/DeadIndian/ArogyaKrishi)                                                                                                                                                                                                   | Supplied research: the active detect route returns random mocked predictions. Label it a prototype in both summary and status. Model files, dependencies or a README do not establish real inference, accuracy or safe crop-treatment advice.                                                                                                                                                                                                                        |
| Calico Kubernetes Observability Lab | [README](https://github.com/DeadIndian/calico-grafana/blob/main/README.md)                                                                                                                                                                                 | Supplied research: a local kind/Calico/Prometheus/Grafana lab. Do not turn it into a production deployment or benchmark. The public write-up is lab documentation.                                                                                                                                                                                                                                                                                                   |
| Petrol Pump Management System       | [Repository](https://github.com/DeadIndian/Petrol-pump-management-system)                                                                                                                                                                                  | Resume-origin family-business context and Next.js/Flutter/Prisma/Supabase implementation. Preserve the motivation without claiming daily business use, successful payments or audited accounting.                                                                                                                                                                                                                                                                    |
| Portfolio Website                   | [Earlier repository](https://github.com/DeadIndian/Portfolio-Site)                                                                                                                                                                                         | Supplied research corrects the original JSON: the old portfolio is React/Vite plus Node/Express, not Go/Next.js. This case refers to the earlier public repository, not the current rebuild. The JSON remains untouched.                                                                                                                                                                                                                                             |
| Tic-Tac-Toe                         | [Repository](https://github.com/DeadIndian/Tic-Tac-Toe)                                                                                                                                                                                                    | Owner-requested browser-game case and image. Keep it separate from the six explicitly identified Odin projects; no completion date, no-AI claim or verified live link is inferred.                                                                                                                                                                                                                                                                                   |

The Recurse event-utils material is documentation-only pre-alpha planning. It is
not included as an implemented or live project. Recurse-HQ is a separate case;
neither the club role nor its 3D source makes event-utils shipped software.

## Odin Attribution

The owner described the Odin Project work as built without AI. These six projects
were identified as Odin assignments by their repositories and READMEs. The claim
is not extrapolated to all repositories, Tic-Tac-Toe, kde-ship or this portfolio.
No completion dates or durations were supplied or invented.

| Project             | Canonical source                                  | Learning focus                      |
| ------------------- | ------------------------------------------------- | ----------------------------------- |
| Odin Recipes        | https://github.com/DeadIndian/odin-recipes        | HTML and semantics                  |
| Rock Paper Scissors | https://github.com/DeadIndian/rock-paper-scissors | Logic and DOM interaction           |
| Calculator          | https://github.com/DeadIndian/Calculator-Odin-    | Keyboard interaction and JavaScript |
| Sign-up Page        | https://github.com/DeadIndian/Sign-up-page        | Forms and CSS                       |
| Admin Dashboard     | https://github.com/DeadIndian/admin-dashboard     | CSS Grid                            |
| Library             | https://github.com/DeadIndian/Library-Odin        | Objects and state                   |

## Community Pull Requests

These are actual upstream contributions to **community projects in the KDE
ecosystem**, not claims of contributions to core KDE. The dates and states below
come from the supplied completed research; the array stores status, not dates.

| Pull request                                                                                  | State at snapshot  | Supplied date                                     | Description                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [WanderFox/TaskWidget #2](https://github.com/WanderFox/TaskWidget/pull/2)                     | Merged             | 12 August 2026, merged                            | Hide the widget and reveal it on hover.                                                          |
| [WanderFox/TaskWidget #3](https://github.com/WanderFox/TaskWidget/pull/3)                     | Open               | 19 September 2026, opened                         | Google Tasks support. Do not describe as accepted or released upstream.                          |
| [p-connor/plasma-drawer #92](https://github.com/p-connor/plasma-drawer/pull/92)               | Open               | 2 June 2026, opened                               | Drag-and-drop organization. Do not describe as merged.                                           |
| [herzane52/fastfetch-kde-splash #2](https://github.com/herzane52/fastfetch-kde-splash/pull/2) | Closed, not merged | 5 June 2026, research date associated with the PR | SequentialAnimation change. The supplied date is not repurposed as a merge or closure timestamp. |

## Public Writing

Only these three verified public writing sources are included:

| Title                                   | Source                                                                               | Display label         |
| --------------------------------------- | ------------------------------------------------------------------------------------ | --------------------- |
| Packet Tracer installation on Fedora 44 | https://gist.github.com/DeadIndian/ce9c7cda99793728adacaa0c385f840e                  | Gist                  |
| Calico and Grafana lab setup            | https://github.com/DeadIndian/calico-grafana/blob/main/README.md                     | Lab notes             |
| ADB plugin architecture                 | https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot/blob/main/ARCHITECTURE.md | Project documentation |

The owner chose to connect Medium later. No Medium feed, profile or article URL is
invented here, and GitHub documentation is not relabelled as Medium writing.
Another author's Titanic tutorial must not be republished or credited to the
owner.

## Profile And Privacy

The owner confirms the current role is **Club Head, Recurse**. This overrides
stale campaign notes and the `isCurrent: false` field in the original JSON. The
Recurse-HQ role reflects the confirmation; this module does not edit experience
data or fabricate a new term date.

Approved first-party environment context is limited to a Fedora 44 KDE laptop,
a Debian Dell OptiPlex home server, and self-hosting with Docker, Immich, n8n and
Tailscale. These are owner statements, not independently verified infrastructure
claims. No private addresses, public admin hosts, credentials or personal
memory-system internals are included.

Phone and date of birth from the input are deliberately not copied into either
the content module or this document. No separate email export is needed for the
requested contract.

Social links and Discord invite URLs were recovered from the previous portfolio. Spotify
and YouTube `handle` fields retain the supplied account/channel identifiers rather
than guessing vanity handles. The invites have no fabricated member counts, and
their inclusion is not a claim that they were tested during this delegation.

## Verification Boundary

Validation for this delegation checks the isolated TypeScript module, the exact
export and field shapes, entry counts, source coverage, the four featured cases,
specified image paths, permitted live link, PR states and privacy exclusions. It
also rechecks the original JSON checksum. No package, configuration, UI or asset
files are part of the edit scope, and no commits are made.

Static content validation is not a browser test or a fresh audit of every linked
project. Live deployments, pending PR acceptance, media assets and the main
application's rendering remain separate verification responsibilities.
