"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BOID_SLOT_FOUND_EVENT, BOID_WORD_COMPLETE_EVENT, BOID_WORD_HOVER_EVENT } from "./boidEvents";

const ITEMS = [
  { href: "/about", word: "ABOUT" },
  { href: "/projects", word: "PROJECTS" },
  { href: "/contact", word: "CONTACT" },
  { href: "/blog", word: "BLOG" },
];

export default function PlaceholderLinks() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [foundSlots, setFoundSlots] = useState<Record<string, boolean>>({});

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
      className="relative z-10 flex flex-wrap items-center justify-center gap-8 sm:gap-10"
    >
      {ITEMS.map((item) => {
        const isComplete = !!completed[item.href];

        const slots = item.word.split("").map((ch, i) => {
          const found = !!foundSlots[`${item.href}:${i}`];
          return (
            <span
              key={i}
              data-boid-slot=""
              data-slot-char={ch}
              className="relative inline-block h-6 w-4 sm:h-7 sm:w-5"
            >
              <span
                aria-hidden
                className={`absolute inset-0 origin-bottom bg-[linear-gradient(to_top,rgba(0,0,0,0.08),transparent_70%)] transition-transform duration-300 ease-in dark:bg-[linear-gradient(to_top,rgba(255,255,255,0.12),transparent_70%)] ${
                  found ? "scale-y-0" : "scale-y-100"
                }`}
              />
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-0 border-b transition-all duration-500 ease-in ${
                  found
                    ? "delay-300 translate-y-2 border-transparent opacity-0"
                    : "border-zinc-300 opacity-100 dark:border-zinc-600"
                }`}
              />
            </span>
          );
        });

        return (
          <Link
            key={item.href}
            href={item.href}
            data-word={item.href}
            onMouseEnter={() => handleEnter(item.href)}
            onMouseLeave={() => handleLeave(item.href)}
            onFocus={() => handleEnter(item.href)}
            onBlur={() => handleLeave(item.href)}
            onClick={(e) => {
              if (!isComplete) e.preventDefault();
            }}
            className={`flex gap-1 ${isComplete ? "cursor-pointer" : "cursor-default"}`}
          >
            {slots}
          </Link>
        );
      })}
    </div>
  );
}
