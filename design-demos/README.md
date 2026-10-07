# DeadIndian — A universe in the making

A single, fully styled HTML / Three.js journey for visual review. This replaces
the previous Crossing, Constellation, and Archive demos at the owner's request
on 5 October 2026. Application integration follows the owner's visual approval.

Run from this worktree:

```sh
python3 -m http.server 3120 --bind 0.0.0.0 --directory design-demos
```

Open `http://localhost:3120/`. The preview needs no build, credentials, external
CDN, or API. Fonts, Three.js, and rendered fallback artwork are local.

## Journey

1. **Minecraft / the builder:** the satisfaction of building, farms, and useful systems.
2. **One Piece / the dreamer:** the ambition to become a good programmer, freedom, and loyalty.
3. **Iron Man / the inventor:** the JARVIS idea and the actual Android prototype.
4. **Linux / the tinkerer:** wiping Windows, experimenting, and settling on Fedora/KDE.
5. **Open source / the contributor:** shared tools, community, Recurse, and friends.
6. **Beyond / what's next:** an open ending with real GitHub, LinkedIn, and email links.

Scroll, choose a world, or use the next arrow. Start the farm, catch the wind,
disassemble the Iron Man suit, cycle the desktops, and light the connections. Drag a world
or use the rotation button; motion can be paused. The full story is available
in each chapter. Hash links and browser back/forward navigation work.

The Iron Man world starts with a complete red-and-gold suit. Its faceplate,
chest, shoulders, gauntlets, and leg armor separate into 28 independently moving
sections, exposing the mechanical frame. Select **Reassemble the suit** to bring
everything back. The camera fits both states; reduced motion changes the pose
immediately, and the static fallback has separate assembled and exploded images.

The chapter order is a narrative arrangement, without invented dates. The owner
supplied the Minecraft/building/farming and One Piece/programming connections in
the 5 October brief. Other accounts come from `docs/deadindian-direction.md` and
the established portfolio content. The origin of the handle remains undisclosed.

## Artwork and licenses

Five worlds are procedural original 3D illustrations. The Iron Man world uses
**Iron-Man Mark 85 | Rigged** by **9A Films / Nihar Arora**, under **CC BY 4.0**.
It replaces the rejected procedural suit. The owner's Mark 43 image informed
the requested realism; the actual imported model is Mark 85. The mesh was
simplified, divided into rigid armor sections, and given disassembly paths.
Source, license, and modification details are in
[the model credits](assets/iron-man/CREDITS.md) and the in-page credits.

The Minecraft and One Piece scenes are fan-art homages. These properties belong
to their respective owners; no endorsement is implied. The Linux screens
illustrate the owner's account and are not recovered captures. The supplied
Fedora logo is retained. The calculator image is an existing real artifact.

Three.js is MIT licensed (`vendor/THREE-LICENSE.txt`). Font licenses are included
under `assets/fonts/`. Transparent renders of the six worlds are fitted to the
same available space as the live scenes for the no-WebGL fallback.

## Review and maintenance

The completed checks and browser limitations are recorded in [REVIEW.md](REVIEW.md).
Browser checks use this repository's Playwright and axe dependencies. With the
preview server running and those dependencies installed, run from the worktree:

```sh
node design-demos/checks/browser.mjs check
node design-demos/checks/browser.mjs motion
node design-demos/checks/browser.mjs layout
node design-demos/checks/browser.mjs a11y
node design-demos/checks/browser.mjs firefox
node design-demos/checks/browser.mjs suit
```

Use `capture` for desktop/phone screenshots, or `webkit` / `engines` when the
corresponding browsers and native libraries are installed. `JOURNEY_BASE_URL`
can override the local preview address. The runner keeps screenshots, results,
and browser profiles under `.workshop/journey-review/` on persistent disk.

After changing the models, regenerate the transparent fallback artwork:

```sh
node design-demos/checks/browser.mjs objects
node design-demos/checks/assets.mjs posters
```

For an armor-only update, use `browser.mjs suit-objects` followed by
`assets.mjs suit-posters`. This regenerates both suit poses without replacing
the other worlds' artwork.

The object capture changes the renderer only in the review browser. The shipped
scene keeps its normal background, lighting, and star field.

Source lives in the persistent `/home/dead/work/portfolio-demos` worktree on
`deadindian/design/html-directions`. Review artifacts live under
`.workshop/journey-review/qa`.
There is no portfolio application integration or production deployment here.

## Rebuilding the suit asset

The shipped suit is local: a 2.7 MB GLB plus WebP texture maps (about 6.6 MB total).
The source rig is baked into its resting pose; the browser animates rigid panels.
The scene stays below 100,000 triangles with its original mechanical details.
The existing poster remains usable while the asset loads or if loading fails.

To repeat the conversion, save the credited source GLB to persistent disk and run:

```sh
node design-demos/checks/prepare-iron-man.mjs /absolute/path/to/source-ironman.glb
```

The script verifies the source SHA-256, uses the installed Three.js, sharp, and
meshoptimizer packages, and writes the runtime asset under `assets/iron-man/`.
Conversion reports go under `.workshop/journey-review/`. Regenerate the two suit
posters afterward using the commands above. The 187 MB source stays out of Git.
