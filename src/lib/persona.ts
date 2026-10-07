export const journeyChapters = ["blocks", "voyage", "reactor", "linux", "connections", "beyond"] as const;
export type JourneyChapter = (typeof journeyChapters)[number];

const previousChapters: Record<string, JourneyChapter> = {
  "#workshop": "blocks",
  "#workshop-learning": "blocks",
  "#workshop-linux": "linux",
  "#workshop-tools": "connections",
  "#workshop-people": "connections",
  "#workshop-future": "reactor",
  "#deadindian": "blocks",
  "#journey": "blocks",
};

export function journeyChapterFromHash(hash: string): JourneyChapter | null {
  return journeyChapters.find((chapter) => hash === `#${chapter}`) ?? previousChapters[hash] ?? null;
}

export function subscribePersona(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  window.addEventListener("portfolio:navigate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener("portfolio:navigate", callback);
  };
}

// History API writes do not emit hashchange. Both personas subscribe here so
// chapter navigation, the persona switch, and browser history share one URL.
export function navigatePersona(hash: string, replace = false) {
  if (window.location.hash === hash) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", hash);
  window.dispatchEvent(new Event("portfolio:navigate"));
}
