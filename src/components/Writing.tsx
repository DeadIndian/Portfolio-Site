"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, RefreshCw } from "lucide-react";
import { engineeringNotes } from "@/data/portfolio";
import type { WritingFeed } from "@/lib/signal-types";

export function Writing() {
  const [feed, setFeed] = useState<WritingFeed | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/writing", {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(9000)]),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Feed unavailable");
        return response.json() as Promise<WritingFeed>;
      })
      .then(setFeed)
      .catch(() => {
        if (!controller.signal.aborted)
          setFeed({
            status: "unavailable",
            profileUrl: null,
            updatedAt: null,
            articles: [],
          });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="writing-layout">
      <div className="writing-list">
        {engineeringNotes.map((note, index) => (
          <a
            key={note.url}
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="writing-entry"
          >
            <span className="writing-number mono">0{index + 1}</span>
            <div>
              <div className="eyebrow">{note.label}</div>
              <h3>{note.title}</h3>
              <p>{note.description}</p>
              <div className="tags">
                {note.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <ArrowUpRight size={24} />
          </a>
        ))}
      </div>
      <aside className="medium-panel">
        <span className="medium-logotype" aria-hidden="true">
          M<span>&#9679;</span>
        </span>
        <div className="eyebrow">THE LONGER VERSION</div>
        <h3>
          Technical stories,
          <br />
          <em>on Medium.</em>
        </h3>
        <p>
          {feed?.profileUrl
            ? "My home for longer technical write-ups. Read the original stories on Medium, or explore the latest entries below."
            : "My home for longer technical write-ups. The feed will appear here once my profile is connected."}
        </p>
        {feed?.profileUrl ? (
          <a
            href={feed.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Read on Medium
            <ArrowUpRight size={17} />
          </a>
        ) : (
          <span className="feed-state mono">
            <BookOpen size={14} />
            {feed === null
              ? "CHECKING THE FEED"
              : feed.status === "unavailable"
                ? "FEED TEMPORARILY UNAVAILABLE"
                : "MEDIUM FEED NOT CONNECTED YET"}
          </span>
        )}
        <p className="medium-note">
          {feed?.status === "unavailable"
            ? "The feed is temporarily unavailable. The public guides here are still ready to read."
            : feed?.status === "ok" && !feed.articles.length
              ? "No public articles in the feed yet. The guides here are ready to read."
              : "Public guides, lab notes, and project documentation are collected alongside the longer stories."}
        </p>
        {feed?.status === "unavailable" && (
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setFeed(null);
              setAttempt(attempt + 1);
            }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        )}
      </aside>
      {feed && feed.articles.length > 0 && (
        <div className="medium-articles">
          <div className="eyebrow">
            FROM MEDIUM {feed.status === "stale" ? "/ CACHED FEED" : ""}
          </div>
          {feed.articles.map((article) => (
            <a
              href={article.url}
              key={article.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="mono muted">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "ARTICLE"}
              </span>
              <h3>
                {article.title}
                <ArrowRight size={18} />
              </h3>
              <p>{article.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
