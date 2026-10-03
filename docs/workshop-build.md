# Evolving Workshop: Implementation

## Direction

A late-night miniature workshop. Walnut, charcoal-green plaster, linen paper,
amber task lighting, and cool screen light. Real bevelled geometry, material
detail, and a continuous room give the personal story physical presence.

Purpose: let visitors understand the person behind DeadIndian through five short,
first-person chapters and explorable objects. The framing is an artistic memoir,
not a claim that this is an exact reconstruction of a real room.

Design feasibility judgement: impact 5 + fit 5 + feasibility 4 + performance 4
minus consistency risk 3 = 15. The main constraint is software-rendering cost;
repeat geometry is instanced and the renderer pauses when hidden.

Typography: locally bundled Manrope for expressive headings and readable prose;
Space Mono for chapter labels, object annotations, and controls. Main colours:
charcoal `#17201e`, linen `#eee9dc`, muted sage `#a4b0a8`, amber `#e8ae78`.

## Structure

- One persistent WebGL renderer shared with Bharath's existing desktop.
- The desktop stays mounted while hidden so its windows retain state.
- Hash-addressable chapters; the URL determines both the story and scene.
- Native links and back/forward navigation. No scroll locking for the story.
- The 3D room is accompanied by readable DOM text and ordinary control buttons.
- Real project artifacts link into the existing dossier and portfolio content.
- Desktop-history screen artwork is clearly an illustration of the account,
  not a recovered screenshot or live terminal.

## Chapter Objects

| Chapter | Scene focus | Interaction |
| --- | --- | --- |
| Getting better | Handmade disks, books, learning desk | Open the six Odin builds |
| Making it mine | Workstation and adjustable task lamp | Cycle Kubuntu, Arch/Hyprland, Fedora/KDE |
| Giving back | Desktop tools and a small home server | Inspect the Tailscale project and community patches |
| My people | Guest chair, Recurse note, shared space | Pull up a chair; read about the community |
| The long game | JARVIS notebook and arc-reactor study | Explode/reassemble the reactor; inspect the real prototype |

## Persistence

Worktree: `/home/dead/work/deadindian-workshop`.
Branch: `deadindian/feat/evolving-workshop`.
Preview port: 3110. Browser test port: 3111.

Source, assets, and design notes are tracked. Disposable browser profiles, logs,
screenshots, and QA scripts run under the persistent `.workshop/` directory.
Set `TMPDIR="$PWD/.workshop/tmp"` for development and checks. No project work is
stored under `/tmp`. Push each verified milestone and check the remote commit.

## Milestones

- [x] Integrate the saved desktop, reactor, QA, and plan branches; build and push.
- [x] Working Linux chapter, original 3D room, direct chapter URL, and controls.
- [x] Five complete chapters and all object interactions.
- [x] Browser/visual review, persistence, mobile, reduced motion, and fallback QA.
- [x] Final documentation and verified remote checkpoint.

First chapter verification: six Chromium checks passed across desktop and mobile,
including mesh clicks, desktop-history changes, URL/back navigation, retained
desktop windows and renderer, and the readable WebGL fallback. Screenshots were
reviewed from `.workshop/qa/`. At that checkpoint the remaining chapter objects
and migration of the legacy studio tests were still pending.

The complete chapter interaction checks now pass on desktop and mobile. The
regression suite was migrated to the professional desktop and workshop, preserving
coverage for projects, writing, feeds, contact, the terminal, and accessibility.

## QA Findings And Fixes

- Persona focus was scheduled before the destination left `inert`. Restore it
  after the transition ends, using the next animation frame.
- The inherited desktop's west/north resize placement counted drag offsets twice.
  Use coordinates relative to the shell and actual clamped size deltas; reset
  geometry on viewport changes.
- Inactive chapter numbers needed full-opacity muted text to meet contrast.
- After a workshop round trip, Next.js soft navigation to the printable resume
  could stall despite a successful RSC response. Resume links now use native
  document navigation; the reproduced release journey passes.
- Remove the background probe for absent Fedora artwork, which caused a 404 on
  every session. The existing local identity badge still renders.
- SwiftShader full-page screenshots can truncate the WebGL layer on this host.
  Viewport and canvas captures show the actual live scene correctly; use those
  for visual review, and check lower-page content in a separate viewport capture.

For this Debian host, WebKit's bundled launcher overrides `LD_LIBRARY_PATH`.
The missing Enchant, Manette and HIDAPI packages were downloaded from the system
APT repository and extracted under `.workshop/system-deps/root`. Test runs use
`LD_PRELOAD` with their absolute library paths. The normal portable setup remains
`npx playwright install-deps`; no system package changes are required by the app.

## Final Verification — 3 October 2026

The complete implementation is saved in `10307c2`. Its production browser run
passed all 47 tests across desktop/mobile Chromium, Firefox, and desktop/mobile
WebKit, with no failures, retries, or skipped tests. Type checking, lint, all
96 unit tests, and the production build passed before the final handoff.

The continuation checked the saved HTML report, reviewed the final 320/768/1440px
viewport captures and narrow-screen footers, and rechecked the live providers.
All five providers returned healthy data; Medium remains intentionally
unconfigured. These finishing changes update documentation only.

See [release-qa.md](release-qa.md) for test counts, visual evidence, browser
limitations, and deployment verification commands. Local preview:
`http://localhost:3110/#workshop-learning`. The source and review artifacts remain
in the persistent worktree; the final documentation checkpoint is saved to the
same feature branch.
