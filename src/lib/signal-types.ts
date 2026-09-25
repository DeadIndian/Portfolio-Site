export type Provider =
  "github" | "wakatime" | "discord" | "spotify" | "leetcode";

export interface ActivityDay {
  date: string;
  count: number;
}

export interface GithubRepo {
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  archived: boolean;
}

export interface GithubData {
  username: string;
  followers: number;
  publicRepos: number;
  stars: number;
  repos: GithubRepo[];
  languages: { name: string; value: number }[];
  contributions: ActivityDay[];
}

export interface WakatimeData {
  totalSeconds: number;
  dailyAverageSeconds: number;
  range: string;
  start: string | null;
  end: string | null;
  languages: { name: string; percent: number; seconds: number }[];
  editors: { name: string; percent: number }[];
  bestDay: { date: string; seconds: number } | null;
}

export interface DiscordData {
  username: string;
  displayName: string;
  status: "online" | "idle" | "dnd" | "offline";
  avatarUrl: string | null;
  platforms: string[];
  customStatus: string | null;
  activities: { name: string; details: string | null; state: string | null }[];
}

export interface SpotifyData {
  isPlaying: boolean;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArt: string | null;
  trackUrl: string | null;
  durationMs: number;
  progressMs: number;
  sampledAt: string;
}

export interface LeetcodeData {
  totalSolved: number;
  ranking: number;
  easy: number;
  medium: number;
  hard: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  submissions: number | null;
  acceptanceRate: number | null;
  calendar: ActivityDay[];
}

export interface ProviderData {
  github: GithubData;
  wakatime: WakatimeData;
  discord: DiscordData;
  spotify: SpotifyData;
  leetcode: LeetcodeData;
}

export interface SignalEnvelope<T> {
  status: "ok" | "stale" | "unavailable";
  source: string;
  updatedAt: string | null;
  data: T | null;
  message?: string;
}

export interface Article {
  title: string;
  url: string;
  publishedAt: string | null;
  description: string;
  categories: string[];
}

export interface WritingFeed {
  status: "ok" | "stale" | "unconfigured" | "unavailable";
  profileUrl: string | null;
  updatedAt: string | null;
  articles: Article[];
  message?: string;
}
