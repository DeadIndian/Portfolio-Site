"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CornerDownLeft } from "lucide-react";
import { socials } from "@/data/portfolio";
import { Dialog } from "./Dialog";

const navigation: Record<string, string> = {
  home: "home",
  about: "about",
  experience: "about",
  projects: "work",
  work: "work",
  linux: "linux",
  foss: "open-source",
  recurse: "recurse",
  odin: "hall-of-fame",
  writing: "writing",
  stats: "now",
  now: "now",
  contact: "contact",
  socials: "contact",
};
const commands = [
  ...new Set([
    "help",
    "whoami",
    "theme",
    "resume",
    "clear",
    "email",
    ...Object.keys(navigation),
    ...socials.map((social) => social.name.toLowerCase()),
  ]),
];

export function Terminal({
  open,
  onClose,
  mode,
  onSwitch,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  mode: "bharath" | "dead";
  onSwitch: () => void;
  onNavigate?: (section: string) => void;
}) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<string[]>([
    "A little terminal. No actual shell access.",
    "Type help for commands. Tab completes. Up / Down recalls history.",
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const suggestions = commands
    .filter(
      (command) =>
        input.trim() &&
        command.startsWith(input.trim().toLowerCase().replace(/^\//, "")),
    )
    .slice(0, 6);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  function execute(value: string) {
    const command = value.trim().toLowerCase().replace(/^\//, "");
    if (!command) return;
    setInput("");
    setHistory((previous) => [...previous, command]);
    setHistoryIndex(-1);
    let output = "";
    if (command === "clear") {
      setLines([]);
      return;
    }
    if (command === "help")
      output = `Navigation: ${Object.keys(navigation).join("  ")}\nIdentity: whoami  theme\nUtilities: resume  email  clear\nSocials: ${socials.map((social) => social.name.toLowerCase()).join("  ")}\n\nTry the identity switch. Same person, different shell.`;
    else if (command === "whoami")
      output =
        mode === "dead"
          ? "Dead Indian\nOpen-source activist. KDE Plasma tinkerer.\nStill Golla Bharath underneath."
          : "Golla Bharath\nSoftware / Infrastructure Intern at CyberParadigm\nClub Head, Recurse @ KMIT\nAlso known as Dead Indian.";
    else if (command === "theme") {
      onSwitch();
      output = `Switching to ${mode === "dead" ? "Bharath" : "Dead Indian"}.`;
    } else if (command === "email")
      output =
        "gollabharath2007@gmail.com\nUse the contact section to email me or copy the address.";
    else if (command === "resume") {
      window.open("/resume", "_blank", "noopener,noreferrer");
      output =
        "Opened the current resume in a new tab. Print it to save a PDF.";
    } else if (navigation[command]) {
      onClose();
      if (onNavigate) {
        requestAnimationFrame(() => onNavigate(navigation[command]));
      } else {
        requestAnimationFrame(() => {
          const section = document.getElementById(navigation[command]);
          section?.scrollIntoView({ behavior: "auto", block: "start" });
          if (section) {
            section.setAttribute("tabindex", "-1");
            section.focus({ preventScroll: true });
          }
        });
      }
      output = `Navigated to ${navigation[command]}.`;
    } else {
      const social = socials.find(
        (item) => item.name.toLowerCase() === command,
      );
      if (social) {
        window.open(social.url, "_blank", "noopener,noreferrer");
        output = `Opened ${social.name}.`;
      } else
        output = `Command not found: ${command}\nTry help. This is a portfolio, not bash.`;
    }
    setLines((previous) => [
      ...previous.slice(-60),
      `${mode === "dead" ? "dead" : "bharath"}@portfolio:~$ ${command}`,
      output,
    ]);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="PORTFOLIO / INTERACTIVE SHELL"
      titleId="terminal-title"
      className="terminal-dialog"
    >
      <div className="terminal-content">
        <div className="terminal-banner">
          <span className="terminal-ascii" aria-hidden="true">
            {">_"}
          </span>
          <div>
            <strong>Same human. Different shell.</strong>
            <span className="mono">A SHORTCUT TO EVERYTHING HERE.</span>
          </div>
        </div>
        <div
          ref={outputRef}
          className="terminal-output"
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
        >
          {lines.map((line, index) => (
            <pre key={index}>{line}</pre>
          ))}
        </div>
        <form
          className="terminal-form"
          onSubmit={(event) => {
            event.preventDefault();
            execute(input);
          }}
        >
          <label htmlFor="terminal-input" className="mono">
            {mode === "dead" ? "dead" : "bharath"}
            <span>@portfolio:~$</span>
          </label>
          <input
            ref={inputRef}
            id="terminal-input"
            value={input}
            placeholder="help"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Tab" && suggestions.length) {
                event.preventDefault();
                setInput(suggestions[0]);
              }
              if (event.ctrlKey && event.key === "c") {
                event.preventDefault();
                setInput("");
              }
              if (
                (event.key === "ArrowUp" || event.key === "ArrowDown") &&
                history.length
              ) {
                event.preventDefault();
                const next =
                  event.key === "ArrowUp"
                    ? Math.min(historyIndex + 1, history.length - 1)
                    : Math.max(historyIndex - 1, -1);
                setHistoryIndex(next);
                setInput(next >= 0 ? history[history.length - 1 - next] : "");
              }
            }}
          />
          <button type="submit" aria-label="Run command">
            <CornerDownLeft size={18} />
          </button>
        </form>
        <div className="terminal-suggestions">
          {suggestions.map((command) => (
            <button
              type="button"
              key={command}
              onClick={() => execute(command)}
            >
              {command}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
        <div className="terminal-footer mono">
          <span>TAB TO COMPLETE / ESC TO LEAVE</span>
          <button type="button" onClick={() => execute("help")}>
            SHOW HELP
          </button>
        </div>
      </div>
    </Dialog>
  );
}
