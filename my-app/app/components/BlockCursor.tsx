"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], label, summary';

// Replaces the native cursor with a custom one: a blinking block caret by
// default, swapping to a steady chevron wedge over anything clickable. Position
// is written straight to the DOM on pointermove (no React state, so we don't
// re-render every frame); the flash is a pure CSS animation.
export default function BlockCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only for real mice: touch devices have no persistent pointer to track,
    // and hiding the native cursor there would strand people with nothing.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const block = el.querySelector<HTMLElement>("[data-cursor-block]")!;
    const chevron = el.querySelector<HTMLElement>("[data-cursor-chevron]")!;

    // Toggling a class (rather than body.style.cursor) lets a global rule hide
    // the native cursor over links/inputs too, which carry their own cursor.
    document.documentElement.classList.add("block-cursor-active");
    // Hidden until the first move so it doesn't flash in the top-left corner
    // before we know where the pointer actually is.
    el.style.visibility = "hidden";

    let overLink = false;
    function setOverLink(next: boolean) {
      if (next === overLink) return;
      overLink = next;
      block.style.display = next ? "none" : "block";
      chevron.style.display = next ? "block" : "none";
    }
    setOverLink(false);

    function handleMove(e: PointerEvent) {
      el!.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      el!.style.visibility = "visible";
      // The cursor is pointer-events-none, so e.target is the element beneath it.
      const t = e.target;
      setOverLink(t instanceof Element && !!t.closest(INTERACTIVE_SELECTOR));
    }

    function hide() {
      el!.style.visibility = "hidden";
    }

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      document.documentElement.classList.remove("block-cursor-active");
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] text-foreground"
    >
      {/* Default: a steady block caret. */}
      <span data-cursor-block className="block h-5 w-2.5 bg-foreground" />
      {/* Over links: a blinking chevron wedge instead of the native finger. */}
      <svg
        data-cursor-chevron
        width="11"
        height="16"
        viewBox="0 0 11 16"
        fill="none"
        className="animate-cursor-blink hidden"
      >
        <path
          d="M2.5 2 L8.5 8 L2.5 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
