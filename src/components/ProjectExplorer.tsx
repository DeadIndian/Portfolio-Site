"use client";

import { useDeferredValue, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  GitBranch,
  LayoutGrid,
  List,
  Network,
  Orbit,
  Search,
  X,
} from "lucide-react";
import { projects, type Project } from "@/data/portfolio";
import { Dialog } from "./Dialog";

function ProjectArt({ project }: { project: Project }) {
  return (
    <div className={`project-art art-${project.id}`} aria-hidden="true">
      {project.id === "adb" ? (
        <div className="plugin-diagram">
          <span className="diagram-label mono">
            A SMALL CORE. ROOM TO GROW.
          </span>
          <div className="plugin-row">
            <span>MODERATION</span>
            <span>LEVELS</span>
          </div>
          <div className="plugin-core">
            <Box size={23} />
            <b>
              adb<span>_</span>
            </b>
            <small>PLUGIN RUNTIME</small>
          </div>
          <div className="plugin-row">
            <span>MUSIC</span>
            <span>YOUR PLUGIN +</span>
          </div>
        </div>
      ) : project.id === "transitops" ? (
        <div className="transit-diagram">
          <span className="diagram-label mono">TRANSITOPS / DISPATCH FLOW</span>
          <div className="transit-path">
            <span>
              <i>01</i>Vehicle
            </span>
            <ArrowRight size={19} />
            <span>
              <i>02</i>Driver
            </span>
            <ArrowRight size={19} />
            <span>
              <i>03</i>Trip
            </span>
          </div>
          <div className="transit-rule">
            <span className="mono">VALIDATE</span>
            <span className="mono">LOCK</span>
            <span className="mono">DISPATCH</span>
          </div>
          <small className="mono">ONE TRANSACTION. CONSISTENT STATE.</small>
        </div>
      ) : project.id === "tailscale-widget" ? (
        <div className="tailscale-diagram">
          <span className="diagram-label mono">
            YOUR TAILNET. IN YOUR PANEL.
          </span>
          <div className="tailscale-node">
            <span className="tail-dots">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
            <span className="tailscale-line" />
            <Network size={40} />
          </div>
          <div className="tailscale-meta">
            <b>
              Plasma<span> + </span>Tailscale
            </b>
            <small className="mono">PEERS / PROFILES / EXIT NODES</small>
          </div>
        </div>
      ) : project.id === "gamify" ? (
        <div className="gamify-art">
          <span className="diagram-label mono">COMMUNITY MAKES THE GAME.</span>
          <div className="gamify-wordmark">
            gamify<span>&#8599;</span>
          </div>
          <div className="gamify-path mono">
            <span>CONTRIBUTE</span>
            <span>EARN</span>
            <span>GROW</span>
          </div>
        </div>
      ) : (
        <div className="generic-art">
          <GitBranch size={36} />
          <span>{project.title}</span>
          <small className="mono">{project.category}</small>
        </div>
      )}
      <span className="art-caption mono">
        CONCEPT SKETCH / {project.category.toUpperCase()}
      </span>
    </div>
  );
}

