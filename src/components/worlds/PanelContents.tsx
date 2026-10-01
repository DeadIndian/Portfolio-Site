"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  FileCode,
  GitPullRequest,
  GraduationCap,
  LinuxLogo,
  Trophy,
} from "@phosphor-icons/react";
import {
  communities,
  contributions,
  odinProjects,
  projects,
  socials,
} from "@/data/portfolio";
import { LiveSignals } from "../LiveSignals";
import { ProjectExplorer } from "../ProjectExplorer";
import { Writing } from "../Writing";
import type { PanelId, PublicProfile } from "./types";

function Contact({ profile }: { profile: PublicProfile }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="contact-file">
      <p>
        For a role, a project, an interesting problem, or a good conversation.
      </p>
      <h2>
        Let's make something
        <br />
        worth maintaining.
      </h2>
      <a className="contact-address" href={`mailto:${profile.email}`}>
        {profile.email}
        <ArrowUpRight />
      </a>
      <button
        className="world-button secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(profile.email);
            setCopied(true);
            setError(false);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? "Email copied" : "Copy email"}
      </button>
      <span role="status">
        {error
          ? "Clipboard is unavailable. Select the email address to copy it."
          : ""}
      </span>
      <div className="contact-networks">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noreferrer"
          >
            {social.name}
            <ArrowUpRight size={17} />
          </a>
        ))}
      </div>
      <Link className="world-button secondary" href="/resume">
        Read / download my resume
        <ArrowUpRight />
      </Link>
    </div>
  );
}

