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
- [ ] Five complete chapters and all object interactions.
- [ ] Browser/visual review, persistence, mobile, reduced motion, and fallback QA.
- [ ] Final documentation and verified remote checkpoint.

First chapter verification: six Chromium checks passed across desktop and mobile,
including mesh clicks, desktop-history changes, URL/back navigation, retained
desktop windows and renderer, and the readable WebGL fallback. Screenshots were
reviewed from `.workshop/qa/`. The legacy studio tests are being migrated as the
remaining workshop interactions replace the old studio interface.
