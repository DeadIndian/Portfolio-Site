"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowsOutSimple,
  Article,
  Envelope,
  Folder,
  GitBranch,
  LinuxLogo,
  Minus,
  Pause,
  Play,
  Power,
  Square,
  TerminalWindow,
  Trophy,
  User,
  Waveform,
  X,
} from "@phosphor-icons/react";
import { FedoraMark } from "./FedoraMark";
import { PanelContents } from "./PanelContents";
import { panelNames, type PanelId, type PublicProfile } from "./types";

type AppId = PanelId | "welcome";
type OpenWindow = {
  id: AppId;
  minimized: boolean;
  maximized: boolean;
  slot: number;
};
export interface DesktopApi {
  open: (id: PanelId) => void;
}

const apps = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "linux", label: "My Linux", icon: LinuxLogo },
  { id: "opensource", label: "Community", icon: GitBranch },
  { id: "handmade", label: "No-AI work", icon: Trophy },
  { id: "writing", label: "Writing", icon: Article },
  { id: "signals", label: "Now", icon: Waveform },
  { id: "about", label: "About", icon: User },
  { id: "contact", label: "Contact", icon: Envelope },
] as const;

function Clock() {
  const [time, setTime] = useState("Hyderabad");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    const timer = setInterval(update, 1000);
    const first = setTimeout(update, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, []);
  return (
    <time className="desktop-clock" aria-label={`Hyderabad time ${time}`}>
      {time}
      <small>IST</small>
    </time>
  );
}

function cssLimit(value: string) {
  return value === "none" ? Infinity : Number.parseFloat(value) || Infinity;
}

