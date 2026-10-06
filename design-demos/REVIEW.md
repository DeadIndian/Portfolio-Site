# Journey demo review

## Detailed Iron Man suit — 6 October 2026

The owner rejected the procedural suit and supplied a Mark 43 reference. This
revision uses the detailed **Mark 85** model by **9A Films / Nihar Arora**, licensed
under **CC BY 4.0**, with the creator and license recorded inside the source GLB.
The exact suit variant differs from the reference; the imported model supplies
the fitted proportions, curved armor, modeled seams, and textured materials.
Full provenance and adaptation details are in `assets/iron-man/CREDITS.md`.

The 187 MB source was converted to a local GLB and WebP textures, about 6.6 MiB
in total. Connected armor surfaces form 28 moving sections. The faceplate,
helmet, chest, shoulders, arms, abdomen, hips, and leg armor follow separate
release paths. Original internal fittings support the exposed frame. The scene
uses 57 draw calls and 83,425 triangles; these are counts, not a device FPS claim.

Both assembled and separated poses have newly rendered transparent fallbacks.
The existing poster remains available while the model loads. Keyboard activation,
reassembly, mid-animation reversal, chapter state retention, paused interaction,
reduced motion, and interaction before the asset finishes loading are covered
by `node design-demos/checks/browser.mjs suit`. The checks also simulate a failed
model request and unavailable WebGL, retaining the posters and navigation.

Desktop (1440×1000), phone (390×844), short phone (320×568), and landscape
(844×390) framing was checked in both poses. Desktop and phone screenshots were
visually inspected. The complete suit suite and six-world interaction checks
passed, including keyboard focus, dialogs, map/history navigation, and static
fallback. Accessibility checks report zero violations across all six worlds and
both dialogs at desktop and phone widths. Authored scripts pass ESLint. The conversion script verifies the original file checksum
and reproduces the shipped model from the credited source. This revision is a
standalone visual preview; the professional application is unchanged.

## Original journey review — 5 October 2026

## Current checkpoint

The standalone six-world HTML journey is complete and ready for the owner's
visual feedback. It replaces the earlier Crossing, Constellation, and Archive
experiments. This is the HTML preview requested on 5 October; integration into
the Next.js portfolio follows an explicit visual choice or approval.

Source: `/home/dead/work/portfolio-demos/design-demos`, on
`deadindian/design/html-directions`. Start the preview from that worktree:

```sh
python3 -m http.server 3120 --bind 0.0.0.0 --directory design-demos
```

Open **http://localhost:3120/**. The page bundles its fonts, Three.js, illustrations,
and fallback artwork locally. No build, API, or credentials are needed to view it.

## What is ready

- Six original 3D worlds, with a continuous camera journey, themed typography,
  lighting, colors, and personal accounts.
- Minecraft farm, sailing world, separable Iron Man suit, switchable Linux desktops,
  community constellation, and a closing invitation to follow the journey.
- Scroll and Next navigation, direct chapter links, browser history, keyboard
  navigation, world map, story dialogs, rotation, and motion controls.
- Desktop, phone, tablet, and landscape framing. The static fallback uses
  transparent renders fitted to the same available space as the live scenes,
  preventing short-screen cropping and overlap with the story or navigation.
- Focus restoration, chapter announcements, a keyboard skip link, reduced
  motion, suspension behind dialogs and hidden tabs, and context-loss recovery.
- Portable browser review and asset-generation scripts under `checks/`.

The order tells a thematic story rather than assigning dates. The Minecraft
and One Piece connections came from the owner's 5 October brief. Other personal
claims follow the saved interview and portfolio records. JARVIS is described
as a prototype and an ambition. The handle's origin remains undisclosed.

## Validation

| Check | Result |
| --- | --- |
| All worlds, five actions, dialogs, focus, map, history, and keyboard controls | Passed at widths 1440, 390, 320, and 768 |
| Responsive layout | Passed at 320×568, 375×667, 844×390, 1024×768, 1366×768, and 1920×1080 |
| Motion, Next/restart, wheel scroll, deep links, reload, pause/resume, and graphics-context loss | Passed in Chromium |
| No-WebGL fallback | All six images and navigation passed at 390×844, 320×568, and 844×390 |
| WCAG 2.2 AA automated checks | Zero reported violations across all six worlds and both dialogs at desktop and phone widths |
| Firefox | Six worlds, dialogs, and distinct fallback images passed; this machine's headless Firefox does not expose WebGL 2 |
| WebKit | Unavailable: its installed browser cannot load `libenchant-2.so.2`; WebKit rendering remains unverified |
| Authored JavaScript | Syntax and ESLint checks passed without warnings |

Desktop and phone renders were inspected, including the open reactor, Linux
screen, short-phone scenes, landscape scene, and corrected fallback layouts.
Recorded live scenes use 29–93 draw calls and at most 65,988 triangles. These
counts are not a frame-rate benchmark on a physical phone.

JSON results and screenshots live under `.workshop/journey-review/qa/` in the
persistent worktree. Browser profiles also stay under `.workshop/`; the review
tools do not use `/tmp` or `/var/tmp` for project artifacts. The README documents
how to repeat checks and regenerate fallback artwork.

## Next step

Review the rendered journey and collect the owner's visual feedback. Preserve
the professional application and the saved personal accounts when implementing
any later approved integration. The earlier miniature workshop is a historical
application baseline, not the current proposed visual direction.
