# Two People, One Engineer

Historical design: the subsequent persona swap and evolving workshop supersede
this visual direction. See [workshop-build.md](workshop-build.md) for the current
implementation and [deadindian-direction.md](deadindian-direction.md) for context.

The owner rejected the first editorial design. This specification supersedes its
visual direction, not its researched content or provider contracts.

## Guidance

- Anthropic's canonical frontend-design skill, retrieved directly from
  `anthropics/skills/skills/frontend-design/SKILL.md`.
- Leonxlnx's Taste and High-End Visual Design guidance for materiality and interaction.
- React Three Fiber / Drei and the public CloudAI-X Three.js skills for 3D mechanics.
- Use the brief and Anthropic's restraint over contradictory boilerplate rules:
  no gratuitous eyebrows, numbered sections, perpetual card animations or card kit.

## Bharath: Engineering Studio

- Porcelain `#edf0f2`, aluminum `#b9c0cc`, graphite `#19232c`, ink blue `#314fc4`.
- Manrope for substantial, left-aligned type. Quiet supporting copy, not serif slogans.
- A detailed circular Mark I arc reactor is the principal visual, inspired by Tony
  Stark's fictional arc reactor from Iron Man / Marvel. It replaces the earlier chip.
- Five layers start assembled: containment housing, copper induction coils,
  palladium core, optical shield, and locking bezel. Copper windings, reflective
  metal and an illuminated core provide the visual focus.
- This is a procedural fan-art study created for this portfolio, not an imported
  model or a Marvel-endorsed work.
- Drag to orbit. Clicking the reactor or the `Explode reactor` / `Assemble reactor`
  button toggles assembly, not project navigation. The button's `aria-pressed`
  matches `exploded`, initially `false`.
- Assembly and rotation controls work without depending on pointer input.
- The scene contract remains `exploded?: boolean`, `rotation`, `motion`, and
  `onInteract`. Desktop scene interaction still opens the terminal; switching
  worlds reuses the renderer.
- Open directory, project and experience dossiers preserve a quick recruiter path.

```text
  Bharath / Software engineer                Directory   Meet Dead Indian
  +---------------------------------------------------------------+
  | Clear, substantial type          Circular, five-layer          |
  | Actual role and context          Mark I arc reactor            |
  | Work / Resume                    [explode] [rotate]            |
  |                            alternate process briefly surfaces  |
  +---------------------------------------------------------------+
  Selected project index          Experience / public integrations
```

## Dead Indian: Personal Desktop

- A real KDE Flow wallpaper, by Sandra Smukaste, rather than a generic dark background.
- Sand-colored window chrome `#efe9df`, teal text `#183d40`, orange folders `#e7a34d`.
- Space Mono, file names, desktop icons, a taskbar and draggable application windows.
- A separate 3D CRT computer, physical keyboard, disks and original penguin sculpture.
- Projects are files; Linux is a system report; no-AI work is a trophy shelf;
  writing is a notebook; presence and music belong in their own applications.
- Windows open, close, minimize, restore and maximize. A flat mobile window layout
  retains the desktop identity without forcing overlapping content onto a phone.

## The Boundary

Switching personas changes the entire React layout and interaction model. It is
not a light/dark toggle. A single, restrained glimpse of the alternate desktop
appears in the studio; a dimensional transition then changes worlds on request.
Reduced motion removes the automatic reveal and transition, not the functionality.

## Review

The distinctive subject is Bharath's full-stack/infrastructure work and Dead
Indian's actual Linux ecosystem. The focal assets are a Mark I arc reactor and a
personal computer, not abstract blobs. The two compositions and navigation models
remain recognizably different even if every color is removed.
