import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

export default function TopicPage({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          ← Back
        </Link>
        <div className="flex flex-col gap-6">
          <Icon className="h-14 w-14 text-zinc-900 dark:text-zinc-50" />
          <h1 className="font-title text-3xl tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {children}
          </div>
        </div>
      </main>
      <footer className="bg-black py-8" />
    </div>
  );
}
