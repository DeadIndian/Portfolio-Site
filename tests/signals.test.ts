import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import type {
  Provider,
  SignalEnvelope,
  WakatimeData,
} from "../src/lib/signal-types";

const NOW = "2026-09-24T12:00:00.000Z";
const GITHUB = "https://api.github.com/users/DeadIndian";
const WAKATIME = "https://wakatime.com/api/v1/users/deadindian/stats/all_time";
const LANYARD = "https://api.lanyard.rest/v1/users/972801524092776479";
const STATS = "https://stats.gollabharath.me/stats";
const PRIVATE = "PRIVATE_PAYLOAD_MUST_NOT_ESCAPE";

function repo(name = "public-project", stars = 3) {
  return {
    name,
    private: false,
    fork: false,
    visibility: "public",
    owner: { login: "DeadIndian" },
    html_url: `https://github.com/DeadIndian/${name}`,
    description: "A public project",
    language: "TypeScript",
    stargazers_count: stars,
    forks_count: 2,
    updated_at: NOW,
    archived: false,
    permissions: { admin: true },
  };
}

function wakaFixture() {
  return {
    data: {
      range: "all_time",
      total_seconds: 1086891.056,
      daily_average: 5812,
      is_coding_activity_visible: true,
      is_language_usage_visible: true,
      is_editor_usage_visible: true,
      is_up_to_date: true,
      languages: [
        { name: "JavaScript", total_seconds: 214436.792, percent: 18.44 },
      ],
      editors: [
        { name: "VS Code", total_seconds: 1042448.224, percent: 89.63 },
      ],
      projects: [{ name: PRIVATE }],
    },
  };
}

function lanyardFixture(playing = false) {
  return {
    success: true,
    data: {
      kv: { private: PRIVATE },
      discord_user: {
        id: "972801524092776479",
        username: "deadindian",
        global_name: "Dead Indian",
        avatar: "036a74ab74a4d4604d849c46a56c9f93",
      },
      discord_status: "offline",
      active_on_discord_desktop: false,
      active_on_discord_web: false,
      active_on_discord_mobile: false,
      active_on_discord_embedded: false,
      active_on_discord_vr: false,
      activities: [] as {
        name: string;
        type: number;
        state?: string;
        details?: string;
      }[],
      listening_to_spotify: playing,
      spotify: playing
        ? {
            song: "A real track",
            artist: "A real artist",
            album: "A real album",
            album_art_url: "https://i.scdn.co/image/album",
            track_id: "0123456789ABCDEFGHIJKL",
            timestamps: {
              start: Date.parse(NOW) - 60_000,
              end: Date.parse(NOW) + 180_000,
            },
          }
        : null,
    },
  };
}

// Fixture sections are exposed only through the specific read-only provider routes.
function statsFixture() {
  return {
    meta: { generated_at: NOW },
    data: {
      github: {
        top_repositories: [repo(PRIVATE, 999999)],
        repository_metrics: { total_stars: 999999 },
        language_distribution: { [PRIVATE]: 999999 },
        all_time_lines_of_code: { private: PRIVATE },
        last_updated: NOW,
        contributions_last_365_days: {
          daily: [
            { date: "2026-09-23", contributions: 14 },
            { date: "2026-09-22", contributions: 6 },
          ],
        },
      },
      leetcode: {
        username: "deadindian",
        profile: { ranking: 2341761 },
        last_updated: NOW,
        problems_solved: { all: 63, easy: 42, medium: 21, hard: 0 },
        total_submissions: { all: 77, easy: 55, medium: 22, hard: 0 },
        total_problems: { all: 4060, easy: 966, medium: 2117, hard: 977 },
        acceptance_rate: "81.82",
        submissions_last_365_days: {
          total_submissions: 141,
          daily: [
            { date: "2026-09-23", submissions: 0 },
            { date: "2026-09-22", submissions: 7 },
          ],
        },
      },
      wakatime: PRIVATE,
      discord: PRIVATE,
      spotify: PRIVATE,
    },
  };
}