export function ProjectExplorer() {
  const [category, setCategory] = useState("Featured");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "orbit">("grid");
  const [orbitIndex, setOrbitIndex] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const pointer = useRef<number | null>(null);
  const dragged = useRef(false);
  const categories = [
    "Featured",
    "All projects",
    "Full Stack",
    "Infrastructure",
    "Linux & FOSS",
    "Experiments",
  ];
  const visible = projects.filter((project) => {
    const matchesCategory =
      category === "All projects" ||
      (category === "Featured"
        ? project.featured
        : project.category === category);
    return (
      (matchesCategory || (category === "Featured" && deferredQuery)) &&
      `${project.title} ${project.summary} ${project.stack.join(" ")}`
        .toLowerCase()
        .includes(deferredQuery)
    );
  });
  const activeIndex = visible.length ? orbitIndex % visible.length : 0;

  function moveProject(direction: number) {
    if (!selected || !visible.length) return;
    const index = visible.findIndex((project) => project.id === selected.id);
    setSelected(visible[(index + direction + visible.length) % visible.length]);
  }

  return (
    <div className="project-explorer">
      <div className="project-toolbar">
        <div className="project-tabs" role="group" aria-label="Filter projects">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setOrbitIndex(0);
              }}
            >
              {item}
              {item === "Featured" && <sup>04</sup>}
              {item === "All projects" && <sup>{projects.length}</sup>}
            </button>
          ))}
        </div>
        <div className="view-switch" role="group" aria-label="Project view">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            aria-label="Interactive orbit view"
            aria-pressed={view === "orbit"}
            onClick={() => setView("orbit")}
          >
            <Orbit size={17} />
          </button>
        </div>
      </div>
      <div className="project-search-row">
        <label className="project-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a project, tool, or rabbit hole..."
            aria-label="Search projects"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear project search"
            >
              <X size={15} />
            </button>
          )}
        </label>
        <span className="mono muted" role="status">
          {String(visible.length).padStart(2, "0")} PROJECTS
        </span>
      </div>
      {!visible.length ? (
        <div className="empty-projects">
          <Search size={29} />
          <h3>No matching projects.</h3>
          <p>Try a technology like React, Docker, or QML.</p>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setQuery("");
              setCategory("All projects");
            }}
          >
            Reset filters
            <ArrowRight size={16} />
          </button>
        </div>
      ) : view === "grid" ? (
        <div
          className={
            category === "Featured" && !query
              ? "featured-grid"
              : "project-archive"
          }
        >
          {visible.map((project, index) => (
            <article className="project-card" key={project.id}>
              <button
                type="button"
                className="project-hitarea"
                onClick={() => setSelected(project)}
                aria-label={`Read case study: ${project.title}`}
              />
              <ProjectArt project={project} />
              <div className="project-info">
                <div className="project-category mono">
                  <span>
                    {String(index + 1).padStart(2, "0")} / {project.category}
                  </span>
                  <span>
                    {project.status === "Archived"
                      ? "ARCHIVED"
                      : project.year || "SOURCE AVAILABLE"}
                  </span>
                </div>
                <h3>
                  {project.title.replace(" (ADB)", "")}
                  <ArrowUpRight size={23} />
                </h3>
                <p>{project.summary}</p>
                <div className="project-card-bottom">
                  <div className="tags">
                    {project.stack.slice(0, 3).map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                    {project.stack.length > 3 && (
                      <span>+{project.stack.length - 3}</span>
                    )}
                  </div>
                  <span className="case-study-link mono">
                    CASE STUDY
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="orbit-browser">
          <div
            className="orbit-stage"
            tabIndex={0}
            role="group"
            aria-label="Interactive project carousel. Drag horizontally or use arrow keys."
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                setOrbitIndex(
                  (index) =>
                    (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      visible.length) %
                    visible.length,
                );
              }
            }}
            onPointerDown={(event) => {
              pointer.current = event.clientX;
              dragged.current = false;
            }}
            onPointerUp={(event) => {
              if (
                pointer.current !== null &&
                Math.abs(event.clientX - pointer.current) > 45
              ) {
                dragged.current = true;
                setOrbitIndex(
                  (index) =>
                    (index +
                      (event.clientX < pointer.current! ? 1 : -1) +
                      visible.length) %
                    visible.length,
                );
              }
              pointer.current = null;
            }}
            onPointerCancel={() => {
              pointer.current = null;
            }}
            onClickCapture={(event) => {
              if (dragged.current) {
                event.preventDefault();
                event.stopPropagation();
                dragged.current = false;
              }
            }}
          >
            {visible.map((project, index) => {
              let offset =
                (index - activeIndex + visible.length) % visible.length;
              if (offset > visible.length / 2) offset -= visible.length;
              if (Math.abs(offset) > 1) return null;
              return (
                <button
                  className="orbit-project"
                  key={project.id}
                  type="button"
                  style={{ "--offset": offset } as CSSProperties}
                  tabIndex={offset === 0 ? 0 : -1}
                  aria-label={`Read case study: ${project.title}`}
                  onClick={() =>
                    offset === 0 ? setSelected(project) : setOrbitIndex(index)
                  }
                >
                  <ProjectArt project={project} />
                  <h3>{project.title}</h3>
                  <span className="mono">
                    {offset === 0 ? "OPEN CASE STUDY" : project.category}
                    <ArrowUpRight size={16} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="orbit-controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous project"
              onClick={() =>
                setOrbitIndex(
                  (index) => (index - 1 + visible.length) % visible.length,
                )
              }
            >
              <ArrowLeft size={19} />
            </button>
            <span className="mono" aria-live="polite">
              {String(activeIndex + 1).padStart(2, "0")} / {visible.length}{" "}
              <span className="muted">DRAG TO EXPLORE</span>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next project"
              onClick={() =>
                setOrbitIndex((index) => (index + 1) % visible.length)
              }
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      )}
      {category === "Featured" && !query && (
        <button
          className="archive-button"
          type="button"
          onClick={() => setCategory("All projects")}
        >
          <List size={17} />
          There's more in the archive
          <span className="mono">
            {projects.length} PROJECTS
            <ArrowRight size={16} />
          </span>
        </button>
      )}
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="PROJECT DOSSIER"
        titleId="project-dialog-title"
        className="project-dialog"
      >
        {selected && (
          <div
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveProject(1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveProject(-1);
              }
            }}
          >
            <div className="project-detail">
              <div className="eyebrow">
                {selected.category} / {selected.status}
              </div>
              <h2>{selected.title}</h2>
              <p className="project-lead">{selected.summary}</p>
              <div className="project-detail-meta">
                <div>
                  <span className="mono muted">MY ROLE</span>
                  <strong>{selected.role}</strong>
                </div>
                <div>
                  <span className="mono muted">THE STACK</span>
                  <div className="tags">
                    {selected.stack.map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
              {selected.image && (
                <figure className="project-screenshot">
                  <Image
                    src={selected.image}
                    alt={`${selected.title} interface from the original project`}
                    width={1200}
                    height={650}
                    sizes="(max-width: 768px) 90vw, 760px"
                  />
                  <figcaption className="mono">
                    SCREENSHOT FROM THE ORIGINAL PROJECT
                  </figcaption>
                </figure>
              )}
              <div className="case-section">
                <span className="mono accent">01 / THE PROBLEM</span>
                <p>{selected.challenge}</p>
              </div>
              <div className="case-section">
                <span className="mono accent">02 / THE APPROACH</span>
                <ul>
                  {selected.approach.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="case-section">
                <span className="mono accent">03 / WHAT CAME OUT OF IT</span>
                <p>{selected.outcome}</p>
              </div>
              {selected.note && (
                <aside className="project-note">
                  <span className="mono">CONTEXT, NOT FINE PRINT</span>
                  <p>{selected.note}</p>
                </aside>
              )}
              <div className="project-detail-links">
                <a
                  href={selected.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-primary"
                >
                  Explore the source
                  <ArrowUpRight size={17} />
                </a>
                {selected.live && (
                  <a
                    href={selected.live}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Visit the project
                    <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
            </div>
            <div className="project-dialog-nav">
              <button type="button" onClick={() => moveProject(-1)}>
                <ArrowLeft size={17} />
                Previous
              </button>
              <span className="mono muted">
                {Math.max(
                  visible.findIndex((project) => project.id === selected.id) +
                    1,
                  1,
                )}{" "}
                / {visible.length}
              </span>
              <button type="button" onClick={() => moveProject(1)}>
                Next
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