export function PanelContents({
  id,
  profile,
  world = "studio",
  onOpen,
}: {
  id: PanelId;
  profile: PublicProfile;
  world?: "studio" | "desktop";
  onOpen: (id: PanelId) => void;
}) {
  if (id.startsWith("project:")) {
    const project = projects.find((item) => item.id === id.slice(8));
    if (!project)
      return <p>Project not found. Open the project directory instead.</p>;
    return (
      <article className="case-file">
        <div className="case-file-meta">
          <span>{project.category}</span>
          <span>{project.status}</span>
        </div>
        <h2>{project.title}</h2>
        <p className="case-intro">{project.summary}</p>
        <div className="case-facts">
          <div>
            <span>My role</span>
            <strong>{project.role}</strong>
          </div>
          <div>
            <span>Built with</span>
            <p>{project.stack.join(" / ")}</p>
          </div>
        </div>
        {project.image && (
          <figure>
            <Image
              src={project.image}
              alt={`${project.title}, original project screenshot`}
              width={1200}
              height={700}
              sizes="(max-width: 768px) 90vw, 800px"
            />
            <figcaption>From the original project</figcaption>
          </figure>
        )}
        <h3>The problem</h3>
        <p>{project.challenge}</p>
        <h3>The engineering</h3>
        <ul>
          {project.approach.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <h3>The result</h3>
        <p>{project.outcome}</p>
        {project.note && (
          <aside>
            <strong>Project context</strong>
            <p>{project.note}</p>
          </aside>
        )}
        <div className="case-actions">
          <a
            className="world-button"
            href={project.repo}
            target="_blank"
            rel="noreferrer"
          >
            Read the source
            <ArrowUpRight />
          </a>
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer"
              className="world-button secondary"
            >
              Visit project
              <ArrowUpRight />
            </a>
          )}
        </div>
      </article>
    );
  }

  if (id === "projects")
    return world === "studio" ? (
      <div className="directory-content">
        <h2>The project directory.</h2>
        <p>
          Twenty builds across software, infrastructure, desktop tooling, and
          experiments. Open one to go under the hood.
        </p>
        <ProjectExplorer />
      </div>
    ) : (
      <div className="file-browser">
        <div className="file-browser-path">
          /home/bharath/projects <span>{projects.length} items</span>
        </div>
        <div className="file-columns">
          <span>Name</span>
          <span>Kind</span>
          <span />
        </div>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onOpen(`project:${project.id}`)}
            className="project-file"
          >
            <FileCode size={25} weight="duotone" />
            <span>
              <strong>{project.title}</strong>
              <small>{project.status}</small>
            </span>
            <span className="file-kind">{project.category}</span>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </div>
    );

  if (id === "about")
    return (
      <article className="profile-file">
        <div className="profile-file-heading">
          <Image
            src="/images/bharath.webp"
            alt="Bharath at his laptop"
            width={160}
            height={160}
          />
          <div>
            <span>Golla Bharath</span>
            <h2>
              Software engineer.
              <br />
              Systems person.
            </h2>
            <p>Hyderabad, India</p>
          </div>
        </div>
        <p className="case-intro">
          I want to understand the whole system: the interface, the service
          behind it, and the machine keeping it alive.
        </p>
        <p>
          I'm a Computer Science undergraduate at KMIT. My work spans full-stack
          development, infrastructure, DevOps and cybersecurity. I lead Recurse,
          contribute to the KDE Plasma community, and keep a Debian home server
          running.
        </p>
        <section>
          <h3>CyberParadigm</h3>
          <div className="profile-role">
            <strong>Software / Infrastructure Intern</strong>
            <span>Sep 2025 - Present</span>
          </div>
          <p>
            Building the software and infrastructure behind Letushack, a
            cyber-range platform for hands-on cybersecurity labs.
          </p>
          <ul>
            {profile.experienceBullets.slice(2).map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Club Head, Recurse</h3>
          <div className="profile-role">
            <strong>KMIT's technical community</strong>
            <span>Aug 2026 - Present</span>
          </div>
          <p>
            Leading workshops, hackathons and peer learning. Helping juniors
            build real projects and find their way into open source.
          </p>
          <button
            onClick={() => onOpen("opensource")}
            className="world-text-button"
          >
            The community work
            <ArrowUpRight />
          </button>
        </section>
        <section>
          <h3>Former Lead Maintainer, Gamify</h3>
          <p>
            From July 2025. Code review and contributor coordination for a
            community-built gamification platform. The repository is now
            archived.
          </p>
        </section>
        <section className="degree-row">
          <GraduationCap size={32} />
          <div>
            <h3>B.Tech, Computer Science</h3>
            <p>KMIT, Hyderabad / 2024 - 2028 / CGPA 8.0</p>
          </div>
        </section>
        <section>
          <h3>The toolkit</h3>
          <div className="skill-file">
            {Object.entries(profile.skillsDisplay).map(([name, skills]) => (
              <div key={name}>
                <strong>{name}</strong>
                <p>{skills.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Formal learning</h3>
          <div className="certificate-files">
            {profile.certificates.map((item) => (
              <div key={item.name}>
                <strong>{item.name}</strong>
                <span>
                  {item.issuer} / {item.date}
                </span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Credential lookup
                    <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
        <Link href="/resume" className="world-button">
          The full resume
          <ArrowUpRight />
        </Link>
      </article>
    );

  if (id === "linux")
    return (
      <article className="linux-file">
        <div className="neofetch">
          <LinuxLogo size={115} weight="duotone" />
          <div>
            <h2>dead@home</h2>
            <p>
              <b>Desktop</b> Fedora 44 + KDE Plasma
            </p>
            <p>
              <b>Server</b> Debian / Dell OptiPlex
            </p>
            <p>
              <b>Connection</b> Tailscale
            </p>
            <p>
              <b>Philosophy</b> Make it yours.
            </p>
            <div className="terminal-swatches" aria-hidden="true">
              {[
                "#e0b771",
                "#da806a",
                "#7f9a84",
                "#7195a5",
                "#b69ec9",
                "#f0dfbb",
              ].map((color) => (
                <i style={{ background: color }} key={color} />
              ))}
            </div>
          </div>
        </div>
        <p className="report-note">
          My personal setup, not a live system monitor.
        </p>
        <h3>From using Linux to building for it.</h3>
        <div className="linux-story">
          <section>
            <span>Making it home</span>
            <h4>Below the surface.</h4>
            <p>
              Dual boot, LUKS encryption, NVIDIA and Intel graphics. Linux made
              the boundary between software and hardware something I could
              inspect rather than work around.
            </p>
          </section>
          <section>
            <span>Making it mine</span>
            <h4>A desktop is a starting point.</h4>
            <p>
              SDDM login screens, Minecraft and Sekiro-inspired boot themes, and
              Plasma customization. Desktop tinkering turned into QML, Qt and
              C++ work.
            </p>
          </section>
          <section>
            <span>Making it useful</span>
            <h4>Build the missing piece.</h4>
            <p>
              A native Tailscale panel, a keyboard-driven wallpaper picker, and
              better sticky notes. Small daily annoyances became tools I could
              share.
            </p>
            <button
              className="world-text-button"
              onClick={() => onOpen("projects")}
            >
              Browse the Linux projects
              <ArrowUpRight />
            </button>
          </section>
          <section>
            <span>Taking responsibility</span>
            <h4>The home lab.</h4>
            <p>
              A Debian OptiPlex hosts Docker workloads, Immich, n8n and other
              personal services. The learning is in networking, reverse proxies,
              backups, and understanding why something stopped working.
            </p>
          </section>
        </div>
        <button className="world-button" onClick={() => onOpen("opensource")}>
          What I'm giving back
          <GitPullRequest />
        </button>
      </article>
    );

  if (id === "opensource")
    return (
      <article className="open-source-file">
        <h2>
          Software should
          <br />
          belong to its users.
        </h2>
        <p className="case-intro">
          I build KDE Plasma add-ons and contribute improvements to
          community-maintained widgets. Sometimes a patch lands. Sometimes it
          starts a discussion. Both are part of showing up.
        </p>
        <div className="patch-list">
          {contributions.map((pr) => (
            <a key={pr.url} href={pr.url} target="_blank" rel="noreferrer">
              <GitPullRequest size={24} />
              <div>
                <span>
                  {pr.project}{" "}
                  <b className={`patch-state ${pr.status.toLowerCase()}`}>
                    {pr.status}
                  </b>
                </span>
                <h3>{pr.title}</h3>
                <p>{pr.description}</p>
              </div>
              <ArrowUpRight size={20} />
            </a>
          ))}
        </div>
        <p className="report-note">
          Community project PR statuses researched in September 2026. Open the
          upstream link for the current discussion.
        </p>
        <section className="recurse-file">
          <div className="recurse-insignia" aria-hidden="true">
            r/
          </div>
          <div>
            <span>Club Head / Recurse, KMIT</span>
            <h3>More people making real things.</h3>
            <p>
              I lead Recurse, KMIT's technical club. Workshops, peer learning,
              hackathons, and an open-source initiative that gives members
              something real to contribute to.
            </p>
            <a
              href="https://github.com/recursekmit"
              target="_blank"
              rel="noreferrer"
            >
              Explore the club's work
              <ArrowUpRight />
            </a>
            <a
              href="https://github.com/recursekmit/event-utils"
              target="_blank"
              rel="noreferrer"
            >
              Event platform plans
              <ArrowUpRight />
            </a>
          </div>
        </section>
        <h3>You'll also find me around</h3>
        <div className="community-files">
          {communities.map((community) => (
            <a
              key={community.name}
              href={community.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {community.name}
                <small>{community.description}</small>
              </span>
              <ArrowUpRight />
            </a>
          ))}
        </div>
      </article>
    );

  if (id === "handmade")
    return (
      <article className="handmade-file">
        <div className="handmade-heading">
          <Trophy size={49} weight="duotone" />
          <div>
            <span>The Odin Project / A personal hall of fame</span>
            <h2>
              Built by hand.
              <br />
              Learned the hard way.
            </h2>
          </div>
        </div>
        <p>
          These six Odin Project builds were written without AI assistance. Just
          documentation, experiments, and debugging. The fundamentals still
          matter.
        </p>
        <div className="floppy-shelf">
          {odinProjects.map((project, index) => (
            <a
              key={project.id}
              className={`floppy floppy-${index}`}
              href={project.repo}
              target="_blank"
              rel="noreferrer"
            >
              <span className="floppy-shutter" />
              <span className="floppy-label">
                <span>{project.title}</span>
                <small>{project.focus}</small>
              </span>
              <span className="floppy-bottom">
                <Check size={14} />
                No AI assistance
                <ArrowUpRight size={14} />
              </span>
            </a>
          ))}
        </div>
        <p className="report-note">
          An owner-confirmed collection. The no-AI label applies only to these
          builds, not to other projects or this portfolio.
        </p>
      </article>
    );
  if (id === "writing")
    return (
      <div className="writing-file">
        <h2>Notes from the work.</h2>
        <p>
          Fixes, infrastructure rabbit holes, and the reasoning behind the code.
          Public engineering notes now; my Medium feed once connected.
        </p>
        <Writing />
      </div>
    );
  if (id === "signals")
    return (
      <div className="signals-file">
        <h2>The person behind the activity.</h2>
        <p>
          Actual public feeds. Offline, unavailable and cached are different
          states.
        </p>
        <LiveSignals />
      </div>
    );
  return <Contact profile={profile} />;
}
