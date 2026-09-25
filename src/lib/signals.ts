import type {
  ActivityDay,
  DiscordData,
  GithubData,
  GithubRepo,
  LeetcodeData,
  Provider,
  ProviderData,
  SignalEnvelope,
  SpotifyData,
  WakatimeData,
} from "./signal-types";

const GITHUB_USER = "DeadIndian";
const DISCORD_ID = "972801524092776479";
const GITHUB_URL = `https://api.github.com/users/${GITHUB_USER}`;
const WAKATIME_URL =
  "https://wakatime.com/api/v1/users/deadindian/stats/all_time";
const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const STATS_URL = "https://stats.gollabharath.me/stats";
const STATIC_TTL = 5 * 60_000;
const STATIC_MAX_AGE = 24 * 60 * 60_000;
const LIVE_TTL = 15_000;
const LIVE_MAX_AGE = 60_000;
const TIMEOUT = 6_000;

type Sample<T> = { data: T; updatedAt?: string; stale?: boolean };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid object");
  return value as Record<string, unknown>;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Invalid list");
  return value;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Invalid text");
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new Error("Invalid number");
  return value;
}

function count(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result)) throw new Error("Invalid count");
  return result;
}

function percent(value: unknown): number {
  const result = number(value);
  if (result > 100) throw new Error("Invalid percentage");
  return result;
}

function timestamp(value: unknown): string {
  const result = Date.parse(text(value));
  if (!Number.isFinite(result)) throw new Error("Invalid timestamp");
  return new Date(result).toISOString();
}

function calendar(value: unknown, field: string): ActivityDay[] {
  const dates = new Set<string>();
  return list(value)
    .map((item) => {
      const day = record(item);
      const date = text(day.date);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        timestamp(date).slice(0, 10) !== date ||
        dates.has(date)
      ) {
        throw new Error("Invalid calendar date");
      }
      dates.add(date);
      return { date, count: count(day[field]) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function cached<T>(
  source: string,
  ttl: number,
  maxAge: number,
  load: (signal: AbortSignal) => Promise<Sample<T>>,
) {
  let result: SignalEnvelope<T> | undefined;
  let lastGood: { data: T; updatedAt: string } | undefined;
  let retryAt = 0;
  let pending: Promise<SignalEnvelope<T>> | undefined;

  return (): Promise<SignalEnvelope<T>> => {
    if (
      result &&
      Date.now() < retryAt &&
      (result.updatedAt === null ||
        Date.now() - Date.parse(result.updatedAt) < maxAge)
    )
      return Promise.resolve(result);
    if (pending) return pending;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Provider timeout"));
        controller.abort();
      }, TIMEOUT);
    });

    pending = Promise.race([
      Promise.resolve().then(() => load(controller.signal)),
      deadline,
    ])
      .then((sample): SignalEnvelope<T> => {
        const updatedAt = sample.updatedAt ?? new Date().toISOString();
        const age = Date.now() - Date.parse(updatedAt);
        if (!Number.isFinite(age) || age >= maxAge || age < -60_000)
          throw new Error("Expired source data");
        lastGood = { data: sample.data, updatedAt };
        result = {
          status: sample.stale || age > ttl ? "stale" : "ok",
          source,
          ...lastGood,
        };
        if (result.status === "stale")
          result.message = "The source is serving an older sample.";
        retryAt = Date.now() + ttl;
        return result;
      })
      .catch((): SignalEnvelope<T> => {
        result =
          lastGood && Date.now() - Date.parse(lastGood.updatedAt) < maxAge
            ? {
                status: "stale",
                source,
                ...lastGood,
                message: "Refresh failed; showing the last successful sample.",
              }
            : {
                status: "unavailable",
                source,
                updatedAt: null,
                data: null,
                message: "This source is temporarily unavailable.",
              };
        retryAt = Date.now() + Math.min(ttl, 30_000);
        return result;
      })
      .finally(() => {
        clearTimeout(timer);
        pending = undefined;
      });
    return pending;
  };
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    redirect: "error",
    credentials: "omit",
    headers: { Accept: "application/json", "User-Agent": "Bharath-Portfolio" },
  });
  if (!response.ok || !response.body)
    throw new Error("Provider request failed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      signal.throwIfAborted();
      bytes += value.byteLength;
      if (bytes > 2 * 1024 * 1024)
        throw new Error("Provider response too large");
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// Only concurrent callers share these requests. Each provider caches its own validated projection.
const sharedRequests = new Map<string, Promise<Record<string, unknown>>>();
function sharedJson(url: typeof LANYARD_URL): Promise<Record<string, unknown>> {
  const existing = sharedRequests.get(url);
  if (existing) return existing;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Shared source timeout"));
      controller.abort();
    }, TIMEOUT - 500);
  });
  const pending = Promise.race([fetchJson(url, controller.signal), deadline])
    .then((payload) => {
      const root = record(payload);
      const data = record(root.data);
      if (root.success !== true) throw new Error("Lanyard unavailable");
      return data;
    })
    .finally(() => {
      clearTimeout(timer);
      sharedRequests.delete(url);
    });
  sharedRequests.set(url, pending);
  return pending;
}

