"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

export const Scene = dynamic(() => import("./WorldScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading-placeholder">
      <Image
        unoptimized
        src="/3d/studio-poster.webp"
        width={900}
        height={720}
        alt="Arc reactor with copper coils and an illuminated core"
        priority
      />
      <span>Preparing the interactive scene...</span>
    </div>
  ),
});