function DesktopWindow({
  entry,
  order,
  children,
  title,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
}: {
  entry: OpenWindow;
  order: number;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState([0, 0]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(
    null,
  );
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    width: number;
    height: number;
    nextX: number;
    nextY: number;
  } | null>(null);
  const resize = useRef<{
    edge: string;
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
  } | null>(null);
  useEffect(() => {
    const reset = () => setOffset([0, 0]);
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);
  useEffect(() => {
    if (!entry.minimized) ref.current?.focus({ preventScroll: true });
  }, [entry.minimized]);
  const move = (x: number, y: number) => {
    const state = drag.current;
    if (!state || !ref.current) return;
    state.nextX = Math.max(
      state.startX + 12 - state.left,
      Math.min(
        state.startX + innerWidth - state.left - state.width - 12,
        state.startX + x - state.x,
      ),
    );
    state.nextY = Math.max(
      state.startY + 54 - state.top,
      Math.min(
        state.startY + innerHeight - state.top - state.height - 110,
        state.startY + y - state.y,
      ),
    );
    ref.current.style.transform = `translate3d(${state.nextX}px, ${state.nextY}px, 0)`;
  };
  const startResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const edge = event.currentTarget.dataset.edge ?? "";
    const node = ref.current;
    if (!node || entry.maximized || innerWidth < 760 || event.button !== 0)
      return;
    const bounds = node.getBoundingClientRect();
    const shell = node.closest(".personal-desktop")?.getBoundingClientRect();
    const styles = getComputedStyle(node);
    resize.current = {
      edge,
      x: event.clientX,
      y: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      maxWidth: Math.min(
        (shell?.width ?? innerWidth) - 60,
        cssLimit(styles.maxWidth),
      ),
      maxHeight: Math.min(
        (shell?.height ?? innerHeight) - 150,
        cssLimit(styles.maxHeight),
      ),
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resizeTo = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const state = resize.current;
    if (!state) return;
    const growX = state.edge.includes("e")
      ? event.clientX - state.x
      : state.edge.includes("w")
        ? state.x - event.clientX
        : 0;
    const growY = state.edge.includes("s")
      ? event.clientY - state.y
      : state.edge.includes("n")
        ? state.y - event.clientY
        : 0;
    const w = Math.max(360, Math.min(state.maxWidth, state.width + growX));
    const h = Math.max(240, Math.min(state.maxHeight, state.height + growY));
    setSize({ w, h });
    if (state.edge.includes("n") || state.edge.includes("w"))
      setPlace({ left: state.left - growX, top: state.top - growY });
  };
  const endResize = () => {
    resize.current = null;
  };
  return (
    <section
      ref={ref}
      hidden={entry.minimized}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={`desktop-window ${entry.id === "welcome" ? "welcome-window" : ""} ${entry.maximized ? "is-maximized" : ""}`}
      data-window-id={entry.id}
      onFocusCapture={onFocus}
      onPointerDownCapture={onFocus}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          !(event.target as HTMLElement).closest("dialog[open]")
        ) {
          event.stopPropagation();
          onClose();
        }
      }}
      style={
        {
          "--slot": entry.slot % 4,
          // Above the dock (z-index 60) when maximized, so the dock drops
          // behind it; inline z-index would otherwise beat the stylesheet.
          zIndex: entry.maximized ? 62 : 10 + order,
          ...(!entry.maximized && size
            ? { width: size.w, height: size.h }
            : {}),
          ...(!entry.maximized && place
            ? { left: place.left, top: place.top }
            : {}),
          transform: entry.maximized
            ? "none"
            : `translate3d(${offset[0]}px,${offset[1]}px,0)`,
        } as CSSProperties
      }
    >
      <header
        className="desktop-window-title"
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) onMaximize();
        }}
        onPointerDown={(event) => {
          if (
            entry.maximized ||
            innerWidth < 760 ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest("button")
          )
            return;
          const bounds = ref.current!.getBoundingClientRect();
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            startX: offset[0],
            startY: offset[1],
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            nextX: offset[0],
            nextY: offset[1],
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => move(event.clientX, event.clientY)}
        onPointerUp={() => {
          if (drag.current) setOffset([drag.current.nextX, drag.current.nextY]);
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <span>
          <span className="window-small-icon">
            {entry.id === "welcome" ? <TerminalWindow /> : <Folder />}
          </span>
          {title}
        </span>
        <div>
          <button aria-label={`Minimize ${title}`} onClick={onMinimize}>
            <Minus />
          </button>
          <button
            aria-label={`${entry.maximized ? "Restore" : "Maximize"} ${title}`}
            onClick={onMaximize}
          >
            {entry.maximized ? <Square /> : <ArrowsOutSimple />}
          </button>
          <button aria-label={`Close ${title}`} onClick={onClose}>
            <X />
          </button>
        </div>
      </header>
      <div className="desktop-window-body">
        {entry.minimized ? null : children}
      </div>
      <footer className="window-statusbar">
        <span>
          {entry.id === "welcome"
            ? "Markdown document"
            : "Read-only portfolio content"}
        </span>
        <span>bharath@home</span>
      </footer>
      {!entry.maximized &&
        (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const).map((edge) => (
          <span
            key={edge}
            className="desktop-window-resize"
            data-edge={edge}
            aria-hidden="true"
            onPointerDown={startResize}
            onPointerMove={resizeTo}
            onPointerUp={endResize}
            onPointerCancel={endResize}
          />
        ))}
    </section>
  );
}

export function Desktop({
  profile,
  onSwitch,
  onTerminal,
  motion,
  motionLocked,
  onMotion,
  apiRef,
  switching,
  onRotate,
}: {
  profile: PublicProfile;
  onSwitch: () => void;
  onTerminal: () => void;
  motion: boolean;
  motionLocked: boolean;
  onMotion: () => void;
  apiRef: Ref<DesktopApi>;
  switching: boolean;
  onRotate: () => void;
}) {
  const [windows, setWindows] = useState<OpenWindow[]>([
    { id: "welcome", minimized: false, maximized: false, slot: 0 },
  ]);
  const [menu, setMenu] = useState(false);
  function open(id: AppId) {
    setMenu(false);
    setWindows((previous) => {
      const existing = previous.find((item) => item.id === id);
      return [
        ...previous.filter((item) => item.id !== id),
        existing
          ? { ...existing, minimized: false }
          : { id, minimized: false, maximized: false, slot: previous.length },
      ];
    });
  }
  useImperativeHandle(apiRef, () => ({ open }));
  function focus(id: AppId) {
    setWindows((previous) => {
      if (previous.at(-1)?.id === id) return previous;
      const current = previous.find((item) => item.id === id);
      return current
        ? [...previous.filter((item) => item.id !== id), current]
        : previous;
    });
  }
  function close(id: AppId) {
    setWindows((previous) => previous.filter((item) => item.id !== id));
  }
  const front = windows.filter((item) => !item.minimized).at(-1)?.id;
  const titleFor = (id: AppId) =>
    id === "welcome"
      ? "readme.md"
      : id.startsWith("project:")
        ? `${id.slice(8)} / case study`
        : panelNames[id];

  return (
    <main className="personal-desktop" id="main" tabIndex={-1}>
      <div className="desktop-wallpaper" />
      <header className="desktop-panel">
        <div>
          <button
            className="application-launcher"
            aria-label="Open applications"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <FedoraMark className="desktop-brand-mark" />
            <span>Applications</span>
          </button>
          <span className="desktop-session">
            bharath@fedora <span>/ personal space</span>
          </span>
        </div>
        <div className="desktop-tray">
          <button
            onClick={onMotion}
            disabled={motionLocked}
            aria-label={motionLocked ? 'Reduced motion enabled by system' : motion ? "Pause motion" : "Enable motion"}
          >
            {motion ? <Pause /> : <Play />}
          </button>
          <Clock />
          <button
            className="desktop-logout"
            onClick={onSwitch}
            disabled={switching}
          >
            <Power size={17} />
            <span>Meet DeadIndian</span>
          </button>
        </div>
      </header>
      {menu && (
        <nav className="application-menu" aria-label="Desktop applications">
          {apps.map((app) => (
            <button key={app.id} onClick={() => open(app.id)}>
              <app.icon weight="duotone" size={22} />
              {app.label}
              <ArrowUpRight size={15} />
            </button>
          ))}
          <button onClick={onTerminal}>
            <TerminalWindow size={22} />
            Terminal
            <ArrowUpRight size={15} />
          </button>
        </nav>
      )}
      <div className="desktop-shortcuts">
        {apps.slice(0, 5).map((app) => (
          <button
            key={app.id}
            className={`desktop-shortcut shortcut-${app.id}`}
            onClick={() => open(app.id)}
            aria-label={`Open ${app.label}`}
          >
            <span className="desktop-folder-icon">
              <app.icon weight="duotone" />
            </span>
            <span>{app.label}</span>
          </button>
        ))}
      </div>
      <div className="desktop-identity">
        <h1>
          Golla Bharath<span>_</span>
        </h1>
        <p>Open source. Open mind. My machine.</p>
      </div>
      <div className="desktop-computer" data-scene-anchor>
        <button
          className="computer-rotate"
          onClick={onRotate}
          aria-label="Rotate retro computer"
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="desktop-sticker" aria-hidden="true">
        Free as in
        <br />
        <b>freedom.</b>
      </div>
      {windows.map((entry, order) => (
        <DesktopWindow
          entry={entry}
          order={order}
          title={titleFor(entry.id)}
          key={entry.id}
          onFocus={() => focus(entry.id)}
          onClose={() => close(entry.id)}
          onMinimize={() =>
            setWindows((previous) =>
              previous.map((item) =>
                item.id === entry.id ? { ...item, minimized: true } : item,
              ),
            )
          }
          onMaximize={() =>
            setWindows((previous) =>
              previous.map((item) =>
                item.id === entry.id
                  ? { ...item, maximized: !item.maximized }
                  : item,
              ),
            )
          }
        >
          {entry.id === "welcome" ? (
            <article className="welcome-document">
              <div className="readme-path">/home/bharath/readme.md</div>
              <p className="welcome-comment"># hello, fellow human.</p>
              <h2>
                Make yourself
                <br />
                at home.
              </h2>
              <p>
                I'm Golla Bharath. I build for KDE Plasma, contribute to open
                source, and run the things I depend on. This is the side of me
                that can't leave a perfectly good desktop alone.
              </p>
              <p>Same person. A different workspace.</p>
              <div className="welcome-actions">
                <button onClick={() => open("projects")}>
                  Open my projects
                  <Folder weight="duotone" size={19} />
                </button>
                <button onClick={() => open("handmade")}>
                  The no-AI shelf
                  <Trophy size={19} />
                </button>
              </div>
              <small>Open an app below. Drag the windows. Stay a while.</small>
            </article>
          ) : (
            <PanelContents
              id={entry.id}
              profile={profile}
              world="desktop"
              onOpen={open}
            />
          )}
        </DesktopWindow>
      ))}
      <div className="desktop-bottom-note">
        <span>A portfolio disguised as a desktop.</span>
        <Link href="/credits">Wallpaper & asset credits</Link>
      </div>
      <nav className="desktop-dock" aria-label="Workspace dock">
        <button
          className="dock-home"
          onClick={() => open("welcome")}
          aria-label="Open welcome"
        >
          <FedoraMark className="desktop-brand-mark desktop-brand-mark-dock" />
        </button>
        <span className="dock-divider" />
        {apps.map((app) => (
          <button
            key={app.id}
            data-desktop-app={app.id}
            className={`dock-app dock-${app.id}`}
            aria-label={app.label}
            aria-pressed={front === app.id}
            onClick={() => {
              if (front === app.id)
                setWindows((previous) =>
                  previous.map((item) =>
                    item.id === app.id ? { ...item, minimized: true } : item,
                  ),
                );
              else open(app.id);
            }}
          >
            <span>
              <app.icon weight="duotone" />
            </span>
            <small>{app.label}</small>
            {windows.some((item) => item.id === app.id) && <i />}
          </button>
        ))}
        <span className="dock-divider" />
        <button
          className="dock-terminal"
          onClick={onTerminal}
          aria-label="Open terminal"
        >
          <TerminalWindow weight="duotone" />
          <small>Terminal</small>
        </button>
      </nav>
    </main>
  );
}
