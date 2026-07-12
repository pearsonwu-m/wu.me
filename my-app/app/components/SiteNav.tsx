"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const expandedListeners = new Set<() => void>();

function subscribeExpanded(callback: () => void) {
  expandedListeners.add(callback);
  return () => expandedListeners.delete(callback);
}

function getExpandedSnapshot() {
  return localStorage.getItem("navExpanded") === "true";
}

function getExpandedServerSnapshot() {
  return false;
}

function setExpanded(value: boolean) {
  localStorage.setItem("navExpanded", String(value));
  expandedListeners.forEach((listener) => listener());
}

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

const linkClassName =
  "whitespace-nowrap text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100";

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-3.5 w-5 flex-col justify-between">
      <span
        className={`h-0.5 w-full bg-current transition-transform duration-300 ${
          open ? "translate-y-[6px] rotate-45" : ""
        }`}
      />
      <span
        className={`h-0.5 w-full bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
      />
      <span
        className={`h-0.5 w-full bg-current transition-transform duration-300 ${
          open ? "-translate-y-[6px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export default function SiteNav() {
  const expanded = useSyncExternalStore(
    subscribeExpanded,
    getExpandedSnapshot,
    getExpandedServerSnapshot,
  );

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex h-11 items-center overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] sm:right-6 sm:top-5 ${
        expanded
          ? "w-[min(calc(100vw-2rem),34rem)] bg-white/90 shadow-sm backdrop-blur-sm dark:bg-black/80"
          : "w-11 bg-zinc-100 dark:bg-zinc-800"
      }`}
    >
      <div
        className={`flex min-w-0 flex-1 items-center gap-6 overflow-x-auto transition-opacity ${
          expanded
            ? "pl-5 pr-2 opacity-100 duration-300 delay-150"
            : "px-0 pointer-events-none opacity-0 duration-150"
        }`}
      >
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={linkClassName}>
            {link.label}
          </Link>
        ))}
        <ThemeToggle />
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? "Minimize navigation" : "Open navigation"}
        aria-expanded={expanded}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
      >
        <HamburgerIcon open={expanded} />
      </button>
    </div>
  );
}
