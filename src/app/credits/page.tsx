import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asset Credits - Bharath / Dead Indian",
  alternates: { canonical: "/credits" },
};

export default function Credits() {
  return (
    <main className="credits-page">
      <Link href="/">Back to the portfolio</Link>
      <h1>Built on shared work.</h1>
      <h2>KDE Flow wallpaper</h2>
      <p>
        <a href="https://github.com/KDE/plasma-workspace-wallpapers/tree/master/Flow">
          Flow by Sandra Smukaste
        </a>
        , from KDE's Plasma wallpaper collection. Licensed under{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">
          Creative Commons Attribution-ShareAlike 4.0
        </a>
        .
      </p>
      <p>
        The desktop and mobile images were resized and converted to WebP for
        this portfolio. These image derivatives remain under CC BY-SA 4.0:{" "}
        <a href="/3d/kde-flow.webp">desktop image</a> and{" "}
        <a href="/3d/kde-flow-mobile.webp">mobile image</a>. KDE and the artist
        do not endorse this portfolio.
      </p>
      <h2>Studio lighting</h2>
      <p>
        <a href="https://polyhaven.com/a/studio_small_09">Studio Small 09</a>{" "}
        from Poly Haven, used as a 1K HDR environment for the 3D materials. Poly
        Haven's assets are{" "}
        <a href="https://polyhaven.com/license">CC0 / public domain</a>.
      </p>
      <h2>Iron Man armor</h2>
      <p>
        <a href="https://sketchfab.com/3d-models/iron-man-mark-85-rigged-dde1085c464d4f8da259fe6669ae4dd2">Iron-Man Mark 85 | Rigged</a>{" "}
        by <a href="https://sketchfab.com/Nihar-9Afilms">9A Films / Nihar Arora</a>,
        licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
        The model was optimized, divided into 28 armor sections, and given a
        disassembly animation. Both static suit previews are renders of this
        adaptation. The original authors do not endorse this portfolio.
      </p>
      <p>
        <a href="/journey/assets/iron-man/CREDITS.md">Full model provenance, license, and adaptation details</a>.
      </p>
      <h2>3D worlds and objects</h2>
      <p>
        The CRT, keyboard, disks and Fedora badge are procedural Three.js
        geometry and artwork authored for this portfolio. The Minecraft farm,
        sailing world, Linux workstation, community constellation, and closing
        world are original procedural illustrations.
      </p>
      <p>
        Minecraft, One Piece, and Iron Man belong to their respective owners.
        These fan-art homages are not affiliated with or endorsed by them.
      </p>
      <h2>Fedora marks</h2>
      <p>
        Fedora is a trademark of Red Hat, Inc. The desktop uses a small
        brand-coloured placeholder to identify Fedora; the journey uses the
        Fedora logo supplied by the owner. Neither implies endorsement.
      </p>
      <h2>Personal accounts and imagery</h2>
      <p>
        The Kubuntu, Arch/Hyprland and Fedora/KDE screens are original desktop
        studies. They are illustrations, not archived screenshots or live sessions.
        The calculator screenshot and photograph of Bharath are from his previous
        portfolio. The personal story follows his own interview answers.
      </p>
      <h2>Interface & type</h2>
      <p>
        Three.js, React Three Fiber, Drei, GSAP, Phosphor icons, and locally
        hosted Manrope and Space Mono. The journey also uses Silkscreen,
        Instrument Serif, Bebas Neue, and Space Grotesk. Font licenses are bundled
        under <a href="/journey/assets/fonts/SILKSCREEN-LICENSE.txt">the journey's font assets</a>.
        Public project imagery and the photograph of Bharath were recovered from
        his previous portfolio.
      </p>
      <h2>Content</h2>
      <p>
        Project descriptions were checked against the provided resume and public
        repositories. The no-AI claim applies only to the identified Odin
        Project collection, not to these assets or this portfolio.
      </p>
    </main>
  );
}
