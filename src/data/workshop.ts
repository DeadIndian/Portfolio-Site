import type { PanelId } from "@/components/worlds/types";

export type ChapterId = "learning" | "linux" | "tools" | "people" | "future";
export type WorkshopAction = PanelId | "screen" | "chair" | "reactor";

export interface WorkshopChapter {
  id: ChapterId;
  label: string;
  title: [string, string];
  introduction: string;
  paragraphs: string[];
  margin: string;
  object: string;
  action: WorkshopAction;
  actionLabel: string;
  panel: PanelId;
  panelLabel: string;
}

// First-person accounts approved in the owner's September 27 interview.
// Chapter order is thematic; these are not invented dates or a literal room history.
export const workshopChapters: WorkshopChapter[] = [
  {
    id: "learning",
    label: "Getting better",
    title: ["Still", "becoming."],
    introduction: "The name stayed. I kept learning.",
    paragraphs: [
      "Getting better was the fun part of gaming. That habit followed me into code: try something, get stuck, figure it out, try again.",
      "I keep my early Odin builds around for a reason. Those six were made without AI. Just documentation, experiments, and a lot of debugging. Small projects. A lot learned.",
    ],
    margin: "The origin of DeadIndian? That one's staying a mystery.",
    object: "The handmade collection",
    action: "handmade",
    actionLabel: "Open the handmade shelf",
    panel: "about",
    panelLabel: "Meet the person",
  },
  {
    id: "linux",
    label: "Making it mine",
    title: ["I wiped", "Windows."],
    introduction: "Then I made everything work on Linux.",
    paragraphs: [
      "Switching wasn't smooth. I struggled, wiped Windows, and committed anyway. If something didn't work, I had to figure it out. I haven't gone back.",
      "Kubuntu. Arch with Hyprland and a Celestia rice. Eventually, Fedora with KDE: a desktop I like, with drivers that work for me. Am I biased? Absolutely.",
    ],
    margin: "A computer should feel like it belongs to you.",
    object: "A desktop, made my own",
    action: "screen",
    actionLabel: "Change the desktop",
    panel: "linux",
    panelLabel: "Inside my Linux setup",
  },
  {
    id: "tools",
    label: "Giving back",
    title: ["Build it.", "Share it."],
    introduction: "A small annoyance can become a useful tool.",
    paragraphs: [
      "Tailscale controls in my panel. Notes that stay out of the way. A better way to pick a wallpaper. The things I wanted on my own desktop became things I could share.",
      "I want effort to count, and useful things to be accessible. If something costs money or sits behind a paywall, there should be a good reason. Making someone's day easier is a pretty good reason to build.",
    ],
    margin: "Put the effort in once. Save someone the trouble later.",
    object: "Tools for a daily annoyance",
    action: "project:tailscale-widget",
    actionLabel: "Inspect the Tailscale widget",
    panel: "opensource",
    panelLabel: "Patches & community work",
  },
  {
    id: "people",
    label: "My people",
    title: ["Leave no", "one behind."],
    introduction: "The people matter as much as the things we make.",
    paragraphs: [
      "If a friend seems off, I check on them. I want to be someone people can trust with the good and the difficult stuff. I'd rather have an honest conversation face to face.",
      "I lead Recurse, and I'm still learning to speak to a crowd without getting nervous. Around my people, I'm myself. A game we all enjoy, a good evening together. That's enough.",
    ],
    margin: "There's always room for someone else at the table.",
    object: "A place for a friend",
    action: "chair",
    actionLabel: "Pull up a chair",
    panel: "opensource",
    panelLabel: "Meet Recurse",
  },
  {
    id: "future",
    label: "The long game",
    title: ["A little", "further."],
    introduction: "JARVIS is the thing I keep working toward.",
    paragraphs: [
      "Iron Man planted an idea: what if I could just talk to an AI and get things done? That's the long-term project. An assistant that takes some of the friction out of everyday life.",
      "There is a phone-first prototype. There is much more I want it to become. This part of the workshop is deliberately unfinished. So am I.",
    ],
    margin: "I want to make everyone's life easier. That's the point.",
    object: "The unfinished JARVIS workbench",
    action: "reactor",
    actionLabel: "Look inside the reactor",
    panel: "project:jarvis",
    panelLabel: "The actual JARVIS project",
  },
];

export const desktopMemories = [
  { name: "Kubuntu", note: "Finding my feet on Linux.", asset: "kubuntu" },
  { name: "Arch / Hyprland", note: "Trying a Celestia rice. Making every detail mine.", asset: "arch" },
  { name: "Fedora / KDE", note: "Where I settled. My desktop, with the driver support I needed.", asset: "fedora" },
] as const;

export function chapterFromHash(hash: string): ChapterId | null {
  if (hash === "#workshop") return "learning";
  return workshopChapters.find((chapter) => hash === `#workshop-${chapter.id}`)?.id ?? null;
}
