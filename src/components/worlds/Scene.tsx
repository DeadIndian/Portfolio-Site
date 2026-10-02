"use client";

import dynamic from "next/dynamic";

export const Scene = dynamic(() => import("./WorldScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading-placeholder">
      <span role="status">Preparing your space…</span>
    </div>
  ),
});
