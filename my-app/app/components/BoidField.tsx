"use client";

import { useEffect, useRef } from "react";
import { BOID_SLOT_FOUND_EVENT, BOID_WORD_COMPLETE_EVENT, BOID_WORD_HOVER_EVENT } from "./boidEvents";

type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  letter: string;
  slotTarget: { x: number; y: number } | null;
  wordLocked: boolean;
  lockMix: number;
  targetIndex: number;
  interestDir: number;
};

type Rect = { left: number; top: number; right: number; bottom: number };

const BOIDS_PER_PIXEL = 1 / 6000;
const MIN_BOIDS = 160;
const MAX_BOIDS = 380;
const MAX_SPEED = 2.4;
const NEIGHBOR_RADIUS = 60;
const SEPARATION_RADIUS = 26;
const ESCAPE_RADIUS = 160;
const ESCAPE_STRENGTH = 0.35;
const MOUSE_STILL_MS = 400;
const WANDER_STRENGTH = 0.015;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const REQUIRED_LETTER_BUFFER = 3;
const FONT_SIZE = 12;
const NAME_AVOID_RADIUS_SCALE = 0.9;
const AVOID_LEAVE_STRENGTH = 0.5;
const INTEREST_POINT_COUNT = 10;
const INTEREST_RADIUS_MULTIPLIER = 1.7;
const MAX_INTEREST_RADIUS_RATIO = 0.4;
const INTEREST_MIN_GAP = 32;
// The neighbour scan is O(n^2) per frame, so it compares squared distances and
// only takes a square root for the few pairs close enough to separate.
const NEIGHBOR_RADIUS_SQ = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
const SEPARATION_RADIUS_SQ = SEPARATION_RADIUS * SEPARATION_RADIUS;
const ESCAPE_RADIUS_SQ = ESCAPE_RADIUS * ESCAPE_RADIUS;
const SEEK_STRENGTH = 0.03;
const ARRIVAL_RADIUS = 24;
const FALLBACK_AVOID_RADIUS_RATIO = 0.12;
const LINKS_AVOID_MARGIN_MIN = 28;
const LINKS_AVOID_STRENGTH = 0.36;
const HOMING_ARRIVE_DIST = 1;
const HOMING_SPEED_GAIN = 0.2;
const HOMING_BASE_SPEED = 0.6;
const HOMING_MAX_SPEED = MAX_SPEED * 1.8;
const DARK_RGB: [number, number, number] = [255, 107, 26];
const LIGHT_RGB: [number, number, number] = [23, 23, 23];
const DARK_ALPHA = 0.9;
const LIGHT_ALPHA = 0.55;
const THEME_TRANSITION_SPEED = 0.04;
const FOREGROUND_LIGHT_RGB: [number, number, number] = [23, 23, 23];
const FOREGROUND_DARK_RGB: [number, number, number] = [237, 237, 237];
const LOCK_TRANSITION_SPEED = 0.06;
const ARRIVAL_RADIUS_SQ = ARRIVAL_RADIUS * ARRIVAL_RADIUS;
const HOMING_ARRIVE_DIST_SQ = HOMING_ARRIVE_DIST * HOMING_ARRIVE_DIST;

