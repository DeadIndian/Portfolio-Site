export interface PublicProfile {
  email: string;
  skillsDisplay: Record<string, string[]>;
  experienceBullets: string[];
  certificates: { name: string; issuer: string; date: string; url?: string }[];
}

export type PanelId =
  | "projects"
  | "about"
  | "linux"
  | "opensource"
  | "writing"
  | "handmade"
  | "signals"
  | "contact"
  | `project:${string}`;

export const panelNames: Record<string, string> = {
  projects: "Project directory",
  about: "The engineer behind the work",
  linux: "Linux & the home lab",
  opensource: "Open source & Recurse",
  writing: "Technical writing",
  handmade: "The no-AI collection",
  signals: "Live signals",
  contact: "Get in touch",
};
