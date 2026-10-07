# Integrated personal journey

The owner approved the rendered six-world HTML on 7 October 2026 and requested
that it replace DeadIndian's previous workshop in the actual website, while
Bharath keeps the computer desktop. Publication to `main` was explicitly requested.

## Behavior

The default route opens Bharath's existing dark Fedora/KDE desktop. Its
**DeadIndian** control opens the approved journey; **Bharath** in the journey
header returns. Both native component trees stay mounted after first use, so
windows, positions, sizes, minimization, maximization, content settings, and
journey actions survive a round trip. The implementation does not use an iframe.

The six chapter hashes are `#blocks`, `#voyage`, `#reactor`, `#linux`,
`#connections`, and `#beyond`; `#desktop` returns to Bharath. Old workshop links
map to the closest current story. A shared navigation event keeps History API
updates, browser Back/Forward, and the React persona state synchronized.

## Implementation

- The approved content, scene geometry, camera composition, materials, lighting,
  interactions, and local fallback posters were carried into the app. The
  header's return control is the intentional visual addition.
- `src/components/journey/Journey.tsx` hosts the authored DOM and lazy-loads a
  mountable controller. The controller scopes its queries to that root; the
  journey stylesheet scopes every visual rule to the journey or its active
  document state. Desktop appearance and application components are retained.
- Each mounted journey owns its resource caches and Three.js loading manager.
  Hidden personas stop rendering. Unmounting aborts listeners, cancels frames,
  restores scrolling, closes dialogs, and disposes graphics resources. Late
  model loading is guarded so it cannot revive an unmounted scene.
- Desktop and journey share the user's motion preference and respect system
  reduced motion. Modal focus and focus after persona switches are restored.
- Local assets live in `public/journey/assets/`. The Mark 85 model and both suit
  posters retain their CC BY 4.0 attribution. The added black support figure is
  absent. Public credits now describe the integrated artwork.

The standalone `design-demos/` directory remains a saved visual reference.
Future website edits should target the integrated source and public assets.
The prior workshop notes are historical, not the current implementation plan.

## Verification

Run the repository's lint, typecheck, unit tests, and production build. With the
production server running, run the desktop/mobile E2E projects. The journey
suite checks actual rendered worlds, switching and state retention, chapter
history, delayed suit loading, motion suspension, keyboard focus, and fallback.
The world suite checks the existing desktop and accessible content. Release
checks cover headers, metadata, local assets, both personas, and resume access.

Keep browser profiles, screenshots, reports, and temporary build artifacts in
the persistent `.workshop/` directory. Browser emulation is not a physical-device
frame-rate measurement. WebKit requires its system libraries to be installed.