// The ring of interest points only ever changes scale and centre, never shape,
// so the unit circle is computed once here instead of rebuilt every frame.
const INTEREST_RING = Array.from({ length: INTEREST_POINT_COUNT }, (_, p) => {
  const angle = (p / INTEREST_POINT_COUNT) * Math.PI * 2;
  return { cos: Math.cos(angle), sin: Math.sin(angle) };
});

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export default function BoidField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Skip the whole simulation on phones: real mobile browsers were
    // rendering a blank canvas here, and the boid field is a desktop
    // flourish anyway — phones just get the plain links.
    if (!window.matchMedia("(min-width: 640px)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const boids: Boid[] = [];
    let nameRect: Rect | null = null;
    let linksRect: Rect | null = null;
    let letterFontFamily = "sans-serif";

    function relativeRect(parent: Element, el: Element): Rect {
      const parentRect = parent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      return {
        left: elRect.left - parentRect.left,
        top: elRect.top - parentRect.top,
        right: elRect.right - parentRect.left,
        bottom: elRect.bottom - parentRect.top,
      };
    }

    function updateNameRect() {
      const parent = canvas!.parentElement;
      const textEl = parent?.querySelector("h1");
      if (!parent || !textEl) {
        nameRect = null;
        return;
      }
      letterFontFamily = getComputedStyle(textEl).fontFamily || letterFontFamily;
      nameRect = relativeRect(parent, textEl);
    }

    function updateLinksRect() {
      const parent = canvas!.parentElement;
      const linksEl = parent?.querySelector("[data-boid-links]");
      if (!parent || !linksEl) {
        linksRect = null;
        return;
      }
      linksRect = relativeRect(parent, linksEl);
    }

    // The name defines a circular zone: a bit smaller than half the name's
    // width to avoid, plus a ring of discrete interest points around it that
    // boids drift toward one at a time (see interestPoints below), rather
    // than a strict circular path. interestRadius is always at least
    // avoidRadius + INTEREST_MIN_GAP, so the ring itself never dips into the
    // avoidance zone, while still being capped to a fraction of the canvas so
    // a wide name can't push the points off-screen.
    function getCenterZone(): { cx: number; cy: number; avoidRadius: number; interestRadius: number } {
      const cx = nameRect ? (nameRect.left + nameRect.right) / 2 : width / 2;
      const cy = nameRect ? (nameRect.top + nameRect.bottom) / 2 : height / 2;
      const avoidRadius = nameRect
        ? ((nameRect.right - nameRect.left) / 2) * NAME_AVOID_RADIUS_SCALE
        : Math.min(width, height) * FALLBACK_AVOID_RADIUS_RATIO;

      const minInterestRadius = avoidRadius + INTEREST_MIN_GAP;
      const maxInterestRadius = Math.max(Math.min(width, height) * MAX_INTEREST_RADIUS_RATIO, minInterestRadius);
      const interestRadius = Math.min(
        Math.max(avoidRadius * INTEREST_RADIUS_MULTIPLIER, minInterestRadius),
        maxInterestRadius,
      );

      return { cx, cy, avoidRadius, interestRadius };
    }

    type SlotState = {
      char: string;
      x: number;
      y: number;
      boidIndex: number | null;
      found: boolean;
    };

    // Once a word starts assembling (on first hover) it runs to completion
    // regardless of whether the mouse stays put, and stays assembled
    // permanently once done — so slot lists are built lazily on hover and
    // kept for the life of the page rather than torn down when hover ends.
    const wordSlots = new Map<string, SlotState[]>();
    const completedWords = new Set<string>();

    function ensureWordSlots(href: string) {
      if (wordSlots.has(href)) return;
      const parent = canvas!.parentElement;
      const el = parent?.querySelector(`[data-word="${href}"]`);
      if (!parent || !el) return;
      const slots = Array.from(el.querySelectorAll("[data-boid-slot]")).map((slotEl) => {
        const r = relativeRect(parent, slotEl);
        return {
          char: slotEl.getAttribute("data-slot-char") ?? "",
          x: (r.left + r.right) / 2,
          y: (r.top + r.bottom) / 2,
          boidIndex: null,
          found: false,
        };
      });
      wordSlots.set(href, slots);
    }

    // Continuously fill every started word's empty slots with roaming boids
    // that already carry the matching letter (never relabeling one), until
    // each word completes. Filled slots are never released, so a completed
    // word stays assembled permanently.
    function updateActiveSlots() {
      if (wordSlots.size === 0) return;

      const used = new Set<number>();
      for (const list of wordSlots.values()) {
        for (const slot of list) {
          if (slot.boidIndex !== null) used.add(slot.boidIndex);
        }
      }

      for (const [href, slots] of wordSlots) {
        if (completedWords.has(href)) continue;

        for (const slot of slots) {
          if (slot.boidIndex !== null) continue;
          let bestIdx = -1;
          let bestDist = Infinity;
          for (let k = 0; k < boids.length; k++) {
            if (used.has(k) || boids[k].slotTarget || boids[k].letter !== slot.char) continue;
            const sdx = boids[k].x - slot.x;
            const sdy = boids[k].y - slot.y;
            const dSq = sdx * sdx + sdy * sdy;
            if (dSq < bestDist) {
              bestDist = dSq;
              bestIdx = k;
            }
          }
          if (bestIdx !== -1) {
            used.add(bestIdx);
            boids[bestIdx].slotTarget = { x: slot.x, y: slot.y };
            slot.boidIndex = bestIdx;
          }
        }

        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          if (slot.found || slot.boidIndex === null) continue;
          const b = boids[slot.boidIndex];
          const adx = b ? b.x - slot.x : 0;
          const ady = b ? b.y - slot.y : 0;
          if (b && adx * adx + ady * ady <= HOMING_ARRIVE_DIST_SQ) {
            slot.found = true;
            window.dispatchEvent(new CustomEvent(BOID_SLOT_FOUND_EVENT, { detail: { href, index: i } }));
          }
        }

        if (slots.every((slot) => slot.found)) {
          completedWords.add(href);
          for (const slot of slots) {
            if (slot.boidIndex !== null && boids[slot.boidIndex]) {
              boids[slot.boidIndex].wordLocked = true;
            }
          }
          window.dispatchEvent(new CustomEvent(BOID_WORD_COMPLETE_EVENT, { detail: { href } }));
        }
      }
    }

    function applyBoundaryAvoidance(
      b: Boid,
      rect: Rect | null,
      margin: number,
      strength: number,
    ) {
      if (!rect) return;
      const closestX = Math.min(Math.max(b.x, rect.left), rect.right);
      const closestY = Math.min(Math.max(b.y, rect.top), rect.bottom);
      const dx = b.x - closestX;
      const dy = b.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= margin * margin) return;
      const dist = Math.sqrt(distSq);
      if (dist > 0) {
        const falloff = 1 - dist / margin;
        const force = falloff * falloff * strength;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force;
      } else {
        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        const cdx = b.x - cx || 1;
        const cdy = b.y - cy;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
        b.vx += (cdx / cdist) * strength;
        b.vy += (cdy / cdist) * strength;
      }
    }

    function isInAvoidZone(zone: { cx: number; cy: number; avoidRadius: number }, x: number, y: number): boolean {
      const zdx = x - zone.cx;
      const zdy = y - zone.cy;
      if (zdx * zdx + zdy * zdy < zone.avoidRadius * zone.avoidRadius) return true;
      if (
        linksRect &&
        x >= linksRect.left - LINKS_AVOID_MARGIN_MIN &&
        x <= linksRect.right + LINKS_AVOID_MARGIN_MIN &&
        y >= linksRect.top - LINKS_AVOID_MARGIN_MIN &&
        y <= linksRect.bottom + LINKS_AVOID_MARGIN_MIN
      )
        return true;
      return false;
    }

    // Rejection-sample a spawn point so boids never start inside the name's
    // circular avoidance zone or the links row's avoidance rect.
    function randomSpawnPoint(zone: { cx: number; cy: number; avoidRadius: number }): { x: number; y: number } {
      let x = 0;
      let y = 0;
      for (let attempt = 0; attempt < 20; attempt++) {
        x = Math.random() * width;
        y = Math.random() * height;
        if (!isInAvoidZone(zone, x, y)) break;
      }
      return { x, y };
    }

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateNameRect();
      updateLinksRect();
    }

    // Guarantee there are always enough boids carrying each letter a word
    // actually needs: count how many of each character every placeholder
    // word's slots require in total, then reserve that many (with buffer)
    // boids seeded with that exact letter instead of a uniform A-Z draw.
    function buildRequiredLetterPool(): string[] {
      const parent = canvas!.parentElement;
      const slotEls = parent ? parent.querySelectorAll("[data-slot-char]") : [];
      const demand = new Map<string, number>();
      slotEls.forEach((el) => {
        const ch = el.getAttribute("data-slot-char");
        if (!ch) return;
        demand.set(ch, (demand.get(ch) ?? 0) + 1);
      });
      const pool: string[] = [];
      for (const [ch, count] of demand.entries()) {
        for (let i = 0; i < count * REQUIRED_LETTER_BUFFER; i++) pool.push(ch);
      }
      return pool;
    }

    function seed() {
      boids.length = 0;
      const targetCount = Math.round(
        Math.min(MAX_BOIDS, Math.max(MIN_BOIDS, width * height * BOIDS_PER_PIXEL)),
      );
      const requiredPool = buildRequiredLetterPool();
      const zone = getCenterZone();

      for (let i = 0; i < targetCount; i++) {
        const { x, y } = randomSpawnPoint(zone);
        boids.push({
          x,
          y,
          vx: (Math.random() - 0.5) * MAX_SPEED,
          vy: (Math.random() - 0.5) * MAX_SPEED,
          letter:
            i < requiredPool.length
              ? requiredPool[i]
              : LETTERS[Math.floor(Math.random() * LETTERS.length)],
          slotTarget: null,
          wordLocked: false,
          lockMix: 0,
          targetIndex: Math.floor(Math.random() * INTEREST_POINT_COUNT),
          interestDir: Math.random() < 0.5 ? 1 : -1,
        });
      }
    }

    resize();
    seed();

    let themeMix = document.documentElement.classList.contains("dark") ? 1 : 0;

    const target = { x: -9999, y: -9999, active: false };
    let lastMoveAt = -Infinity;

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      target.active = true;
      lastMoveAt = performance.now();
    }

    function handlePointerLeave() {
      target.active = false;
    }

    // The word-forming animation only starts once its link is hovered (and
    // then runs to completion regardless of later hover state, see
    // updateActiveSlots): PlaceholderLinks reports hover changes via this
    // event instead of us polling the DOM for an active link every frame.
    function handleWordHover(e: Event) {
      const href = (e as CustomEvent<{ href: string | null }>).detail?.href ?? null;
      if (href) ensureWordSlots(href);
    }

    let rafId: number;

    function step() {
      const now = performance.now();
      if (target.active && now - lastMoveAt > MOUSE_STILL_MS) {
        target.active = false;
      }

      ctx!.clearRect(0, 0, width, height);

      updateActiveSlots();

      const zone = getCenterZone();

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];

        if (b.slotTarget) {
          const dx = b.slotTarget.x - b.x;
          const dy = b.slotTarget.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > HOMING_ARRIVE_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const speed = Math.min(HOMING_MAX_SPEED, dist * HOMING_SPEED_GAIN + HOMING_BASE_SPEED);
            b.vx = (dx / dist) * speed;
            b.vy = (dy / dist) * speed;
            b.x += b.vx;
            b.y += b.vy;
          } else {
            b.vx = 0;
            b.vy = 0;
            b.x = b.slotTarget.x;
            b.y = b.slotTarget.y;
          }
          continue;
        }

        let avgX = 0,
          avgY = 0,
          avgVX = 0,
          avgVY = 0,
          sepX = 0,
          sepY = 0,
          count = 0;

        for (let j = 0; j < boids.length; j++) {
          if (i === j) continue;
          const o = boids[j];
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= NEIGHBOR_RADIUS_SQ || distSq === 0) continue;
          avgX += o.x;
          avgY += o.y;
          avgVX += o.vx;
          avgVY += o.vy;
          count++;
          if (distSq < SEPARATION_RADIUS_SQ) {
            const dist = Math.sqrt(distSq);
            sepX -= dx / dist;
            sepY -= dy / dist;
          }
        }

        if (count > 0) {
          avgX /= count;
          avgY /= count;
          avgVX /= count;
          avgVY /= count;
          b.vx += (avgX - b.x) * 0.00003;
          b.vy += (avgY - b.y) * 0.00003;
          b.vx += (avgVX - b.vx) * 0.03;
          b.vy += (avgVY - b.vy) * 0.03;
        }

        b.vx += sepX * 0.03;
        b.vy += sepY * 0.03;

        applyBoundaryAvoidance(b, linksRect, LINKS_AVOID_MARGIN_MIN, LINKS_AVOID_STRENGTH);

        if (target.active) {
          const dx = b.x - target.x;
          const dy = b.y - target.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < ESCAPE_RADIUS_SQ && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / ESCAPE_RADIUS) * ESCAPE_STRENGTH;
            b.vx += (dx / dist) * force;
            b.vy += (dy / dist) * force;
          }
        }

        // Push out of the avoidance zone if inside it, then drift toward the
        // boid's assigned interest point; arriving there picks the next one
        // around the ring (direction set per boid by interestDir), so boids
        // wander from point to point instead of tracing a strict circle.
        const cdx = b.x - zone.cx || 1;
        const cdy = b.y - zone.cy;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
        if (cdist < zone.avoidRadius) {
          const leaveForce = (1 - cdist / zone.avoidRadius) * AVOID_LEAVE_STRENGTH;
          b.vx += (cdx / cdist) * leaveForce;
          b.vy += (cdy / cdist) * leaveForce;
        }

        const ring = INTEREST_RING[b.targetIndex];
        const pdx = zone.cx + ring.cos * zone.interestRadius - b.x;
        const pdy = zone.cy + ring.sin * zone.interestRadius - b.y;
        const pdistSq = pdx * pdx + pdy * pdy;
        if (pdistSq < ARRIVAL_RADIUS_SQ) {
          b.targetIndex = (b.targetIndex + b.interestDir + INTEREST_POINT_COUNT) % INTEREST_POINT_COUNT;
        } else {
          const pdist = Math.sqrt(pdistSq);
          b.vx += (pdx / pdist) * SEEK_STRENGTH;
          b.vy += (pdy / pdist) * SEEK_STRENGTH;
        }

        b.vx += (Math.random() - 0.5) * WANDER_STRENGTH;
        b.vy += (Math.random() - 0.5) * WANDER_STRENGTH;

        const speedSq = b.vx * b.vx + b.vy * b.vy;
        if (speedSq > MAX_SPEED * MAX_SPEED) {
          const speed = Math.sqrt(speedSq);
          b.vx = (b.vx / speed) * MAX_SPEED;
          b.vy = (b.vy / speed) * MAX_SPEED;
        }

        b.x += b.vx;
        b.y += b.vy;

        if (b.x < -10) b.x = width + 10;
        if (b.x > width + 10) b.x = -10;
        if (b.y < -10) b.y = height + 10;
        if (b.y > height + 10) b.y = -10;
      }

      const isDark = document.documentElement.classList.contains("dark");
      themeMix = lerp(themeMix, isDark ? 1 : 0, THEME_TRANSITION_SPEED);
      const [r, g, bl] = lerpRgb(LIGHT_RGB, DARK_RGB, themeMix);
      const baseAlpha = lerp(LIGHT_ALPHA, DARK_ALPHA, themeMix);
      const [lockedR, lockedG, lockedB] = lerpRgb(FOREGROUND_LIGHT_RGB, FOREGROUND_DARK_RGB, themeMix);
      const normalFont = `${FONT_SIZE}px ${letterFontFamily}`;
      const lockedFont = `bold ${FONT_SIZE}px ${letterFontFamily}`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      for (const boid of boids) {
        boid.lockMix = lerp(boid.lockMix, boid.wordLocked ? 1 : 0, LOCK_TRANSITION_SPEED);
        const mix = boid.lockMix;
        const [mixedR, mixedG, mixedB] = lerpRgb([r, g, bl], [lockedR, lockedG, lockedB], mix);
        const mixedAlpha = lerp(baseAlpha, 1, mix);
        ctx!.fillStyle = `rgba(${mixedR},${mixedG},${mixedB},${mixedAlpha})`;
        ctx!.font = mix > 0.5 ? lockedFont : normalFont;
        ctx!.fillText(boid.letter, boid.x, boid.y);
      }

      rafId = requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    window.addEventListener(BOID_WORD_HOVER_EVENT, handleWordHover);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    // A sibling layout change (e.g. the navbar being minimized) resizes this
    // container without firing a window "resize" event, which would leave
    // the canvas's drawing buffer stretched relative to its CSS size.
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas.parentElement!);

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener(BOID_WORD_HOVER_EVENT, handleWordHover);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 hidden h-full w-full sm:block"
      aria-hidden="true"
    />
  );
}