async function publicResponse(input: RequestInfo | URL): Promise<Response> {
  const url = String(input);
  if (url === GITHUB)
    return Response.json({
      login: "DeadIndian",
      followers: 8,
      public_repos: 1,
    });
  if (url.startsWith(`${GITHUB}/repos?`)) return Response.json([repo()]);
  if (url === WAKATIME) return Response.json(wakaFixture());
  if (url === LANYARD) return Response.json(lanyardFixture());
  if (url === `${STATS}/leetcode`)
    return Response.json({ data: statsFixture().data.leetcode });
  if (url === `${STATS}/github/contributions/daily`)
    return Response.json({
      data: statsFixture().data.github.contributions_last_365_days,
    });
  throw new Error(`Unexpected request: ${url}`);
}

let fetchMock = vi.fn<typeof fetch>();
let getSignal: typeof import("../src/lib/signals").getSignal;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(NOW);
  fetchMock = vi.fn<typeof fetch>().mockImplementation(publicResponse);
  vi.stubGlobal("fetch", fetchMock);
  ({ getSignal } = await import("../src/lib/signals"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public provider contracts", () => {
  it("projects only public REST repositories and the legacy contribution calendar", async () => {
    vi.stubEnv("GITHUB_TOKEN", PRIVATE);
    fetchMock.mockImplementation(async (input) =>
      String(input).startsWith(`${GITHUB}/repos?`)
        ? Response.json([
            { ...repo(), html_url: "javascript:alert(1)" },
            { ...repo(PRIVATE), private: true },
            { ...repo("unknown-privacy"), private: undefined },
            { ...repo("internal"), visibility: "internal" },
            { ...repo("other-owner"), owner: { login: "someone-else" } },
            { ...repo("upstream-fork", 999), fork: true, language: "C" },
          ])
        : publicResponse(input),
    );
    const result = await getSignal("github");
    expect(result).toMatchObject({
      status: "ok",
      updatedAt: NOW,
      data: {
        username: "DeadIndian",
        followers: 8,
        publicRepos: 1,
        stars: 3,
        repos: [
          {
            name: "public-project",
            url: "https://github.com/DeadIndian/public-project",
            description: "A public project",
            language: "TypeScript",
            stars: 3,
            forks: 2,
            updatedAt: NOW,
            archived: false,
          },
        ],
        languages: [{ name: "TypeScript", value: 1 }],
        contributions: [
          { date: "2026-09-22", count: 6 },
          { date: "2026-09-23", count: 14 },
        ],
      },
    });
    expect(Object.keys(result.data!.repos[0]).sort()).toEqual([
      "archived",
      "description",
      "forks",
      "language",
      "name",
      "stars",
      "updatedAt",
      "url",
    ]);
    expect(JSON.stringify(result)).not.toContain(PRIVATE);
    expect(JSON.stringify(result)).not.toContain("permissions");
    expect(
      result.data?.repos.some((item) => item.name === "upstream-fork"),
    ).toBe(false);
    expect(
      fetchMock.mock.calls.some(
        ([url]) => url === STATS || url === `${STATS}/github`,
      ),
    ).toBe(false);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toMatchObject({
        cache: "no-store",
        redirect: "error",
        credentials: "omit",
      });
      expect(new Headers(options?.headers).has("authorization")).toBe(false);
    }
  });

  it("paginates public repositories before calculating totals and language counts", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === GITHUB)
        return Response.json({
          login: "DeadIndian",
          followers: 8,
          public_repos: 101,
        });
      if (url.startsWith(`${GITHUB}/repos?`)) {
        return Response.json(
          new URL(url).searchParams.get("page") === "1"
            ? Array.from({ length: 100 }, (_, index) =>
                repo(`project-${index}`, 1),
              )
            : [repo("last-project", 1)],
        );
      }
      return publicResponse(input);
    });
    const result = await getSignal("github");
    expect(result.status).toBe("ok");
    expect(result.data?.repos).toHaveLength(101);
    expect(result.data?.stars).toBe(101);
    expect(result.data?.languages).toEqual([
      { name: "TypeScript", value: 101 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${GITHUB}/repos?type=owner&sort=updated&per_page=100&page=2`,
      expect.anything(),
    );
  });

  it("keeps public GitHub usable and explicitly labels a missing contribution calendar", async () => {
    fetchMock.mockImplementation((input) =>
      String(input).startsWith(STATS)
        ? Promise.reject(new Error(PRIVATE))
        : publicResponse(input),
    );
    const [github, leetcode] = await Promise.all([
      getSignal("github"),
      getSignal("leetcode"),
    ]);
    expect(github.status).toBe("ok");
    expect(github.data?.stars).toBe(3);
    expect(github.data?.contributions).toEqual([]);
    expect(github.message).toMatch(/calendar unavailable/i);
    expect(leetcode).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
    expect(JSON.stringify([github, leetcode])).not.toContain(PRIVATE);
  });

  it("never substitutes token-backed legacy GitHub data when public REST fails", async () => {
    fetchMock.mockImplementation((input) =>
      String(input).startsWith(GITHUB)
        ? Promise.resolve(Response.json({ message: PRIVATE }, { status: 403 }))
        : publicResponse(input),
    );
    expect(await getSignal("github")).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
  });

  it("normalizes the real public WakaTime all_time payload with absent date bounds", async () => {
    const promise = getSignal("wakatime");
    expectTypeOf(promise).toEqualTypeOf<
      Promise<SignalEnvelope<WakatimeData>>
    >();
    expect(await promise).toEqual({
      status: "ok",
      source: "WakaTime public all-time stats",
      updatedAt: NOW,
      data: {
        totalSeconds: 1086891.056,
        dailyAverageSeconds: 5812,
        range: "all_time",
        start: null,
        end: null,
        languages: [
          { name: "JavaScript", percent: 18.44, seconds: 214436.792 },
        ],
        editors: [{ name: "VS Code", percent: 89.63 }],
        bestDay: null,
      },
    });
  });

  it("preserves provided WakaTime date bounds and best-day totals", async () => {
    const fixture = wakaFixture();
    fetchMock.mockResolvedValue(
      Response.json({
        data: {
          ...fixture.data,
          start: "2026-01-01T00:00:00Z",
          end: NOW,
          best_day: { date: "2026-09-20", total_seconds: 12000 },
        },
      }),
    );
    expect((await getSignal("wakatime")).data).toMatchObject({
      start: "2026-01-01T00:00:00.000Z",
      end: NOW,
      bestDay: { date: "2026-09-20", seconds: 12000 },
    });
  });

  it("does not disclose hidden WakaTime language or editor fields", async () => {
    const fixture = wakaFixture();
    fixture.data.is_language_usage_visible = false;
    fixture.data.is_editor_usage_visible = false;
    fetchMock.mockResolvedValue(Response.json(fixture));
    expect((await getSignal("wakatime")).data).toMatchObject({
      languages: [],
      editors: [],
    });
  });

  it("labels WakaTime samples that the upstream explicitly marks out of date", async () => {
    const fixture = wakaFixture();
    fixture.data.is_up_to_date = false;
    fetchMock.mockResolvedValue(Response.json(fixture));
    expect(await getSignal("wakatime")).toMatchObject({
      status: "stale",
      data: { totalSeconds: 1086891.056 },
    });
  });

  it("shares one Lanyard request while distinguishing true offline and idle playback from errors", async () => {
    const [discord, spotify] = await Promise.all([
      getSignal("discord"),
      getSignal("spotify"),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(discord).toEqual({
      status: "ok",
      source: "Lanyard / Discord",
      updatedAt: NOW,
      data: {
        username: "deadindian",
        displayName: "Dead Indian",
        status: "offline",
        avatarUrl:
          "https://cdn.discordapp.com/avatars/972801524092776479/036a74ab74a4d4604d849c46a56c9f93.png?size=128",
        platforms: [],
        customStatus: null,
        activities: [],
      },
    });
    expect(spotify).toEqual({
      status: "ok",
      source: "Lanyard / Spotify",
      updatedAt: NOW,
      data: {
        isPlaying: false,
        title: null,
        artist: null,
        album: null,
        albumArt: null,
        trackUrl: null,
        durationMs: 0,
        progressMs: 0,
        sampledAt: NOW,
      },
    });
    expect(JSON.stringify([discord, spotify])).not.toContain(PRIVATE);
  });

  it("normalizes Discord platforms, custom status and non-Spotify activities", async () => {
    const fixture = lanyardFixture();
    fixture.data.discord_status = "idle";
    fixture.data.active_on_discord_desktop = true;
    fixture.data.active_on_discord_mobile = true;
    fixture.data.activities = [
      { type: 4, name: "Custom Status", state: "Building" },
      { type: 0, name: "VS Code", details: "Editing TypeScript" },
      { type: 2, name: "Spotify" },
    ];
    fetchMock.mockResolvedValue(Response.json(fixture));
    expect((await getSignal("discord")).data).toMatchObject({
      status: "idle",
      platforms: ["desktop", "mobile"],
      customStatus: "Building",
      activities: [
        { name: "VS Code", details: "Editing TypeScript", state: null },
      ],
    });
  });

  it("normalizes Spotify playback timestamps and public links", async () => {
    fetchMock.mockResolvedValue(Response.json(lanyardFixture(true)));
    expect((await getSignal("spotify")).data).toEqual({
      isPlaying: true,
      title: "A real track",
      artist: "A real artist",
      album: "A real album",
      albumArt: "https://i.scdn.co/image/album",
      trackUrl: "https://open.spotify.com/track/0123456789ABCDEFGHIJKL",
      durationMs: 240000,
      progressMs: 60000,
      sampledAt: NOW,
    });
  });

  it.each([-10_000, 300_000])(
    "clamps Spotify progress for a clock offset of %i ms",
    async (progress) => {
      const fixture = lanyardFixture(true);
      fixture.data.spotify!.timestamps = {
        start: Date.parse(NOW) - progress,
        end: Date.parse(NOW) - progress + 240000,
      };
      fetchMock.mockResolvedValue(Response.json(fixture));
      expect((await getSignal("spotify")).data?.progressMs).toBe(
        Math.max(0, Math.min(240000, progress)),
      );
    },
  );

  it("discards unsafe Spotify links rather than forwarding them", async () => {
    const fixture = lanyardFixture(true);
    fixture.data.spotify!.album_art_url =
      "https://i.scdn.co.evil.example/image";
    fixture.data.spotify!.track_id = "javascript:alert(1)";
    fetchMock.mockResolvedValue(Response.json(fixture));
    expect((await getSignal("spotify")).data).toMatchObject({
      isPlaying: true,
      albumArt: null,
      trackUrl: null,
    });
  });

  it("isolates invalid Discord presence from valid Spotify playback in the same response", async () => {
    const fixture = lanyardFixture(true);
    fixture.data.discord_status = "invalid";
    fetchMock.mockResolvedValue(Response.json(fixture));
    const [discord, spotify] = await Promise.all([
      getSignal("discord"),
      getSignal("spotify"),
    ]);
    expect(discord).toMatchObject({ status: "unavailable", data: null });
    expect(spotify).toMatchObject({ status: "ok", data: { isPlaying: true } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes LeetCode without forwarding the old unverified acceptance rate or fetching aggregate stats", async () => {
    const [leetcode, github] = await Promise.all([
      getSignal("leetcode"),
      getSignal("github"),
    ]);
    expect(leetcode).toEqual({
      status: "ok",
      source: "LeetCode via stats.gollabharath.me",
      updatedAt: NOW,
      data: {
        totalSolved: 63,
        ranking: 2341761,
        easy: 42,
        medium: 21,
        hard: 0,
        totalEasy: 966,
        totalMedium: 2117,
        totalHard: 977,
        submissions: 7,
        acceptanceRate: null,
        calendar: [
          { date: "2026-09-22", count: 7 },
          { date: "2026-09-23", count: 0 },
        ],
      },
    });
    expect(fetchMock.mock.calls.filter(([url]) => url === STATS)).toHaveLength(
      0,
    );
    expect(
      fetchMock.mock.calls.filter(([url]) => url === `${STATS}/leetcode`),
    ).toHaveLength(1);
    expect(JSON.stringify([leetcode, github])).not.toContain(PRIVATE);
  });

  it("derives period submissions from the calendar rather than the misleading legacy count", async () => {
    const fixture = statsFixture();
    fetchMock.mockResolvedValue(
      Response.json({
        data: {
          ...fixture.data.leetcode,
          total_submissions: undefined,
          acceptance_rate: undefined,
        },
      }),
    );
    expect((await getSignal("leetcode")).data).toMatchObject({
      submissions: 7,
      acceptanceRate: null,
    });
  });

  it("does not forward extra unrelated fields in the LeetCode response", async () => {
    const fixture = statsFixture();
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...fixture.data.leetcode, github: [] } }),
    );
    expect(await getSignal("leetcode")).toMatchObject({
      status: "ok",
      data: { totalSolved: 63 },
    });
  });

  it.each<Provider>(["github", "wakatime", "discord", "spotify", "leetcode"])(
    "does not fabricate zero activity for malformed %s data",
    async (provider) => {
      fetchMock.mockImplementation(async () => Response.json({ data: {} }));
      expect(await getSignal(provider)).toMatchObject({
        status: "unavailable",
        updatedAt: null,
        data: null,
      });
    },
  );

  it.each([null, -1, "0", "5812", false])(
    "rejects an invalid required WakaTime total: %s",
    async (total) => {
      const fixture = wakaFixture();
      fetchMock.mockResolvedValue(
        Response.json({ data: { ...fixture.data, total_seconds: total } }),
      );
      expect((await getSignal("wakatime")).status).toBe("unavailable");
    },
  );

  it("does not treat private WakaTime activity as public", async () => {
    const fixture = wakaFixture();
    fixture.data.is_coding_activity_visible = false;
    fetchMock.mockResolvedValue(Response.json(fixture));
    expect((await getSignal("wakatime")).data).toBeNull();
  });

  it("rejects success:false from Lanyard instead of showing offline", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ ...lanyardFixture(), success: false }),
    );
    expect(await getSignal("discord")).toMatchObject({
      status: "unavailable",
      data: null,
    });
  });

  it("rejects impossible LeetCode calendar dates", async () => {
    const fixture = statsFixture();
    fixture.data.leetcode.submissions_last_365_days.daily[0].date =
      "2026-02-30";
    fetchMock.mockResolvedValue(Response.json({ data: fixture.data.leetcode }));
    expect((await getSignal("leetcode")).status).toBe("unavailable");
  });
});

describe("independent timeouts, deduplication and freshness", () => {
  it("deduplicates simultaneous requests and caches validated results", async () => {
    const first = getSignal("wakatime");
    const second = getSignal("wakatime");
    expect(first).toBe(second);
    expect(await first).toEqual(await second);
    await getSignal("wakatime");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes live presence without invalidating a static provider", async () => {
    await Promise.all([getSignal("wakatime"), getSignal("discord")]);
    await vi.advanceTimersByTimeAsync(16_000);
    await Promise.all([getSignal("wakatime"), getSignal("discord")]);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === WAKATIME),
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === LANYARD),
    ).toHaveLength(2);
  });

  it("returns stale data with its original timestamp, backs off, then expires it", async () => {
    const good = await getSignal("wakatime");
    await vi.advanceTimersByTimeAsync(5 * 60_000 + 1);
    fetchMock.mockRejectedValue(new Error(PRIVATE));
    const stale = await getSignal("wakatime");
    expect(stale).toMatchObject({
      status: "stale",
      updatedAt: good.updatedAt,
      data: good.data,
    });
    expect(stale.message).not.toContain(PRIVATE);
    expect(await getSignal("wakatime")).toEqual(stale);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(await getSignal("wakatime")).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
  });

  it("never presents an old Spotify sample as current or keeps it indefinitely", async () => {
    fetchMock.mockResolvedValue(Response.json(lanyardFixture(true)));
    const good = await getSignal("spotify");
    await vi.advanceTimersByTimeAsync(16_000);
    fetchMock.mockRejectedValue(new Error("Offline"));
    expect(await getSignal("spotify")).toMatchObject({
      status: "stale",
      updatedAt: NOW,
      data: good.data,
    });
    await vi.advanceTimersByTimeAsync(46_000);
    expect(await getSignal("spotify")).toMatchObject({
      status: "unavailable",
      data: null,
    });
  });

  it("expires stale live data at its hard age limit, even inside the retry window", async () => {
    await getSignal("spotify");
    await vi.advanceTimersByTimeAsync(59_000);
    fetchMock.mockRejectedValue(new Error("Offline"));
    expect((await getSignal("spotify")).status).toBe("stale");
    await vi.advanceTimersByTimeAsync(1_001);
    expect(await getSignal("spotify")).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
  });

  it("negative-caches failures briefly and recovers independently", async () => {
    fetchMock.mockRejectedValue(new Error("No network"));
    expect((await getSignal("wakatime")).status).toBe("unavailable");
    fetchMock.mockImplementation(publicResponse);
    expect((await getSignal("wakatime")).status).toBe("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await getSignal("discord")).status).toBe("ok");
    await vi.advanceTimersByTimeAsync(30_001);
    expect((await getSignal("wakatime")).status).toBe("ok");
  });

  it("bounds a hung provider even when the transport ignores abort, without blocking others", async () => {
    fetchMock.mockImplementation((input) =>
      String(input) === WAKATIME
        ? new Promise(() => {})
        : publicResponse(input),
    );
    const hung = getSignal("wakatime");
    expect((await getSignal("discord")).status).toBe("ok");
    await vi.advanceTimersByTimeAsync(6_001);
    expect(await hung).toMatchObject({ status: "unavailable", data: null });
    expect(
      fetchMock.mock.calls.find(([url]) => url === WAKATIME)?.[1]?.signal
        ?.aborted,
    ).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("also times out a stalled response body", async () => {
    fetchMock.mockResolvedValue(new Response(new ReadableStream()));
    const hung = getSignal("wakatime");
    await vi.advanceTimersByTimeAsync(6_001);
    expect((await hung).status).toBe("unavailable");
  });

  it("cancels oversized source responses", async () => {
    const cancel = vi.fn();
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1));
          },
          cancel,
        }),
      ),
    );
    expect((await getSignal("wakatime")).status).toBe("unavailable");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("uses the legacy source timestamp instead of relabeling an old sample as live", async () => {
    const fixture = statsFixture();
    const old = "2026-09-24T11:40:00.000Z";
    fixture.data.leetcode.last_updated = old;
    fetchMock.mockResolvedValue(Response.json({ data: fixture.data.leetcode }));
    expect(await getSignal("leetcode")).toMatchObject({
      status: "stale",
      updatedAt: old,
    });
  });

  it("does not accept an expired source sample just because the HTTP request succeeded", async () => {
    const fixture = statsFixture();
    fixture.data.leetcode.last_updated = "2026-09-20T12:00:00.000Z";
    fetchMock.mockResolvedValue(Response.json({ data: fixture.data.leetcode }));
    expect(await getSignal("leetcode")).toMatchObject({
      status: "unavailable",
      updatedAt: null,
      data: null,
    });
  });
});

describe("signal route", () => {
  it.each([
    "__proto__",
    "constructor",
    "toString",
    "unknown",
    "https://evil.example",
  ])("rejects non-provider route %s before fetching", async (provider) => {
    const { GET } = await import("../src/app/api/signals/[provider]/route");
    const response = await GET(
      new Request("https://portfolio.test/api/signals/unknown"),
      { params: Promise.resolve({ provider }) },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the actual contract, awaits params and ignores URL/username overrides", async () => {
    const { GET } = await import("../src/app/api/signals/[provider]/route");
    const response = await GET(
      new Request(
        "https://portfolio.test/api/signals/wakatime?url=https://evil.example&username=other",
      ),
      {
        params: Promise.resolve({ provider: "wakatime" }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toEqual(await getSignal("wakatime"));
    expect(fetchMock).toHaveBeenCalledWith(WAKATIME, expect.anything());
  });

  it("keeps provider failures in a readable envelope rather than throwing a route error", async () => {
    fetchMock.mockRejectedValue(new Error(PRIVATE));
    const { GET } = await import("../src/app/api/signals/[provider]/route");
    const response = await GET(
      new Request("https://portfolio.test/api/signals/wakatime"),
      { params: Promise.resolve({ provider: "wakatime" }) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "unavailable",
      data: null,
      updatedAt: null,
    });
  });
});
