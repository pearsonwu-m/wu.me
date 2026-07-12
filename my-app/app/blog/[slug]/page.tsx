import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, formatDate } from "../../../lib/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return { title: `${post.title} — Pearson Wu`, description: post.description };
  } catch {
    return { title: "Post not found — Pearson Wu" };
  }
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <Link
          href="/blog"
          className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          ← Blog
        </Link>
        <article className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {formatDate(post.date)} · {post.readingTime} min read
          </span>
          <h1 className="font-title text-3xl tracking-tight text-zinc-900 dark:text-zinc-50">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
          <div
            className="prose prose-zinc max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
      <footer className="bg-black py-8" />
    </div>
  );
}
