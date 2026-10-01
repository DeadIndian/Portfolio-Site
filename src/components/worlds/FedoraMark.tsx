"use client";

import { useEffect, useState } from "react";

/**
 * Fedora marks are trademarks of Red Hat, Inc. and the Fedora Project does not
 * publish the official vectors: they must be requested from
 * logo@fedoraproject.org. Drop the official file at `public/brands/fedora.svg`
 * and this component picks it up with no code change. Until then it renders a
 * neutral placeholder in the brand colours so nothing on screen pretends to be
 * the official mark.
 */
const OFFICIAL_SRC = "/brands/fedora.svg";

export function FedoraMark({
  className,
  title = "Fedora",
}: {
  className?: string;
  title?: string;
}) {
  const [official, setOfficial] = useState(false);

  useEffect(() => {
    let alive = true;
    const probe = new Image();
    probe.onload = () => alive && setOfficial(true);
    probe.onerror = () => alive && setOfficial(false);
    probe.src = OFFICIAL_SRC;
    return () => {
      alive = false;
    };
  }, []);

  if (official)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={OFFICIAL_SRC} alt={title} />
    );

  return (
    <span className={className} role="img" aria-label={title} data-placeholder>
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="23" fill="#294172" />
        <circle cx="24" cy="24" r="23" fill="none" stroke="#3c6eb4" strokeWidth="2" />
        <text
          x="24"
          y="32"
          textAnchor="middle"
          fontFamily="Manrope, system-ui, sans-serif"
          fontSize="19"
          fontWeight="800"
          fill="#e8eef7"
        >
          f
        </text>
      </svg>
    </span>
  );
}

/** Same mark as a Three.js texture source, for the desktop scene. */
export const FEDORA_TEXTURE_PATH = OFFICIAL_SRC;