const githubCore = cached<GithubData>(
  "GitHub public REST",
  STATIC_TTL,
  STATIC_MAX_AGE,
  async (signal) => {
    const repoUrl = (page: number) =>
      `${GITHUB_URL}/repos?type=owner&sort=updated&per_page=100&page=${page}`;
    const [profilePayload, firstPage] = await Promise.all([
      fetchJson(GITHUB_URL, signal),
      fetchJson(repoUrl(1), signal),
    ]);
    const profile = record(profilePayload);
    if (text(profile.login).toLowerCase() !== GITHUB_USER.toLowerCase())
      throw new Error("Unexpected GitHub user");
    const publicRepos = count(profile.public_repos);
    const pages = Math.max(1, Math.ceil(publicRepos / 100));
    if (pages > 20) throw new Error("Repository pagination limit exceeded");
    const remaining = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        fetchJson(repoUrl(index + 2), signal),
      ),
    );
    const repos = new Map<string, GithubRepo>();
    for (const payload of [firstPage, ...remaining]) {
      for (const item of list(payload)) {
        const repo = record(item);
        if (
          repo.private !== false ||
          repo.fork !== false ||
          (repo.visibility !== undefined && repo.visibility !== "public")
        )
          continue;
        if (
          text(record(repo.owner).login).toLowerCase() !==
          GITHUB_USER.toLowerCase()
        )
          continue;
        const name = text(repo.name);
        if (
          !/^[\w.-]{1,100}$/.test(name) ||
          name === "." ||
          name === ".." ||
          typeof repo.archived !== "boolean"
        ) {
          throw new Error("Invalid repository");
        }
        repos.set(name.toLowerCase(), {
          name,
          url: `https://github.com/${GITHUB_USER}/${encodeURIComponent(name)}`,
          description: optionalText(repo.description) ?? "",
          language: optionalText(repo.language),
          stars: count(repo.stargazers_count),
          forks: count(repo.forks_count),
          updatedAt: timestamp(repo.updated_at),
          archived: repo.archived,
        });
      }
    }
    const publicList = [...repos.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    const languages = new Map<string, number>();
    for (const repo of publicList) {
      if (repo.language)
        languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1);
    }
    return {
      data: {
        username: GITHUB_USER,
        followers: count(profile.followers),
        publicRepos,
        stars: publicList.reduce((sum, repo) => sum + repo.stars, 0),
        repos: publicList,
        languages: [...languages]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        contributions: [],
      },
    };
  },
);

const githubCalendar = cached<ActivityDay[]>(
  "GitHub calendar via stats.gollabharath.me",
  STATIC_TTL,
  STATIC_MAX_AGE,
  async (signal) => {
    const payload = record(
      await fetchJson(`${STATS_URL}/github/contributions/daily`, signal),
    );
    return { data: calendar(record(payload.data).daily, "contributions") };
  },
);

