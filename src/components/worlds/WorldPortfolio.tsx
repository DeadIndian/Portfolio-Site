"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { BracketsCurly, IconContext } from "@phosphor-icons/react";
import { journeyChapterFromHash, navigatePersona, subscribePersona, type JourneyChapter } from "@/lib/persona";
import { Terminal } from "../Terminal";
import { Journey } from "../journey/Journey";
import { Desktop, type DesktopApi } from "./Desktop";
import { Scene } from "./Scene";
import type { PanelId, PublicProfile } from "./types";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function Portfolio({ profile }: { profile: PublicProfile }) {
  const hash = useSyncExternalStore(subscribePersona, () => window.location.hash, () => "");
  const chapter = journeyChapterFromHash(hash);
  const world = chapter ? "journey" : "desktop";
  const [terminal, setTerminal] = useState(false);
  const [motion, setMotion] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [rotation, setRotation] = useState(0);
  const reduced = useSyncExternalStore(subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const animated = motion && !reduced;
  const desktop = useRef<DesktopApi>(null);
  const root = useRef<HTMLDivElement>(null);
  const scenePort = useRef<HTMLDivElement>(null);
  const transition = useRef<HTMLDivElement>(null);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastChapter = useRef<JourneyChapter>("blocks");
  const firstWorld = useRef(true);

  useLayoutEffect(() => {
    if (world !== "desktop") return;
    const anchor = root.current?.querySelector<HTMLElement>('[data-shell="desktop"] [data-scene-anchor]');
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
    observer.observe(anchor); observer.observe(root.current); update();
    return () => observer.disconnect();
  }, [world]);

  useLayoutEffect(() => {
    document.documentElement.dataset.world = world;
    document.documentElement.dataset.motion = animated ? "on" : "off";
    if (world === "desktop") {
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#1b1f26");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
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
    const frame = requestAnimationFrame(() => {
      root.current?.querySelector<HTMLElement>(world === "journey" ? "#journey-return" : ".desktop-logout")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [world, switching]);

  useEffect(() => {
    const unsubscribe = subscribePersona(() => setTerminal(false));
    const handle = (event: KeyboardEvent) => {
      if (journeyChapterFromHash(window.location.hash) || transition.current?.style.visibility === "visible") return;
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault(); setTerminal(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      unsubscribe(); window.removeEventListener("keydown", handle);
      transitionTimeline.current?.kill(); timers.current.forEach(clearTimeout);
    };
  }, []);

  function changeWorld() {
    if (switching) return;
    const destination = world === "desktop" ? `#${lastChapter.current}` : "#desktop";
    setTerminal(false);
    const swap = () => navigatePersona(destination);
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

  function navigate(section: string) {
    const panels: Record<string, PanelId> = {
      work: "projects", about: "about", linux: "linux", "open-source": "opensource",
      recurse: "opensource", "hall-of-fame": "handmade", writing: "writing", now: "signals", contact: "contact",
    };
    if (panels[section]) desktop.current?.open(panels[section]);
  }

  return <IconContext.Provider value={{ weight: "light", "aria-hidden": true }}>
    <div className="world-root" ref={root} data-world={world} data-motion={animated ? "on" : "off"}>
      <a className="skip-link" href="#main" hidden={world !== "desktop"} onClick={(event) => {
        event.preventDefault(); root.current?.querySelector<HTMLElement>("#main")?.focus();
      }}>Skip to content</a>
      <div className="world-shell" data-shell="desktop" hidden={world !== "desktop"} inert={switching || world !== "desktop"}>
        <Desktop apiRef={desktop} profile={profile} onSwitch={changeWorld} onTerminal={() => setTerminal(true)}
          motion={animated && world === "desktop"} motionLocked={reduced} onMotion={() => setMotion((value) => !value)}
          switching={switching} onRotate={() => setRotation((value) => value + .45)} />
      </div>
      <div className="persistent-scene-port" ref={scenePort} hidden={world !== "desktop"} inert={switching || world !== "desktop"}>
        <Scene kind="desktop" rotation={rotation} resetKey={0}
          motion={animated && world === "desktop" && !switching && !terminal}
          onInteract={() => setTerminal(true)} />
      </div>
      <Journey active={world === "journey"} switching={switching} motion={animated} motionLocked={reduced}
        onExit={changeWorld} onToggleMotion={() => setMotion((value) => !value)} />
      <Terminal open={terminal && world === "desktop"} onClose={() => setTerminal(false)} mode="bharath" onSwitch={changeWorld} onNavigate={navigate} />
      <div className="world-transition" ref={transition} aria-hidden="true"><div><BracketsCurly size={40} /><span>{world === "desktop" ? "After hours." : "Back to the desktop."}</span></div></div>
    </div>
  </IconContext.Provider>;
}
