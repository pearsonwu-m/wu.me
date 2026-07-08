"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PostMeta } from "../../lib/blog";

function formatDate(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-1 rounded-2xl border border-black/[.08] bg-white p-6 transition-colors hover:border-black/[.16] dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16]"
    >
      <span className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {formatDate(post.date)} · {post.readingTime} min read
      </span>
      <h2 className="font-title text-lg text-zinc-900 group-hover:underline dark:text-zinc-50">
        {post.title}
      </h2>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {post.description}
      </p>
      {post.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

type View = "date" | "tag";

export default function BlogViews({
  posts,
  initialTag,
}: {
  posts: PostMeta[];
  initialTag?: string;
}) {
  const [view, setView] = useState<View>(initialTag ? "tag" : "date");
  const [activeTag, setActiveTag] = useState<string | null>(
    initialTag ?? null
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
      (a, b) => a.tag.localeCompare(b.tag)
    );
  }, [posts]);

  const visiblePosts =
    view === "tag" && activeTag
      ? posts.filter((post) => post.tags.includes(activeTag))
      : posts;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 self-start rounded-full border border-black/[.08] bg-white p-1 dark:border-white/[.08] dark:bg-zinc-950">
        {(
          [
            ["date", "By Date"],
            ["tag", "By Tag"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setView(key);
              if (key === "date") setActiveTag(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              view === key
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "tag" && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              activeTag === null
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            All
          </button>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                activeTag === tag
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {tag} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {visiblePosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
        {visiblePosts.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            No posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
