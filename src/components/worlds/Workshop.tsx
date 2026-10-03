"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Pause, Play, RotateCcw, Terminal } from "lucide-react";
import { Dialog } from "../Dialog";
import { desktopMemories, workshopChapters, type ChapterId, type WorkshopAction } from "@/data/workshop";
import type { PanelId } from "./types";

export function Workshop({
  chapterId, era, chairPulled, exploded, motion, motionLocked,
  onAction, onOpen, onSwitch, onTerminal, onMotion, onRotate, onReset, reader, onReader,
}: {
  chapterId: ChapterId;
  era: number;
  chairPulled: boolean;
  exploded: boolean;
  motion: boolean;
  motionLocked: boolean;
  onAction: (action: WorkshopAction) => void;
  onOpen: (id: PanelId) => void;
  onSwitch: () => void;
  onTerminal: () => void;
  onMotion: () => void;
  onRotate: (delta: number) => void;
  onReset: () => void;
  reader: boolean;
  onReader: (open: boolean) => void;
}) {
  const index = workshopChapters.findIndex((chapter) => chapter.id === chapterId);
  const chapter = workshopChapters[index];
  const memory = desktopMemories[era];
  const actionLabel = chapterId === "people" && chairPulled
    ? "A seat saved. Push it back?"
    : chapterId === "future" && exploded ? "Reassemble the reactor" : chapter.actionLabel;

  return (
    <main className="workshop-shell" id="workshop-main" tabIndex={-1}>
      <header className="workshop-header">
        <a className="workshop-wordmark" href="#workshop-learning" aria-label="DeadIndian workshop home" onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}>
          <span className="workshop-monogram" aria-hidden="true">d<span>/</span></span>
          <span>DeadIndian<small>A PERSONAL WORKSHOP</small></span>
        </a>
        <div className="workshop-header-actions">
          <button className="workshop-reader-button" onClick={() => onReader(true)}><BookOpen size={16} /> Read the story</button>
          <button className="workshop-icon" onClick={onMotion} disabled={motionLocked}
            aria-label={motionLocked ? "Reduced motion enabled by system" : motion ? "Pause motion" : "Enable motion"}>
            {motion ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="workshop-icon workshop-terminal-button" onClick={onTerminal} aria-label="Open terminal"><Terminal size={17} /></button>
          <button className="workshop-back" onClick={onSwitch}><ArrowUpRight size={16} /><span>Bharath's desktop</span></button>
        </div>
      </header>

      <div className="workshop-layout">
        <section className="workshop-copy" aria-labelledby="workshop-title">
          <hgroup className="workshop-heading" key={`${chapterId}-heading`}>
            <p className="workshop-chapter-kicker"><span>{String(index + 1).padStart(2, "0")} / 05</span><span>{chapter.label}</span></p>
            <h1 id="workshop-title">{chapter.title[0]}{" "}<br /><span>{chapter.title[1]}</span></h1>
            <p className="workshop-introduction">{chapter.introduction}</p>
          </hgroup>
          <div className="workshop-prose" key={`${chapterId}-prose`}>
            {chapter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="workshop-margin"><span aria-hidden="true">↳</span>{chapter.margin}</p>
          </div>
          <div className="workshop-interaction">
            <button className="workshop-action" onClick={() => onAction(chapter.action)}
              aria-pressed={chapterId === "people" ? chairPulled : chapterId === "future" ? exploded : undefined}>
              {actionLabel}<ArrowRight size={17} />
            </button>
            <button className="workshop-source" onClick={() => onOpen(chapter.panel)}>{chapter.panelLabel}<ArrowUpRight size={14} /></button>
            {chapterId === "tools" && <div className="workshop-tool-links" aria-label="More desktop tools">
              <button onClick={() => onOpen("project:sticky-notes")}>Sticky Notes <ArrowUpRight size={12} /></button>
              <button onClick={() => onOpen("project:wallpaper-carousel")}>Wallpaper Carousel <ArrowUpRight size={12} /></button>
            </div>}
          </div>
        </section>

        <figure className="workshop-view" aria-label="An illustrated personal space, built in 3D">
          <div className="workshop-scene-anchor" data-scene-anchor />
          <div className="workshop-scene-corner" aria-hidden="true"><span />WORKSHOP / {String(index + 1).padStart(2, "0")}</div>
          <figcaption className="workshop-object-caption" aria-live="polite"><span className="workshop-object-dot" />{chapterId === "people" && chairPulled ? "A seat saved for you." : chapter.object}</figcaption>
          <div className="workshop-view-controls" aria-label="Workshop view controls">
            <span>Explore the room</span>
            <button className="workshop-icon" onClick={() => onRotate(-0.22)} aria-label="Rotate workshop left"><ArrowLeft size={15} /></button>
            <button className="workshop-icon" onClick={onReset} aria-label="Reset workshop view"><RotateCcw size={15} /></button>
            <button className="workshop-icon" onClick={() => onRotate(0.22)} aria-label="Rotate workshop right"><ArrowRight size={15} /></button>
            <small>Drag to look around</small>
          </div>
          {chapterId === "linux" && <div className="workshop-desktop-memory" aria-live="polite">
            <span>DESKTOP STUDY</span><strong>{memory.name}</strong><small>{memory.note}</small>
            <div aria-hidden="true">{desktopMemories.map((item, i) => <i key={item.asset} className={i === era ? "is-current" : ""} />)}</div>
          </div>}
        </figure>
      </div>

      <nav className="workshop-chapters" aria-label="Story chapters">
        {workshopChapters.map((item, i) => <a key={item.id} href={`#workshop-${item.id}`} onClick={() => window.scrollTo({ top: 0, behavior: "instant" })} aria-current={item.id === chapterId ? "step" : undefined}>
          <span className="chapter-number">{String(i + 1).padStart(2, "0")}</span><span>{item.label}</span><ArrowUpRight size={14} />
        </a>)}
      </nav>
      <footer className="workshop-footer">
        <span>HYDERABAD, INDIA <span aria-hidden="true">·</span> STILL BUILDING</span>
        <div><button onClick={() => onReader(true)}>Full story</button><button onClick={() => onOpen("projects")}>Project files</button><button onClick={() => onOpen("contact")}>Say hello</button><Link href="/credits">Credits</Link><a href="https://github.com/DeadIndian" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12} /></a></div>
      </footer>
      <span className="sr-only" role="status">Chapter {index + 1} of 5. {chapter.label}.</span>

      <Dialog open={reader} onClose={() => onReader(false)} title="The person behind DeadIndian" titleId="workshop-reader-title" className="workshop-reader">
        <article className="workshop-reader-content">
          <p className="workshop-reader-intro">Still becoming.</p>
          {workshopChapters.map((item, i) => <section key={item.id}>
            <span className="workshop-chapter-kicker">{String(i + 1).padStart(2, "0")} / {item.label}</span>
            <h2>{item.title.join(" ")}</h2><p><strong>{item.introduction}</strong></p>
            {item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>)}
          <p className="workshop-margin">The name's origin stays a mystery. Everything here is still a work in progress.</p>
        </article>
      </Dialog>
    </main>
  );
}
