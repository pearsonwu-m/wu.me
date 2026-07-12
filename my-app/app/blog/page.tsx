import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "../../lib/blog";
import { BookIcon } from "../components/icons";
import BlogViews from "./BlogViews";

export const metadata: Metadata = {
  title: "Blog — Pearson Wu",
  description: "Notes on physics, technology, and society.",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const posts = getAllPosts();
  const { tag } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 pt-24 pb-16 sm:px-10 sm:pt-32">
        <Link
          href="/"
          className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          ← Back
        </Link>
        <div className="flex flex-row-reverse items-end justify-between gap-4 sm:flex-col sm:items-start sm:justify-start sm:gap-6">
          <BookIcon className="h-14 w-14 text-zinc-900 dark:text-zinc-50" />
          <h1 className="font-title text-3xl tracking-tight text-zinc-900 dark:text-zinc-50">
            Blog
          </h1>
        </div>
        <BlogViews posts={posts} initialTag={tag} />
      </main>
      <footer className="bg-black py-8" />
    </div>
  );
}
