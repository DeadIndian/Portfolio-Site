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
      <h2>3D objects</h2>
      <p>
        The hardware assembly, circuit graphics, CRT, keyboard, disks and Fedora
        badge are procedural Three.js geometry and artwork authored for this
        portfolio.
      </p>
      <h2>Fedora marks</h2>
      <p>
        The Fedora name and marks are trademarks of Red Hat, Inc. and are used
        here only to label the desktop environment this world is depicting. The
        official vectors are not published by the Fedora Project, so the badge
        shipped in the 3D scene and in the interface is a procedurally drawn
        placeholder in the brand colours, not the official artwork.
      </p>
      <h2>Interface & type</h2>
      <p>
        Three.js, React Three Fiber, Drei, GSAP, Phosphor icons, and locally
        hosted Manrope and Space Mono. Public project imagery and the photograph
        of Bharath were recovered from his previous portfolio.
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
