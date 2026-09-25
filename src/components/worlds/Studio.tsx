"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Article,
  BracketsCurly,
  Cpu,
  Folder,
  GithubLogo,
  LinuxLogo,
  Pause,
  Play,
  Stack,
  TerminalWindow,
  Trophy,
  User,
  Waveform,
} from "@phosphor-icons/react";
import { projects } from "@/data/portfolio";
import type { PanelId, PublicProfile } from "./types";

const directory = [
  {
    id: "projects",
    title: "Projects",
    detail: "The complete directory",
    icon: Folder,
  },
  {
    id: "about",
    title: "Experience",
    detail: "The person & the practice",
    icon: User,
  },
  {
    id: "linux",
    title: "Linux & systems",
    detail: "Life below the surface",
    icon: LinuxLogo,
  },
  {
    id: "writing",
    title: "Writing",
    detail: "Notes from the process",
    icon: Article,
  },
  {
    id: "handmade",
    title: "Human-made",
    detail: "The no-AI collection",
    icon: Trophy,
  },
  {
    id: "signals",
    title: "Live signals",
    detail: "Code, music & presence",
    icon: Waveform,
  },
] as const;

export function Studio({
  profile,
  onOpen,
  onSwitch,
  onTerminal,
  motion,
  motionLocked,
  onMotion,
  peek,
  switching,
  exploded,
  onExplode,
  onRotate,
}: {
  profile: PublicProfile;
  onOpen: (id: PanelId) => void;
  onSwitch: () => void;
  onTerminal: () => void;
  motion: boolean;
  motionLocked: boolean;
  onMotion: () => void;
  peek: boolean;
  switching: boolean;
  exploded: boolean;
  onExplode: () => void;
  onRotate: (delta: number) => void;
}) {
  return (
    <main className="engineering-studio" id="main">
      <header className="studio-header">
        <a
          className="studio-wordmark"
          href="#studio-home"
          aria-label="Golla Bharath home"
        >
          <span className="studio-monogram">
            b<span>/</span>
          </span>
          <span>
            Golla Bharath<small>Software & infrastructure</small>
          </span>
        </a>
        <nav aria-label="Studio navigation">
          <a href="#selected-work">Selected work</a>
          <button onClick={() => onOpen("about")}>About me</button>
          <button onClick={() => onOpen("contact")}>Get in touch</button>
        </nav>
        <button
          className="switch-to-desktop"
          onClick={onSwitch}
          disabled={switching}
        >
          <TerminalWindow size={18} />
          <span>Meet Dead Indian</span>
          <ArrowUpRight size={17} />
        </button>
      </header>
      <section className="studio-hero" id="studio-home">
        <div className="studio-intro">
          <div className="studio-hello">
            <span className="hello-line" />A software engineer in Hyderabad.
          </div>
          <h1>
            From interface
            <br />
            to infrastructure.
          </h1>
          <p>
            I build across the stack, then keep it running.
            <br />
            Software, systems, and the decisions
            <br className="desktop-break" /> that connect them.
          </p>
          <div className="studio-actions">
            <a className="world-button" href="#selected-work">
              Explore my work
              <span>
                <ArrowDown size={18} />
              </span>
            </a>
            <Link className="studio-resume" href="/resume">
              The resume
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="studio-person">
            <Image
              src="/images/bharath.webp"
              alt="Golla Bharath"
              width={52}
              height={52}
            />
            <div>
              <span>
                Building at{" "}
                <button onClick={() => onOpen("about")}>CyberParadigm</button>
              </span>
              <small>Club Head, Recurse at KMIT</small>
            </div>
          </div>
        </div>
        <div className="studio-specimen" data-scene-anchor>
          <div className="specimen-orbit orbit-a" aria-hidden="true" />
          <div className="specimen-orbit orbit-b" aria-hidden="true" />
          <span className="specimen-caption">
            <Cpu size={14} />A system is more than the sum of its layers.
          </span>
          <div className="assembly-control">
            <span>Look under the surface</span>
            <div>
              <button
                aria-label="Rotate model left"
                onClick={() => onRotate(-0.45)}
              >
                <ArrowRight className="rotate-left" size={18} />
              </button>
              <button
                className="assembly-toggle"
                aria-pressed={exploded}
                onClick={onExplode}
              >
                <Stack size={18} />
                {exploded ? "Assemble" : "Explode the view"}
              </button>
              <button
                aria-label="Rotate model right"
                onClick={() => onRotate(0.45)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <small>Drag to orbit. Click the core to explore.</small>
          </div>
        </div>
        <button
          className={`alternate-process ${peek ? "is-peeking" : ""}`}
          onClick={onSwitch}
          disabled={switching}
        >
          <span className="process-symbol">
            <BracketsCurly size={23} />
          </span>
          <span>
            <small>Also running as</small>
            <strong>Dead Indian</strong>
          </span>
          <ArrowUpRight size={20} />
          <span className="process-reveal" aria-hidden="true">
            <span>dead@fedora:~$</span>
            <b>
              Free software.
              <br />A different state of mind.
            </b>
            <small>Enter the other side</small>
          </span>
        </button>
      </section>
      <section className="studio-directory" aria-label="Portfolio directory">
        {directory.map((item) => (
          <button key={item.id} onClick={() => onOpen(item.id)}>
            <item.icon size={23} weight="light" />
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
      </section>
      <section className="studio-work" id="selected-work">
        <div className="studio-work-heading">
          <span className="studio-section-kicker">Selected engineering</span>
          <h2>
            The interesting part
            <br />
            is under the hood.
          </h2>
          <p>
            A few builds that show how I think.
            <br />
            Open a project for the decisions, trade-offs, and source.
          </p>
          <button
            className="world-text-button"
            onClick={() => onOpen("projects")}
          >
            All {projects.length} projects
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="studio-project-index">
          {projects
            .filter((project) => project.featured)
            .map((project) => (
              <button
                className="studio-project-entry"
                key={project.id}
                onClick={() => onOpen(`project:${project.id}`)}
              >
                <div>
                  <span className="project-index-category">
                    {project.category}
                    {project.status === "Archived" ? " / Archived" : ""}
                  </span>
                  <h3>{project.title.replace(" (ADB)", "")}</h3>
                  <span className="project-index-stack">
                    {project.stack.slice(0, 4).join(" / ")}
                  </span>
                </div>
                <span
                  className={`project-index-art artifact-${project.id}`}
                  aria-hidden="true"
                >
                  {project.id === "adb" ? (
                    <BracketsCurly weight="light" />
                  ) : project.id === "transitops" ? (
                    <Stack weight="light" />
                  ) : project.id === "tailscale-widget" ? (
                    <LinuxLogo weight="duotone" />
                  ) : (
                    <Trophy weight="light" />
                  )}
                </span>
                <ArrowUpRight
                  className="project-index-arrow"
                  size={25}
                  weight="light"
                />
              </button>
            ))}
        </div>
      </section>
      <section className="studio-practice">
        <div>
          <span>In practice</span>
          <h2>
            I care what happens
            <br />
            after deploy.
          </h2>
          <p>
            At CyberParadigm, I work on Letushack's cyber-range infrastructure:
            isolated lab environments, CTFd plugins, deployments, and the
            full-stack software around them.
          </p>
          <button onClick={() => onOpen("about")} className="world-text-button">
            Experience & toolkit
            <ArrowUpRight />
          </button>
        </div>
        <div className="studio-community-note">
          <span className="community-orbit" aria-hidden="true">
            r/
          </span>
          <div>
            <span>Outside the day job</span>
            <h3>
              Building a community
              <br />
              that builds.
            </h3>
            <p>
              I lead Recurse, KMIT's technical club, and contribute to the KDE
              Plasma ecosystem.
            </p>
            <button
              onClick={() => onOpen("opensource")}
              className="world-text-button"
            >
              The open-source side
              <ArrowUpRight />
            </button>
          </div>
        </div>
      </section>
      <footer className="studio-footer">
        <a href={`mailto:${profile.email}`}>
          Let's talk.
          <ArrowUpRight />
        </a>
        <span>One engineer. More than one side.</span>
        <div>
          <button onClick={() => onOpen("contact")}>Contact & links</button>
          <button onClick={onMotion} aria-pressed={motion} disabled={motionLocked} title={motionLocked ? 'Reduced motion is enabled in your system preferences' : undefined}>
            {motion ? <Pause /> : <Play />}
            {motionLocked ? 'Reduced motion' : motion ? "Pause motion" : "Enable motion"}
          </button>
          <button onClick={onTerminal} aria-label="Open terminal">
            <TerminalWindow />
          </button>
          <a
            href="https://github.com/DeadIndian"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <GithubLogo />
          </a>
          <Link href="/credits">Credits</Link>
        </div>
      </footer>
    </main>
  );
}