async function github(): Promise<SignalEnvelope<GithubData>> {
  const [core, contributions] = await Promise.all([
    githubCore(),
    githubCalendar(),
  ]);
  if (!core.data) return core;
  if (!contributions.data) {
    return {
      ...core,
      message: [
        core.message,
        "Contribution calendar unavailable; repository statistics are public GitHub data.",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }
  const stale = core.status === "stale" || contributions.status === "stale";
  return {
    ...core,
    status: stale ? "stale" : "ok",
    source: `${core.source}; ${contributions.source}`,
    updatedAt: [core.updatedAt!, contributions.updatedAt!].sort()[0],
    data: { ...core.data, contributions: contributions.data },
    message: [
      core.message,
      contributions.message,
      "Calendar time is the retrieval time; its source does not publish a collection timestamp.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

const wakatime = cached<WakatimeData>(
  "WakaTime public all-time stats",
  STATIC_TTL,
  STATIC_MAX_AGE,
  async (signal) => {
    const data = record(record(await fetchJson(WAKATIME_URL, signal)).data);
    if (data.is_coding_activity_visible === false || data.range !== "all_time")
      throw new Error("WakaTime stats are not public");
    const bestDay = data.best_day == null ? null : record(data.best_day);
    return {
      stale: data.is_up_to_date === false,
      data: {
        totalSeconds: number(data.total_seconds),
        dailyAverageSeconds: number(data.daily_average),
        range: "all_time",
        start: data.start == null ? null : timestamp(data.start),
        end: data.end == null ? null : timestamp(data.end),
        languages:
          data.is_language_usage_visible === false
            ? []
            : list(data.languages).map((item) => {
                const language = record(item);
                return {
                  name: text(language.name),
                  percent: percent(language.percent),
                  seconds: number(language.total_seconds),
                };
              }),
        editors:
          data.is_editor_usage_visible === false
            ? []
            : list(data.editors).map((item) => {
                const editor = record(item);
                return {
                  name: text(editor.name),
                  percent: percent(editor.percent),
                };
              }),
        bestDay: bestDay
          ? {
              date: timestamp(bestDay.date).slice(0, 10),
              seconds: number(bestDay.total_seconds),
            }
          : null,
      },
    };
  },
);

const discord = cached<DiscordData>(
  "Lanyard / Discord",
  LIVE_TTL,
  LIVE_MAX_AGE,
  async () => {
    const data = await sharedJson(LANYARD_URL);
    const user = record(data.discord_user);
    if (user.id !== DISCORD_ID) throw new Error("Unexpected Discord user");
    const status = data.discord_status;
    if (
      status !== "online" &&
      status !== "idle" &&
      status !== "dnd" &&
      status !== "offline"
    )
      throw new Error("Invalid presence");
    const activities = list(data.activities).map(record);
    const avatar = optionalText(user.avatar);
    return {
      data: {
        username: text(user.username),
        displayName:
          optionalText(user.global_name) ??
          optionalText(user.display_name) ??
          text(user.username),
        status,
        avatarUrl:
          avatar && /^(a_)?[a-f\d]{32}$/i.test(avatar)
            ? `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=128`
            : null,
        platforms: ["desktop", "web", "mobile", "embedded", "vr"].filter(
          (platform) => data[`active_on_discord_${platform}`] === true,
        ),
        customStatus: optionalText(
          activities.find((activity) => activity.type === 4)?.state,
        ),
        activities: activities
          .filter((activity) => activity.type !== 4 && activity.type !== 2)
          .map((activity) => ({
            name: text(activity.name),
            details: optionalText(activity.details),
            state: optionalText(activity.state),
          })),
      },
    };
  },
);

const spotify = cached<SpotifyData>(
  "Lanyard / Spotify",
  LIVE_TTL,
  LIVE_MAX_AGE,
  async () => {
    const data = await sharedJson(LANYARD_URL);
    if (typeof data.listening_to_spotify !== "boolean")
      throw new Error("Missing listening state");
    const sampledAt = new Date().toISOString();
    if (!data.listening_to_spotify) {
      return {
        data: {
          isPlaying: false,
          title: null,
          artist: null,
          album: null,
          albumArt: null,
          trackUrl: null,
          durationMs: 0,
          progressMs: 0,
          sampledAt,
        },
      };
    }
    const track = record(data.spotify);
    const times = record(track.timestamps);
    const start = number(times.start);
    const durationMs = number(times.end) - start;
    if (durationMs <= 0) throw new Error("Invalid track duration");
    let albumArt: string | null = null;
    try {
      const url = new URL(text(track.album_art_url));
      if (
        url.protocol === "https:" &&
        url.hostname.endsWith(".scdn.co") &&
        !url.username &&
        !url.password &&
        !url.port
      ) {
        albumArt = url.href;
      }
    } catch {
      /* Artwork is optional; an invalid URL must not hide valid playback. */
    }
    const trackId = optionalText(track.track_id);
    return {
      data: {
        isPlaying: true,
        title: text(track.song),
        artist: text(track.artist),
        album: text(track.album),
        albumArt,
        trackUrl:
          trackId && /^[a-zA-Z0-9]{22}$/.test(trackId)
            ? `https://open.spotify.com/track/${trackId}`
            : null,
        durationMs,
        progressMs: Math.max(0, Math.min(durationMs, Date.now() - start)),
        sampledAt,
      },
    };
  },
);

const leetcode = cached<LeetcodeData>(
  "LeetCode via stats.gollabharath.me",
  STATIC_TTL,
  STATIC_MAX_AGE,
  async (signal) => {
    const data = record(
      record(await fetchJson(`${STATS_URL}/leetcode`, signal)).data,
    );
    if (text(data.username).toLowerCase() !== "deadindian")
      throw new Error("Unexpected LeetCode user");
    const solved = record(data.problems_solved);
    const totals = record(data.total_problems);
    const days = calendar(
      record(data.submissions_last_365_days).daily,
      "submissions",
    );
    return {
      updatedAt: timestamp(data.last_updated),
      data: {
        totalSolved: count(solved.all),
        ranking: count(record(data.profile).ranking),
        easy: count(solved.easy),
        medium: count(solved.medium),
        hard: count(solved.hard),
        totalEasy: count(totals.easy),
        totalMedium: count(totals.medium),
        totalHard: count(totals.hard),
        submissions: days.reduce((sum, day) => sum + day.count, 0),
        // The legacy service divides unique solves by accepted submissions, not all attempts.
        acceptanceRate: null,
        calendar: days,
      },
    };
  },
);

const signals = { github, wakatime, discord, spotify, leetcode };

export function isProvider(value: string): value is Provider {
  return Object.hasOwn(signals, value);
}

export function getSignal<P extends Provider>(
  provider: P,
): Promise<SignalEnvelope<ProviderData[P]>> {
  return signals[provider]() as Promise<SignalEnvelope<ProviderData[P]>>;
}
