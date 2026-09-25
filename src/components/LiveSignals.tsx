"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Disc3,
  GitBranch,
  Headphones,
  MessageCircle,
  RefreshCw,
  Signal,
  Timer,
  WifiOff,
} from "lucide-react";
import type {
  ActivityDay,
  GithubData,
  Provider,
  ProviderData,
  SignalEnvelope,
  SpotifyData,
} from "@/lib/signal-types";

function useSignal<P extends Provider>(provider: P, refresh: number) {
  const [sample, setSample] = useState<SignalEnvelope<ProviderData[P]> | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const response = await fetch(`/api/signals/${provider}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10_000),
          ]),
        });
        if (!response.ok) throw new Error("Source unavailable");
        const result = (await response.json()) as SignalEnvelope<
          ProviderData[P]
        >;
        if (!["ok", "stale", "unavailable"].includes(result.status))
          throw new Error("Invalid response");
        if (!controller.signal.aborted) setSample(result);
      } catch {
        if (!controller.signal.aborted)
          setSample((previous) =>
            previous?.data
              ? {
                  ...previous,
                  status: "stale",
                  message: "Could not refresh. Showing the previous sample.",
                }
              : {
                  status: "unavailable",
                  source: provider,
                  updatedAt: null,
                  data: null,
                  message: "The source is temporarily unreachable.",
                },
          );
      } finally {
        busy = false;
      }
    }
    void load();
    const interval = setInterval(
      load,
      ["discord", "spotify"].includes(provider) ? 30_000 : 300_000,
    );
    const resume = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [provider, refresh]);
  return sample;
}

function duration(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60).toLocaleString("en-US")}h ${minutes % 60}m`
    : `${minutes}m`;
}

function trackTime(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function SourceStatus({ sample }: { sample: SignalEnvelope<unknown> | null }) {
  return (
    <span className={`source-status mono ${sample?.status ?? "loading"}`}>
      {!sample ? (
        <Timer size={11} />
      ) : sample.status === "ok" ? (
        <Check size={11} />
      ) : sample.status === "stale" ? (
        <Timer size={11} />
      ) : (
        <WifiOff size={11} />
      )}
      {!sample
        ? "CONNECTING"
        : sample.status === "ok"
          ? "CONNECTED"
          : sample.status === "stale"
            ? "CACHED"
            : "UNAVAILABLE"}
    </span>
  );
}

function SourceFooter({ sample }: { sample: SignalEnvelope<unknown> | null }) {
  if (!sample)
    return <div className="signal-source mono">REQUESTING PUBLIC DATA...</div>;
  return (
    <div className="signal-source">
      <span title={sample.source}>{sample.source}</span>
      {sample.updatedAt && (
        <time
          dateTime={sample.updatedAt}
          title={new Date(sample.updatedAt).toLocaleString("en-GB", {
            timeZone: "Asia/Kolkata",
          })}
        >
          {new Date(sample.updatedAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })}{" "}
          IST
        </time>
      )}
    </div>
  );
}

function SignalEmpty({
  sample,
  name,
}: {
  sample: SignalEnvelope<unknown> | null;
  name: string;
}) {
  return (
    <div className="signal-empty" aria-live="polite">
      {sample ? (
        <>
          <WifiOff size={25} />
          <strong>{name} is taking a moment.</strong>
          <p>
            No made-up numbers here. Try refreshing the feeds in a little while.
          </p>
        </>
      ) : (
        <>
          <span className="skeleton skeleton-wide" />
          <span className="skeleton skeleton-short" />
          <span className="mono muted">FETCHING {name.toUpperCase()}...</span>
        </>
      )}
    </div>
  );
}

function Heatmap({ days, label }: { days: ActivityDay[]; label: string }) {
  if (!days.length)
    return (
      <p className="source-note">
        The activity calendar is unavailable. Other statistics still come
        directly from their source.
      </p>
    );
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(...days.map((day) => day.count), 1);
  return (
    <div className="heatmap-wrap">
      <div className="heatmap-heading mono">
        <span>{label}</span>
        <span>{total.toLocaleString("en-US")} IN THIS PERIOD</span>
      </div>
      <figure>
        <div
          className="heatmap"
          role="img"
          aria-label={`${total} ${label.toLowerCase()} from ${days[0].date} to ${days.at(-1)!.date}`}
        >
          {days.map((day) => (
            <span
              key={day.date}
              className={`heat-level-${day.count ? Math.min(4, Math.ceil((day.count / max) * 4)) : 0}`}
              title={`${day.date}: ${day.count}`}
            />
          ))}
        </div>
        <figcaption className="mono">
          <span>
            {days[0].date} / {days.at(-1)!.date}
          </span>
          <span className="heatmap-legend">
            LESS
            <i className="heat-level-0" />
            <i className="heat-level-2" />
            <i className="heat-level-4" />
            MORE
          </span>
        </figcaption>
      </figure>
      <details className="data-table">
        <summary>
          Read the daily data
          <ChevronDown size={12} />
        </summary>
        <div>
          <table>
            <caption className="sr-only">{label} by date</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function GithubDetails({ data }: { data: GithubData }) {
  const [sort, setSort] = useState("stars");
  const repos = [...data.repos]
    .sort((a, b) =>
      sort === "stars"
        ? b.stars - a.stars
        : sort === "forks"
          ? b.forks - a.forks
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : b.updatedAt.localeCompare(a.updatedAt),
    )
    .slice(0, 8);
  const total = data.languages.reduce(
    (sum, language) => sum + language.value,
    0,
  );
  return (
    <details className="signal-details">
      <summary>
        Repositories & languages
        <ChevronDown size={15} />
      </summary>
      <div className="github-language-list">
        {data.languages.slice(0, 6).map((language, index) => (
          <div key={language.name}>
            <span>
              <i className={`chart-color-${index}`} />
              {language.name}
            </span>
            <span className="mono">{language.value} repos</span>
            <meter
              min={0}
              max={total || 1}
              value={language.value}
              aria-label={`${language.name} repository share`}
            />
          </div>
        ))}
      </div>
      <p className="source-note">
        Language mix is based on public, non-fork repository primary languages,
        not time spent coding.
      </p>
      <label className="repo-sort">
        Sort repositories
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="stars">Most stars</option>
          <option value="updated">Recently updated</option>
          <option value="forks">Most forks</option>
          <option value="name">Name</option>
        </select>
      </label>
      <div className="github-repos">
        {repos.map((repo) => (
          <a href={repo.url} key={repo.name} target="_blank" rel="noreferrer">
            <strong>
              {repo.name}
              <ArrowUpRight size={13} />
            </strong>
            <p>{repo.description || "Explore the repository on GitHub."}</p>
            <span className="mono">
              {repo.language ?? "SOURCE"} / {repo.stars} STARS / {repo.forks}{" "}
              FORKS{repo.archived && " / ARCHIVED"}
            </span>
          </a>
        ))}
      </div>
    </details>
  );
}

function GithubSignal({ refresh }: { refresh: number }) {
  const sample = useSignal("github", refresh);
  const data = sample?.data;
  return (
    <article className="signal-card github-signal">
      <header>
        <h3>
          <GitBranch size={18} />
          The commit trail
        </h3>
        <SourceStatus sample={sample} />
      </header>
      {data ? (
        <>
          <div className="github-stats">
            <div>
              <strong>{data.publicRepos}</strong>
              <span className="mono">PUBLIC REPOS</span>
            </div>
            <div>
              <strong>{data.stars}</strong>
              <span
                className="mono"
                title="Stars across public, non-fork repositories"
              >
                STARS
              </span>
            </div>
            <div>
              <strong>{data.followers}</strong>
              <span className="mono">FOLLOWERS</span>
            </div>
            <a
              href="https://github.com/DeadIndian"
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Visit DeadIndian on GitHub"
            >
              <ArrowUpRight size={23} />
            </a>
          </div>
          <Heatmap days={data.contributions} label="CONTRIBUTIONS" />
          <GithubDetails data={data} />
          {sample.message && <p className="source-note">{sample.message}</p>}
        </>
      ) : (
        <SignalEmpty sample={sample} name="GitHub" />
      )}
      <SourceFooter sample={sample} />
    </article>
  );
}

function SpotifyPlayer({ data, fresh }: { data: SpotifyData; fresh: boolean }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!data.isPlaying || !fresh) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [data.isPlaying, fresh]);
  const progress = Math.min(
    data.durationMs,
    data.progressMs +
      (data.isPlaying && fresh && now
        ? Math.max(0, now - Date.parse(data.sampledAt))
        : 0),
  );
  return (
    <div
      className={`spotify-player ${data.isPlaying && fresh ? "is-playing" : ""}`}
    >
      <div className="spotify-track">
        <div className="record-sleeve">
          {data.albumArt ? (
            <Image
              unoptimized
              src={data.albumArt}
              alt={`${data.album ?? data.title} cover artwork`}
              width={72}
              height={72}
            />
          ) : (
            <span className="vinyl">
              <i />
            </span>
          )}
        </div>
        <div>
          <span className="mono muted">
            {data.isPlaying
              ? fresh
                ? "NOW PLAYING"
                : "LAST REPORTED TRACK"
              : "NOT SHARING A TRACK"}
          </span>
          <h4>{data.title ?? "Between soundtracks."}</h4>
          <p>{data.artist ?? "No listening activity on Discord right now."}</p>
        </div>
        {data.isPlaying && (
          <span className="equalizer" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      {data.title && (
        <div className="spotify-progress">
          <progress
            value={progress}
            max={data.durationMs || 1}
            aria-label="Track progress"
          />
          <div className="mono">
            <span>{trackTime(progress)}</span>
            <span>{trackTime(data.durationMs)}</span>
          </div>
        </div>
      )}
      <a
        href={
          data.trackUrl ??
          "https://open.spotify.com/user/31enxavrkyobb5lbp4phl33jgnwq"
        }
        className="text-link"
        target="_blank"
        rel="noreferrer"
      >
        {data.trackUrl ? "Listen on Spotify" : "Find me on Spotify"}
        <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

function SpotifySignal({ refresh }: { refresh: number }) {
  const sample = useSignal("spotify", refresh);
  return (
    <article className="signal-card spotify-signal">
      <header>
        <h3>
          <Headphones size={18} />
          The soundtrack
        </h3>
        <SourceStatus sample={sample} />
      </header>
      {sample?.data ? (
        <SpotifyPlayer data={sample.data} fresh={sample.status === "ok"} />
      ) : (
        <SignalEmpty sample={sample} name="Spotify" />
      )}
      <SourceFooter sample={sample} />
    </article>
  );
}

function DiscordSignal({ refresh }: { refresh: number }) {
  const sample = useSignal("discord", refresh);
  const data = sample?.data;
  return (
    <article className="signal-card discord-signal">
      <header>
        <h3>
          <MessageCircle size={18} />
          Am I around?
        </h3>
        <SourceStatus sample={sample} />
      </header>
      {data ? (
        <>
          <div className="discord-user">
            <div className="discord-avatar">
              {data.avatarUrl ? (
                <Image
                  unoptimized
                  src={data.avatarUrl}
                  alt="Dead Indian's Discord avatar"
                  width={54}
                  height={54}
                />
              ) : (
                <span>di.</span>
              )}
              <i
                className={`presence-${sample.status === "ok" ? data.status : "offline"}`}
              />
            </div>
            <div>
              <h4>{data.displayName}</h4>
              <span className="mono">@{data.username}</span>
            </div>
            <span className={`presence-label ${data.status}`}>
              {sample.status === "stale" ? "Last seen: " : ""}
              {data.status === "dnd" ? "Do not disturb" : data.status}
            </span>
          </div>
          {data.customStatus && (
            <p className="discord-custom">{data.customStatus}</p>
          )}
          {data.activities.map((activity, index) => (
            <div className="discord-activity" key={`${activity.name}-${index}`}>
              <Code2 size={15} />
              <div>
                <strong>{activity.name}</strong>
                {activity.details && <span>{activity.details}</span>}
                {activity.state && <small>{activity.state}</small>}
              </div>
            </div>
          ))}
          <div className="discord-footer">
            <span>
              {data.platforms.length
                ? `On ${data.platforms.join(", ")}`
                : data.status === "offline"
                  ? "Probably somewhere away from the keyboard."
                  : "Presence shared through Lanyard."}
            </span>
            <a
              href="https://discordapp.com/users/972801524092776479"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Discord profile"
            >
              <ArrowUpRight size={18} />
            </a>
          </div>
        </>
      ) : (
        <SignalEmpty sample={sample} name="Discord" />
      )}
      <SourceFooter sample={sample} />
    </article>
  );
}

function WakatimeSignal({ refresh }: { refresh: number }) {
  const sample = useSignal("wakatime", refresh);
  const data = sample?.data;
  return (
    <article className="signal-card wakatime-signal">
      <header>
        <h3>
          <Timer size={18} />
          Time in the editor
        </h3>
        <SourceStatus sample={sample} />
      </header>
      {data ? (
        <>
          <div className="wakatime-total">
            <div>
              <strong>{duration(data.totalSeconds)}</strong>
              <span className="mono muted">ALL-TIME TRACKED CODING</span>
            </div>
            <a
              href="https://wakatime.com/@deadindian"
              className="icon-button"
              target="_blank"
              rel="noreferrer"
              aria-label="Open WakaTime profile"
            >
              <ArrowUpRight size={22} />
            </a>
          </div>
          <div className="language-bars">
            {data.languages.slice(0, 5).map((language, index) => (
              <div key={language.name}>
                <span className="language-name">
                  <i className={`chart-color-${index}`} />
                  {language.name}
                </span>
                <span className="language-track">
                  <i
                    className={`chart-color-${index}`}
                    style={{ width: `${language.percent}%` }}
                  />
                </span>
                <span className="mono">{language.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="wakatime-secondary">
            <div>
              <span className="mono muted">DAILY AVERAGE</span>
              <strong>{duration(data.dailyAverageSeconds)}</strong>
            </div>
            {data.bestDay && (
              <div>
                <span className="mono muted">
                  BEST DAY / {data.bestDay.date}
                </span>
                <strong>{duration(data.bestDay.seconds)}</strong>
              </div>
            )}
          </div>
          <div className="editor-tags">
            {data.editors.slice(0, 3).map((editor) => (
              <span key={editor.name}>
                {editor.name}
                <span className="mono">{editor.percent.toFixed(0)}%</span>
              </span>
            ))}
          </div>
          <p className="source-note">
            All-time public range. Tracked editor activity, not total hours
            worked.
          </p>
        </>
      ) : (
        <SignalEmpty sample={sample} name="WakaTime" />
      )}
      <SourceFooter sample={sample} />
    </article>
  );
}

function LeetcodeSignal({ refresh }: { refresh: number }) {
  const sample = useSignal("leetcode", refresh);
  const data = sample?.data;
  return (
    <article className="signal-card leetcode-signal">
      <header>
        <h3>
          <Code2 size={18} />
          Practising the fundamentals
        </h3>
        <SourceStatus sample={sample} />
      </header>
      {data ? (
        <>
          <div className="leetcode-total">
            <strong>
              {data.totalSolved}
              <span>problems solved</span>
            </strong>
            <a
              href="https://leetcode.com/u/deadindian/"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              LeetCode
              <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="difficulty-bars">
            {[
              ["Easy", data.easy, data.totalEasy],
              ["Medium", data.medium, data.totalMedium],
              ["Hard", data.hard, data.totalHard],
            ].map(([label, value, total]) => (
              <div key={label}>
                <span>{label}</span>
                <progress
                  aria-label={`${label} problems solved`}
                  value={Number(value)}
                  max={Number(total) || 1}
                />
                <span className="mono">
                  {value}
                  <span className="muted"> / {total}</span>
                </span>
              </div>
            ))}
          </div>
          <details className="signal-details">
            <summary>
              Submission history & ranking
              <ChevronDown size={15} />
            </summary>
            <div className="leetcode-extra">
              <span>
                Global ranking{" "}
                <strong>#{data.ranking.toLocaleString("en-US")}</strong>
              </span>
              {data.submissions !== null && (
                <span>
                  Submissions in this period{" "}
                  <strong>{data.submissions.toLocaleString("en-US")}</strong>
                </span>
              )}
            </div>
            <Heatmap days={data.calendar} label="SUBMISSIONS" />
            <p className="source-note">
              Submission activity and solved problems are different measures.
              Only the recorded submission calendar is counted here.
            </p>
          </details>
        </>
      ) : (
        <SignalEmpty sample={sample} name="LeetCode" />
      )}
      <SourceFooter sample={sample} />
    </article>
  );
}

export function LiveSignals() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="live-signals">
      <div className="signals-toolbar">
        <span className="mono">
          <Signal size={13} />
          PUBLIC FEEDS / INDEPENDENTLY UPDATED
        </span>
        <button type="button" onClick={() => setRefresh(refresh + 1)}>
          <RefreshCw size={14} />
          Refresh feeds
        </button>
      </div>
      <div className="signals-grid">
        <GithubSignal refresh={refresh} />
        <div className="presence-stack">
          <SpotifySignal refresh={refresh} />
          <DiscordSignal refresh={refresh} />
        </div>
        <WakatimeSignal refresh={refresh} />
        <LeetcodeSignal refresh={refresh} />
      </div>
      <div className="signals-note">
        <Disc3 size={15} />
        <p>
          Presence and music refresh every 30 seconds; coding stats every 5
          minutes. Cached samples are labeled. Spotify shows listening activity
          shared through Discord.
        </p>
      </div>
    </div>
  );
}
