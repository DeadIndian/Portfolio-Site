import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import type { WritingFeed } from "../src/lib/signal-types";

const NOW = "2026-09-24T12:00:00.000Z";
const FEED = "https://medium.com/feed/@test-author";
const PROFILE = "https://medium.com/@test-author";
const PRIVATE = "UPSTREAM_DETAILS_MUST_NOT_ESCAPE";

function rss(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
      <channel><title>Test Author on Medium</title><link>${PROFILE}</link>${items}</channel>
    </rss>`;
}

function article(
  title = "Shipping TypeScript",
  url = "https://medium.com/@test-author/shipping-typescript-123",
): string {
  return `<item>
    <title><![CDATA[${title}]]></title><link>${url}</link>
    <pubDate>Wed, 23 Sep 2026 10:00:00 GMT</pubDate>
    <content:encoded><![CDATA[<p>Types &amp; tests &#35;1.</p><script>alert('unsafe')</script><style>bad style</style><img src="https://tracker.example/pixel">]]></content:encoded>
    <category><![CDATA[typescript]]></category><category>engineering</category><category>typescript</category>
  </item>`;
}

let fetchMock = vi.fn<typeof fetch>();
let getWritingFeed: typeof import("../src/lib/writing").getWritingFeed;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("MEDIUM_USERNAME", "test-author");
  fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(rss(article())));
  vi.stubGlobal("fetch", fetchMock);
  ({ getWritingFeed } = await import("../src/lib/writing"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Medium configuration and contracts", () => {
  it.each([undefined, "", "   "])(
    "is explicitly unconfigured for an absent handle (%s), without inventing articles",
    async (username) => {
      vi.stubEnv("MEDIUM_USERNAME", username);
      const promise = getWritingFeed();
      expectTypeOf(promise).toEqualTypeOf<Promise<WritingFeed>>();
      expect(await promise).toEqual({
        status: "unconfigured",
        profileUrl: null,
        updatedAt: null,
        articles: [],
        message: "Medium is not connected yet.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    "https://evil.example/feed",
    "../author",
    "author/../../admin",
    "author?url=https://evil.example",
    "author#fragment",
    "author@evil.example",
    "author%2fadmin",
    "localhost:8080",
    "author\\admin",
  ])(
    "rejects invalid handle %s before making any request",
    async (username) => {
      vi.stubEnv("MEDIUM_USERNAME", username);
      expect(await getWritingFeed()).toMatchObject({
        status: "unavailable",
        profileUrl: null,
        updatedAt: null,
        articles: [],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("uses only a fixed HTTPS feed host, no credentials and no redirects", async () => {
    vi.stubEnv("MEDIUM_USERNAME", "  @test-author  ");
    const result = await getWritingFeed();
    expect(result.profileUrl).toBe(PROFILE);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      FEED,
      expect.objectContaining({
        cache: "no-store",
        redirect: "error",
        credentials: "omit",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).has("authorization"),
    ).toBe(false);
  });

  it("accepts a dotted Medium handle without allowing a URL or path", async () => {
    vi.stubEnv("MEDIUM_USERNAME", "@author.name");
    const result = await getWritingFeed();
    expect(result.profileUrl).toBe("https://medium.com/@author.name");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://medium.com/feed/@author.name",
      expect.anything(),
    );
  });

  it("parses real RSS item conventions, CDATA, namespaced content and categories into the exact contract", async () => {
    expect(await getWritingFeed()).toEqual({
      status: "ok",
      profileUrl: PROFILE,
      updatedAt: NOW,
      articles: [
        {
          title: "Shipping TypeScript",
          url: "https://medium.com/@test-author/shipping-typescript-123",
          publishedAt: "2026-09-23T10:00:00.000Z",
          description: "Types & tests #1.",
          categories: ["typescript", "engineering"],
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("sorts multiple items by publication time, preserves missing dates as null and deduplicates canonical links", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        rss(
          article("Undated", "https://medium.com/@test-author/undated").replace(
            /<pubDate>.*?<\/pubDate>/,
            "<pubDate>not a date</pubDate>",
          ) +
            article("Earlier", "https://medium.com/@test-author/earlier") +
            article(
              "Latest",
              "https://publication.medium.com/latest?source=rss",
            ).replace("23 Sep", "24 Sep") +
            article(
              "Duplicate",
              "https://publication.medium.com/latest?source=profile",
            ),
        ),
      ),
    );
    const result = await getWritingFeed();
    expect(result.articles.map(({ title }) => title)).toEqual([
      "Latest",
      "Earlier",
      "Undated",
    ]);
    expect(result.articles[0].url).toBe(
      "https://publication.medium.com/latest",
    );
    expect(result.articles[2].publishedAt).toBeNull();
  });

  it("accepts a valid empty channel as an empty feed", async () => {
    fetchMock.mockResolvedValue(new Response(rss("")));
    expect(await getWritingFeed()).toEqual({
      status: "ok",
      profileUrl: PROFILE,
      updatedAt: NOW,
      articles: [],
    });
  });

  it("bounds item count and plain-text fields", async () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      article(
        "T".repeat(500),
        `https://medium.com/@test-author/post-${index}`,
      ).replace(
        "<p>Types &amp; tests &#35;1.</p>",
        `<p>${"D".repeat(1000)}</p>`,
      ),
    ).join("");
    fetchMock.mockResolvedValue(new Response(rss(items)));
    const result = await getWritingFeed();
    expect(result.articles).toHaveLength(12);
    expect(result.articles[0].title).toHaveLength(200);
    expect(result.articles[0].description).toHaveLength(320);
  });

  it("strips escaped markup as well as raw HTML without returning executable content", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        rss(
          article(
            "&lt;img src=x onerror=alert(1)&gt;Safe &amp; useful",
          ).replace(
            "<p>Types &amp; tests &#35;1.</p>",
            "&lt;script&gt;bad()&lt;/script&gt;<p>Readable &lt;b&gt;text&lt;/b&gt;</p>",
          ),
        ),
      ),
    );
    const result = await getWritingFeed();
    expect(result.articles[0].title).toBe("Safe & useful");
    expect(result.articles[0].description).toBe("Readable text");
    expect(JSON.stringify(result)).not.toContain("onerror");
    expect(JSON.stringify(result)).not.toContain("<script");
    expect(JSON.stringify(result)).not.toContain("tracker.example");
  });

  it.each([
    "javascript:alert(1)",
    "http://medium.com/insecure",
    "//evil.example/article",
    "https://medium.com.evil.example/article",
    "https://medium.com@evil.example/article",
    "https://user:password@medium.com/article",
    "https://medium.com:8080/article",
    "file:///etc/passwd",
  ])(
    "omits unsafe article URL %s while retaining valid articles",
    async (url) => {
      fetchMock.mockResolvedValue(
        new Response(rss(article("Unsafe", url) + article())),
      );
      const result = await getWritingFeed();
      expect(result.status).toBe("ok");
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe("Shipping TypeScript");
    },
  );

  it("does not disguise a feed containing only invalid articles as a successful empty feed", async () => {
    fetchMock.mockResolvedValue(
      new Response(rss(article("Unsafe", "javascript:alert(1)"))),
    );
    expect(await getWritingFeed()).toMatchObject({
      status: "unavailable",
      articles: [],
      updatedAt: null,
    });
  });
});

