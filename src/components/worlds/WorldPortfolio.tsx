"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { Atom, BracketsCurly, IconContext } from "@phosphor-icons/react";
import { Dialog } from "../Dialog";
import { Terminal } from "../Terminal";
import { Studio } from "./Studio";
import { Desktop, type DesktopApi } from "./Desktop";
import { PanelContents } from "./PanelContents";
import { Scene } from "./Scene";
import { panelNames, type PanelId, type PublicProfile } from "./types";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function Portfolio({ profile }: { profile: PublicProfile }) {
  const [world, setWorld] = useState<"studio" | "desktop">("desktop");
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [terminal, setTerminal] = useState(false);
  const [motion, setMotion] = useState(true);
  const [peek, setPeek] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [destination, setDestination] = useState<"studio" | "desktop">(
    "desktop",
  );
  const [exploded, setExploded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const animated = motion && !reduced;
  const transition = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const desktop = useRef<DesktopApi>(null);
  const scenePort = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const anchor = document.querySelector<HTMLElement>("[data-scene-anchor]");
    const port = scenePort.current;
    const root = port?.parentElement;
    if (!anchor || !port || !root) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const parent = root.getBoundingClientRect();
      Object.assign(port.style, {
        left: `${rect.left - parent.left}px`,
        top: `${rect.top - parent.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    observer.observe(root);
    update();
    return () => observer.disconnect();
  }, [world]);

  useEffect(() => {
    document.documentElement.dataset.world = world;
    document.documentElement.dataset.motion = animated ? "on" : "off";
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", world === "studio" ? "#edf0f2" : "#b7c5c1");
    return () => {
      delete document.documentElement.dataset.world;
      delete document.documentElement.dataset.motion;
    };
  }, [world, animated]);

  useEffect(() => {
    if (world !== "studio" || !animated) return;
    try {
      if (sessionStorage.getItem("world-glimpse")) return;
    } catch {
      /* A glimpse does not require storage. */
    }
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (!entry.isIntersecting) return;
        timer = setTimeout(() => {
          setPeek(true);
          observer.disconnect();
          try {
            sessionStorage.setItem("world-glimpse", "seen");
          } catch {
            /* Optional. */
          }
        }, 4200);
      },
      { threshold: 0.4 },
    );
    const gateway = document.querySelector(".alternate-process");
    if (gateway) observer.observe(gateway);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [world, animated]);
  useEffect(() => {
    if (!peek) return;
    const timer = setTimeout(() => setPeek(false), 1500);
    return () => clearTimeout(timer);
  }, [peek]);
  useEffect(
    () => () => {
      timeline.current?.kill();
      transitionTimers.current.forEach(clearTimeout);
    },
    [],
  );
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (transition.current?.style.visibility === "visible") return;
      if (
        (event.target as HTMLElement).closest(
          'input, textarea, select, [contenteditable="true"], dialog[open]',
        )
      )
        return;
      if (
        event.key === "/" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")
      ) {
        event.preventDefault();
        setTerminal(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  function changeWorld() {
    if (switching) return;
    const next = world === "studio" ? "desktop" : "studio";
    setDestination(next);
    try {
      sessionStorage.setItem("world-glimpse", "seen");
    } catch {
      /* Optional. */
    }
    setPanel(null);
    setTerminal(false);
    const swap = () => {
      setRotation(0);
      setWorld(next);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    if (!animated) {
      swap();
      return;
    }
    setSwitching(true);
    timeline.current?.kill();
    timeline.current = gsap
      .timeline()
      .set(transition.current, {
        visibility: "visible",
        opacity: 1,
        clipPath: "inset(100% 0% 0% 0%)",
      })
      .to(transition.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.58,
        ease: "power4.inOut",
      })
      .to(transition.current, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.62,
        ease: "power4.inOut",
        delay: 0.1,
      })
      .set(transition.current, { visibility: "hidden" });
    // Navigation must not depend on WebGL frame rate or GSAP's lag smoothing.
    transitionTimers.current.forEach(clearTimeout);
    transitionTimers.current = [
      setTimeout(swap, 580),
      setTimeout(() => {
        timeline.current?.kill();
        gsap.set(transition.current, { visibility: "hidden" });
        setSwitching(false);
      }, 1400),
    ];
  }

  function open(id: PanelId) {
    if (world === "desktop") desktop.current?.open(id);
    else setPanel(id);
  }
  function navigate(section: string) {
    const map: Record<string, PanelId> = {
      work: "projects",
      about: "about",
      linux: "linux",
      "open-source": "opensource",
      recurse: "opensource",
      "hall-of-fame": "handmade",
      writing: "writing",
      now: "signals",
      contact: "contact",
    };
    if (section === "home") {
      setPanel(null);
      window.scrollTo({ top: 0 });
      return;
    }
    if (map[section]) open(map[section]);
  }

  return (
    <IconContext.Provider value={{ weight: "light", "aria-hidden": true }}>
      <div
        className="world-root"
        data-world={world}
        data-motion={animated ? "on" : "off"}
      >
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div inert={switching}>
          {world === "studio" ? (
            <Studio
              profile={profile}
              onOpen={open}
              onSwitch={changeWorld}
              onTerminal={() => setTerminal(true)}
              motion={animated}
              motionLocked={reduced}
              onMotion={() => setMotion(!motion)}
              peek={peek && animated}
              switching={switching}
              exploded={exploded}
              onExplode={() => setExploded((value) => !value)}
              onRotate={(delta) => setRotation((value) => value + delta)}
            />
          ) : (
            <Desktop
              apiRef={desktop}
              profile={profile}
              onSwitch={changeWorld}
              onTerminal={() => setTerminal(true)}
              motion={animated}
              motionLocked={reduced}
              onMotion={() => setMotion(!motion)}
              switching={switching}
              onRotate={() => setRotation((value) => value + 0.45)}
            />
          )}
        </div>
        <div
          className="persistent-scene-port"
          ref={scenePort}
          inert={switching}
        >
          <Scene
            kind={world}
            exploded={exploded}
            rotation={rotation}
            motion={animated && !switching && !panel && !terminal}
            onInteract={() =>
              world === "studio"
                ? setExploded((value) => !value)
                : setTerminal(true)
            }
          />
        </div>
        <Dialog
          open={panel !== null}
          onClose={() => setPanel(null)}
          title={
            panel?.startsWith("project:")
              ? "Project dossier"
              : (panelNames[panel ?? ""] ?? "Portfolio")
          }
          titleId="world-panel-title"
          className="studio-dossier"
        >
          {panel && (
            <PanelContents
              key={panel}
              id={panel}
              profile={profile}
              onOpen={open}
            />
          )}
        </Dialog>
        <Terminal
          open={terminal}
          onClose={() => setTerminal(false)}
          mode={world === "studio" ? "dead" : "bharath"}
          onSwitch={changeWorld}
          onNavigate={navigate}
        />
        <div className="world-transition" ref={transition} aria-hidden="true">
          <div>
            {destination === "desktop" ? (
              <BracketsCurly size={64} weight="light" />
            ) : (
              <Atom size={64} weight="light" />
            )}
            <span>
              {destination === "desktop"
                ? "Different shell."
                : "Same engineer."}
            </span>
            <small>
              {destination === "desktop"
                ? "Entering Bharath's workspace"
                : "Returning to Dead Indian's studio"}
            </small>
          </div>
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {world === "studio"
            ? "Dead Indian. Engineering studio."
            : "Bharath. Open-source desktop."}
        </span>
      </div>
    </IconContext.Provider>
  );
}
