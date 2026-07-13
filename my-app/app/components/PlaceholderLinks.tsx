"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BOID_SLOT_FOUND_EVENT, BOID_WORD_COMPLETE_EVENT, BOID_WORD_HOVER_EVENT } from "./boidEvents";

const ITEMS = [
  { href: "/about", word: "ABOUT" },
  { href: "/projects", word: "PROJECTS" },
  { href: "/contact", word: "CONTACT" },
  { href: "/blog", word: "BLOG" },
];

// Keep in sync with BoidField's own check: the boid animation is a desktop
// flourish and doesn't run on phones, so links there must navigate normally
// instead of waiting on a completion event that will never fire.
const DESKTOP_QUERY = "(min-width: 640px)";

function subscribeIsDesktop(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getIsDesktopServerSnapshot() {
  return false;
}

export default function PlaceholderLinks() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [foundSlots, setFoundSlots] = useState<Record<string, boolean>>({});
  const isDesktop = useSyncExternalStore(subscribeIsDesktop, getIsDesktopSnapshot, getIsDesktopServerSnapshot);

  const handleEnter = useCallback((href: string) => setHovered(href), []);
  const handleLeave = useCallback((href: string) => {
    setHovered((prev) => (prev === href ? null : prev));
  }, []);

  // BoidField only starts assembling a word once its link is hovered; tell it
  // via an event instead of having it poll the DOM for a hover attribute every frame.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(BOID_WORD_HOVER_EVENT, { detail: { href: hovered } }));
  }, [hovered]);

  useEffect(() => {
    function onComplete(e: Event) {
      const href = (e as CustomEvent<{ href: string }>).detail?.href;
      if (!href) return;
      setCompleted((prev) => (prev[href] ? prev : { ...prev, [href]: true }));
    }
    function onSlotFound(e: Event) {
      const detail = (e as CustomEvent<{ href: string; index: number }>).detail;
      if (!detail) return;
      const key = `${detail.href}:${detail.index}`;
      setFoundSlots((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    }
    window.addEventListener(BOID_WORD_COMPLETE_EVENT, onComplete);
    window.addEventListener(BOID_SLOT_FOUND_EVENT, onSlotFound);
    return () => {
      window.removeEventListener(BOID_WORD_COMPLETE_EVENT, onComplete);
      window.removeEventListener(BOID_SLOT_FOUND_EVENT, onSlotFound);
    };
  }, []);

  return (
    <div
      data-boid-links=""
      className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-10"
    >
      {ITEMS.map((item) => {
        const isComplete = !!completed[item.href];
        // On desktop, navigation waits for the boid-spelled word to finish
        // assembling; on phones there's no such animation, so links are
        // always immediately clickable.
        const blocksNav = isDesktop && !isComplete;

        const slots = item.word.split("").map((ch, i) => {
          const found = !!foundSlots[`${item.href}:${i}`];
          return (
            <span
              key={i}
              data-boid-slot=""
              data-slot-char={ch}
              className="relative inline-block h-6 w-4 sm:h-7 sm:w-5"
            >
              {/* A single dot stands in for the letter until a boid carrying
                  it lands, bobbing and pulsing on a staggered delay so the
                  row reads as one wave flowing across the placeholders. It
                  drops away once found, and in dark mode it borrows the
                  boids' own orange so the placeholders read as part of the
                  same system. */}
              <span
                aria-hidden
                style={found ? undefined : { animationDelay: `${i * 90}ms` }}
                className={`absolute inset-x-0 bottom-1 flex justify-center transition-all duration-500 ease-in ${
                  found ? "translate-y-2 opacity-0" : "animate-dot-flow"
                }`}
              >
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-[#ff6b1a]/70" />
              </span>
            </span>
          );
        });

        return (
          <Link
            key={item.href}
            href={item.href}
            data-word={item.href}
            aria-label={item.word}
            onMouseEnter={() => handleEnter(item.href)}
            onMouseLeave={() => handleLeave(item.href)}
            onFocus={() => handleEnter(item.href)}
            onBlur={() => handleLeave(item.href)}
            onClick={(e) => {
              if (blocksNav) e.preventDefault();
            }}
            className={`text-lg font-display uppercase tracking-wide text-zinc-700 dark:text-zinc-300 sm:text-base ${
              blocksNav ? "cursor-default" : "cursor-pointer"
            }`}
          >
            {/* Phones skip the boid animation entirely, so the word is just
                plain readable text; desktop hides this and shows the
                letter slots the boids fly into instead. */}
            <span aria-hidden className="sm:hidden">
              {item.word}
            </span>
            <span aria-hidden className="hidden gap-1 sm:flex">
              {slots}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
