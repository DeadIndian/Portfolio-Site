"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { BracketsCurly, IconContext } from "@phosphor-icons/react";
import { chapterFromHash, type ChapterId, type WorkshopAction } from "@/data/workshop";
import { Dialog } from "../Dialog";
import { Terminal } from "../Terminal";
import { Workshop } from "./Workshop";
import { Desktop, type DesktopApi } from "./Desktop";
import { PanelContents } from "./PanelContents";
import { Scene } from "./Scene";
import { panelNames, type PanelId, type PublicProfile } from "./types";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeLocation(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

export function Portfolio({ profile }: { profile: PublicProfile }) {
  const hash = useSyncExternalStore(subscribeLocation, () => window.location.hash, () => "");
  const chapter = chapterFromHash(hash);
  const world = chapter ? "workshop" : "desktop";
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [terminal, setTerminal] = useState(false);
  const [reader, setReader] = useState(false);
  const [motion, setMotion] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [era, setEra] = useState(2);
  const [chairPulled, setChairPulled] = useState(false);
  const [exploded, setExploded] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const animated = motion && !reduced;
  const desktop = useRef<DesktopApi>(null);
  const root = useRef<HTMLDivElement>(null);
  const scenePort = useRef<HTMLDivElement>(null);
  const transition = useRef<HTMLDivElement>(null);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastChapter = useRef<ChapterId>("learning");
  const firstWorld = useRef(true);

  useLayoutEffect(() => {
    const anchor = root.current?.querySelector<HTMLElement>(`.world-shell[data-shell="${world}"] [data-scene-anchor]`);
    const port = scenePort.current;
    if (!anchor || !port || !root.current) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const parent = root.current!.getBoundingClientRect();
      Object.assign(port.style, {
        left: `${rect.left - parent.left}px`, top: `${rect.top - parent.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(anchor); observer.observe(root.current);
    update();
    return () => observer.disconnect();
  }, [world, chapter]);

  useLayoutEffect(() => {
    document.documentElement.dataset.world = world;
    document.documentElement.dataset.motion = animated ? "on" : "off";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", world === "workshop" ? "#17201e" : "#1b1f26");
    return () => {
      delete document.documentElement.dataset.world;
      delete document.documentElement.dataset.motion;
    };
  }, [world, animated]);

  useEffect(() => {
    if (chapter) lastChapter.current = chapter;
  }, [chapter]);

  useEffect(() => {
    if (firstWorld.current) { firstWorld.current = false; return; }
    if (switching) return;
    // Wait for the destination shell to leave inert before restoring focus.
    const frame = requestAnimationFrame(() => {
      root.current?.querySelector<HTMLElement>(world === "workshop" ? ".workshop-back" : ".desktop-logout")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [world, switching]);

  useEffect(() => {
    const navigation = () => {
      setPanel(null); setTerminal(false); setReader(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", navigation);
    const handle = (event: KeyboardEvent) => {
      if (transition.current?.style.visibility === "visible") return;
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault(); setTerminal(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
      window.removeEventListener("hashchange", navigation);
      transitionTimeline.current?.kill(); timers.current.forEach(clearTimeout);
    };
  }, []);

  function changeWorld() {
    if (switching) return;
    const destination = world === "desktop" ? `#workshop-${lastChapter.current}` : "#desktop";
    setPanel(null); setTerminal(false); setReader(false);
    const swap = () => {
      setRotation(0); setResetKey((key) => key + 1);
      window.location.hash = destination;
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    if (!animated) { swap(); return; }
    setSwitching(true);
    transitionTimeline.current?.kill();
    transitionTimeline.current = gsap.timeline()
      .set(transition.current, { visibility: "visible", opacity: 0 })
      .to(transition.current, { opacity: 1, duration: .22 })
      .to(transition.current, { opacity: 0, duration: .35, delay: .08 })
      .set(transition.current, { visibility: "hidden" });
    timers.current.forEach(clearTimeout);
    timers.current = [setTimeout(swap, 220), setTimeout(() => {
      transitionTimeline.current?.kill();
      gsap.set(transition.current, { visibility: "hidden" }); setSwitching(false);
    }, 700)];
  }

  function open(id: PanelId) {
    if (world === "desktop") desktop.current?.open(id);
    else setPanel(id);
  }

  function action(value: WorkshopAction) {
    if (value === "screen") setEra((value) => (value + 1) % 3);
    else if (value === "chair") setChairPulled((value) => !value);
    else if (value === "reactor") setExploded((value) => !value);
    else open(value);
  }

  function navigate(section: string) {
    const map: Record<string, PanelId> = {
      work: "projects", about: "about", linux: "linux", "open-source": "opensource",
      recurse: "opensource", "hall-of-fame": "handmade", writing: "writing", now: "signals", contact: "contact",
    };
    if (section === "home") { setPanel(null); window.scrollTo({ top: 0 }); }
    else if (map[section]) open(map[section]);
  }

  return <IconContext.Provider value={{ weight: "light", "aria-hidden": true }}>
    <div className="world-root" ref={root} data-world={world} data-motion={animated ? "on" : "off"}>
      <a className="skip-link" href={world === "workshop" ? "#workshop-main" : "#main"} onClick={(event) => {
        event.preventDefault();
        root.current?.querySelector<HTMLElement>(world === "workshop" ? "#workshop-main" : "#main")?.focus();
      }}>Skip to content</a>
      <div className="world-shell" data-shell="desktop" hidden={world !== "desktop"} inert={switching || world !== "desktop"}>
        <Desktop apiRef={desktop} profile={profile} onSwitch={changeWorld} onTerminal={() => setTerminal(true)}
          motion={animated && world === "desktop"} motionLocked={reduced} onMotion={() => setMotion((value) => !value)}
          switching={switching} onRotate={() => setRotation((value) => value + .45)} />
      </div>
      {chapter && <div className="world-shell" data-shell="workshop" inert={switching}>
        <Workshop chapterId={chapter} era={era} chairPulled={chairPulled} exploded={exploded}
          motion={animated} motionLocked={reduced} reader={reader} onReader={setReader}
          onAction={action} onOpen={open} onSwitch={changeWorld} onTerminal={() => setTerminal(true)}
          onMotion={() => setMotion((value) => !value)} onRotate={(delta) => setRotation((value) => Math.max(-.65, Math.min(.65, value + delta)))}
          onReset={() => { setRotation(0); setResetKey((key) => key + 1); }} />
      </div>}
      <div className="persistent-scene-port" ref={scenePort} inert={switching}>
        <Scene kind={world} rotation={rotation} resetKey={resetKey}
          motion={animated && !switching && !panel && !terminal && !reader}
          onInteract={() => setTerminal(true)}
          workshop={{ chapter: chapter ?? "learning", era, chairPulled, exploded, onAction: action }} />
      </div>
      <Dialog open={panel !== null} onClose={() => setPanel(null)}
        title={panel?.startsWith("project:") ? "Project dossier" : (panelNames[panel ?? ""] ?? "Portfolio")}
        titleId="world-panel-title" className="studio-dossier">
        {panel && <PanelContents key={panel} id={panel} profile={profile} onOpen={open} />}
      </Dialog>
      <Terminal open={terminal} onClose={() => setTerminal(false)} mode={world === "workshop" ? "dead" : "bharath"} onSwitch={changeWorld} onNavigate={navigate} />
      <div className="world-transition" ref={transition} aria-hidden="true"><div><BracketsCurly size={40} /><span>{world === "desktop" ? "After hours." : "Back to the desktop."}</span></div></div>
    </div>
  </IconContext.Provider>;
}
