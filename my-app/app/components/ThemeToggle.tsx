"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-black/[.08] p-0.5 dark:border-white/[.08]">
      <button
        type="button"
        onClick={() => setTheme(false)}
        aria-pressed={!isDark}
        aria-label="Light mode"
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          !isDark
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        }`}
      >
        关 Light
      </button>
      <button
        type="button"
        onClick={() => setTheme(true)}
        aria-pressed={isDark}
        aria-label="Dark mode"
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          isDark
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        }`}
      >
        开 Dark
      </button>
    </div>
  );
}