describe("safe parser and failure handling", () => {
  it.each([
    "",
    "<rss><channel><title>Broken</channel></rss>",
    "<html><body>Error page</body></html>",
    "<rss><channel><item><title>No channel title</title></item></channel></rss>",
    '<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><rss><channel><title>&xxe;</title></channel></rss>',
    '<!DOCTYPE rss [<!ENTITY a "abcdef"><!ENTITY b "&a;&a;&a;">]><rss><channel><title>&b;</title></channel></rss>',
  ])("rejects malformed or unsafe XML fixture %#", async (xml) => {
    fetchMock.mockResolvedValue(new Response(xml));
    expect(await getWritingFeed()).toMatchObject({
      status: "unavailable",
      updatedAt: null,
      articles: [],
    });
  });

  it("limits nested XML depth", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        rss(`<deep>${"<node>".repeat(40)}value${"</node>".repeat(40)}</deep>`),
      ),
    );
    expect((await getWritingFeed()).status).toBe("unavailable");
  });

  it("limits response bytes before parsing and cancels the stream", async () => {
    const cancel = vi.fn();
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(1024 * 1024 + 1));
          },
          cancel,
        }),
      ),
    );
    expect((await getWritingFeed()).status).toBe("unavailable");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("handles upstream HTTP errors without forwarding error bodies", async () => {
    fetchMock.mockResolvedValue(new Response(PRIVATE, { status: 429 }));
    const result = await getWritingFeed();
    expect(result).toMatchObject({
      status: "unavailable",
      articles: [],
      updatedAt: null,
    });
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
  });

  it("times out hung fetches even if the transport ignores its abort signal", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const pending = getWritingFeed();
    await vi.advanceTimersByTimeAsync(6_001);
    expect(await pending).toMatchObject({
      status: "unavailable",
      articles: [],
      updatedAt: null,
    });
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("also bounds a stalled response body", async () => {
    fetchMock.mockResolvedValue(new Response(new ReadableStream()));
    const pending = getWritingFeed();
    await vi.advanceTimersByTimeAsync(6_001);
    expect((await pending).status).toBe("unavailable");
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});

describe("feed cache isolation and recovery", () => {
  it("deduplicates concurrent requests and caches the validated feed", async () => {
    const first = getWritingFeed();
    const second = getWritingFeed();
    expect(first).toBe(second);
    expect(await first).toEqual(await second);
    expect(await getWritingFeed()).toEqual(await first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains stale articles and their timestamp through a refresh failure, then expires them", async () => {
    const good = await getWritingFeed();
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1);
    fetchMock.mockRejectedValue(new Error(PRIVATE));
    const stale = await getWritingFeed();
    expect(stale).toMatchObject({
      status: "stale",
      updatedAt: NOW,
      articles: good.articles,
    });
    expect(JSON.stringify(stale)).not.toContain(PRIVATE);
    expect(await getWritingFeed()).toEqual(stale);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(await getWritingFeed()).toMatchObject({
      status: "unavailable",
      updatedAt: null,
      articles: [],
    });
  });

  it("backs off failures, then recovers without restarting the server", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"));
    expect((await getWritingFeed()).status).toBe("unavailable");
    fetchMock.mockImplementation(async () => new Response(rss(article())));
    expect((await getWritingFeed()).status).toBe("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_001);
    expect((await getWritingFeed()).status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("expires stale articles at the hard age limit rather than extending it through retry backoff", async () => {
    await getWritingFeed();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000 - 5_000);
    fetchMock.mockRejectedValue(new Error("Offline"));
    expect((await getWritingFeed()).status).toBe("stale");
    await vi.advanceTimersByTimeAsync(5_001);
    expect(await getWritingFeed()).toMatchObject({
      status: "unavailable",
      articles: [],
      updatedAt: null,
    });
  });

  it("does not reuse cached articles for a different or disconnected handle", async () => {
    await getWritingFeed();
    vi.stubEnv("MEDIUM_USERNAME", "other-author");
    fetchMock.mockRejectedValue(new Error("Other feed unavailable"));
    expect(await getWritingFeed()).toMatchObject({
      status: "unavailable",
      profileUrl: "https://medium.com/@other-author",
      articles: [],
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://medium.com/feed/@other-author",
      expect.anything(),
    );
    vi.stubEnv("MEDIUM_USERNAME", undefined);
    expect(await getWritingFeed()).toMatchObject({
      status: "unconfigured",
      profileUrl: null,
      articles: [],
    });
  });

  it("does not let an old in-flight handle overwrite the current handle cache", async () => {
    let resolveOld!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const old = getWritingFeed();
    vi.stubEnv("MEDIUM_USERNAME", "other-author");
    fetchMock.mockImplementation(
      async () =>
        new Response(
          rss(article("Other", "https://medium.com/@other-author/article")),
        ),
    );
    const current = await getWritingFeed();
    resolveOld(new Response(rss(article())));
    await old;
    expect(await getWritingFeed()).toEqual(current);
    expect(current.profileUrl).toBe("https://medium.com/@other-author");
    expect(current.articles[0].title).toBe("Other");
  });
});

describe("writing route", () => {
  it("returns the exact unconfigured contract without any network request", async () => {
    vi.stubEnv("MEDIUM_USERNAME", undefined);
    const { GET } = await import("../src/app/api/writing/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toEqual(await getWritingFeed());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns configured articles using the WritingFeed contract", async () => {
    const { GET } = await import("../src/app/api/writing/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(await getWritingFeed());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
