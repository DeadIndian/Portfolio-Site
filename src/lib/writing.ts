import { XMLParser } from "fast-xml-parser";
import type { Article, WritingFeed } from "./signal-types";

const TTL = 15 * 60_000;
const MAX_AGE = 24 * 60 * 60_000;
const MAX_BYTES = 1024 * 1024;
const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  processEntities: false,
  ignoreDeclaration: true,
  maxNestedTags: 32,
  isArray: (_name, path) =>
    path === "rss.channel.item" || path === "rss.channel.item.category",
});

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid feed");
  return value as Record<string, unknown>;
}

function plainText(value: unknown, limit: number): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value
    .replace(
      /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
      (entity, code: string) => {
        if (!code.startsWith("#"))
          return entities[code.toLowerCase()] ?? entity;
        const point =
          code[1].toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : Number(code.slice(1));
        return point > 0 &&
          point <= 0x10ffff &&
          !(point >= 0xd800 && point <= 0xdfff)
          ? String.fromCodePoint(point)
          : "";
      },
    )
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit)
    .trim();
}

function articleUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "medium.com" &&
        !url.hostname.endsWith(".medium.com")) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    url.hash = "";
    url.searchParams.delete("source");
    return url.href;
  } catch {
    return null;
  }
}

function parseFeed(xml: string): Article[] {
  if (/<!\s*(DOCTYPE|ENTITY)\b/i.test(xml))
    throw new Error("XML declarations are not allowed");
  const root = record(parser.parse(xml, true) as unknown);
  const channel = record(record(root.rss).channel);
  if (typeof channel.title !== "string")
    throw new Error("Missing channel metadata");
  const items = channel.item == null ? [] : channel.item;
  if (!Array.isArray(items)) throw new Error("Invalid articles");
  const articles = new Map<string, Article>();
  for (const item of items) {
    const entry = record(item);
    const url = articleUrl(entry.link);
    const title = plainText(entry.title, 200);
    if (!url || !title || articles.has(url)) continue;
    const date =
      typeof entry.pubDate === "string" ? Date.parse(entry.pubDate) : NaN;
    articles.set(url, {
      title,
      url,
      publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null,
      description: plainText(
        entry.description || entry["content:encoded"],
        320,
      ),
      categories: Array.isArray(entry.category)
        ? [
            ...new Set(
              entry.category
                .map((category) => plainText(category, 60))
                .filter(Boolean),
            ),
          ].slice(0, 6)
        : [],
    });
  }
  if (items.length && !articles.size)
    throw new Error("No valid articles in the feed");
  return [...articles.values()]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 12);
}

async function loadFeed(
  username: string,
  signal: AbortSignal,
): Promise<Article[]> {
  const response = await fetch(
    `https://medium.com/feed/@${encodeURIComponent(username)}`,
    {
      signal,
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "Bharath-Portfolio",
      },
    },
  );
  if (!response.ok || !response.body) throw new Error("Feed request failed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let xml = "";
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      signal.throwIfAborted();
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("Feed too large");
      xml += decoder.decode(value, { stream: true });
    }
    return parseFeed(xml + decoder.decode());
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

type FeedCache = {
  username: string;
  retryAt: number;
  result?: WritingFeed;
  lastGood?: WritingFeed;
  pending?: Promise<WritingFeed>;
};
let cache: FeedCache | undefined;

export function getWritingFeed(): Promise<WritingFeed> {
  const username = process.env.MEDIUM_USERNAME?.trim().replace(/^@/, "") ?? "";
  if (!username || !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,63}$/.test(username)) {
    cache = undefined;
    return Promise.resolve({
      status: username ? "unavailable" : "unconfigured",
      profileUrl: null,
      updatedAt: null,
      articles: [],
      message: username
        ? "Medium configuration is invalid."
        : "Medium is not connected yet.",
    });
  }
  if (!cache || cache.username !== username) cache = { username, retryAt: 0 };
  const state = cache;
  if (
    state.result &&
    Date.now() < state.retryAt &&
    (state.result.updatedAt === null ||
      Date.now() - Date.parse(state.result.updatedAt) < MAX_AGE)
  )
    return Promise.resolve(state.result);
  if (state.pending) return state.pending;
  const profileUrl = `https://medium.com/@${username}`;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Feed timeout"));
      controller.abort();
    }, 6_000);
  });
  state.pending = Promise.race([
    loadFeed(username, controller.signal),
    deadline,
  ])
    .then((articles): WritingFeed => {
      state.lastGood = {
        status: "ok",
        profileUrl,
        updatedAt: new Date().toISOString(),
        articles,
      };
      state.result = state.lastGood;
      state.retryAt = Date.now() + TTL;
      return state.result;
    })
    .catch((): WritingFeed => {
      state.result =
        state.lastGood?.updatedAt &&
        Date.now() - Date.parse(state.lastGood.updatedAt) < MAX_AGE
          ? {
              ...state.lastGood,
              status: "stale",
              message:
                "Medium is unavailable; showing the last successful feed.",
            }
          : {
              status: "unavailable",
              profileUrl,
              updatedAt: null,
              articles: [],
              message: "Medium is temporarily unavailable.",
            };
      state.retryAt = Date.now() + 30_000;
      return state.result;
    })
    .finally(() => {
      clearTimeout(timer);
      state.pending = undefined;
    });
  return state.pending;
}
