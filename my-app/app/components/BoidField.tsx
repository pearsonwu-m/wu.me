"use client";

import { useEffect, useRef } from "react";

type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetIndex: number;
};

type Waypoint = { x: number; y: number };

const BOIDS_PER_PIXEL = 1 / 7000;
const MIN_BOIDS = 140;
const MAX_BOIDS = 320;
const MAX_SPEED = 2.4;
const NEIGHBOR_RADIUS = 60;
const SEPARATION_RADIUS = 26;
const ESCAPE_RADIUS = 160;
const ESCAPE_STRENGTH = 0.35;
const MOUSE_STILL_MS = 400;
const SEEK_STRENGTH = 0.03;
const ARRIVAL_RADIUS = 24;
const WANDER_STRENGTH = 0.015;
const DARK_COLOR = "255,107,26";
const LIGHT_COLOR = "23,23,23";

export default function BoidField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const boids: Boid[] = [];
    let waypoints: Waypoint[] = [];

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
    }

    function seed() {
      boids.length = 0;
      const targetCount = Math.round(
        Math.min(MAX_BOIDS, Math.max(MIN_BOIDS, width * height * BOIDS_PER_PIXEL)),
      );

      // Scatter a pool of invisible waypoints evenly across the canvas via a
      // jittered grid. Boids steer toward an assigned waypoint and pick a new
      // one on arrival, so they travel with purpose instead of jittering
      // randomly in place, while still covering the whole page over time.
      const cols = Math.max(1, Math.round(Math.sqrt((targetCount * width) / height)));
      const rows = Math.max(1, Math.ceil(targetCount / cols));
      const cellW = width / cols;
      const cellH = height / rows;
      waypoints = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          waypoints.push({
            x: (col + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.8,
            y: (row + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.8,
          });
        }
      }

      for (let i = 0; i < targetCount; i++) {
        boids.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * MAX_SPEED,
          vy: (Math.random() - 0.5) * MAX_SPEED,
          targetIndex: Math.floor(Math.random() * waypoints.length),
        });
      }
    }

    resize();
    seed();

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

    let rafId: number;

    function step() {
      const now = performance.now();
      if (target.active && now - lastMoveAt > MOUSE_STILL_MS) {
        target.active = false;
      }

      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
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
          const dist = Math.hypot(dx, dy);
          if (dist < NEIGHBOR_RADIUS && dist > 0) {
            avgX += o.x;
            avgY += o.y;
            avgVX += o.vx;
            avgVY += o.vy;
            count++;
            if (dist < SEPARATION_RADIUS) {
              sepX -= dx / dist;
              sepY -= dy / dist;
            }
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

        if (target.active) {
          const dx = b.x - target.x;
          const dy = b.y - target.y;
          const dist = Math.hypot(dx, dy);
          if (dist < ESCAPE_RADIUS && dist > 0) {
            const force = (1 - dist / ESCAPE_RADIUS) * ESCAPE_STRENGTH;
            b.vx += (dx / dist) * force;
            b.vy += (dy / dist) * force;
          }
        }

        const wp = waypoints[b.targetIndex];
        const wdx = wp.x - b.x;
        const wdy = wp.y - b.y;
        const wdist = Math.hypot(wdx, wdy);
        if (wdist < ARRIVAL_RADIUS) {
          b.targetIndex = Math.floor(Math.random() * waypoints.length);
        } else {
          b.vx += (wdx / wdist) * SEEK_STRENGTH;
          b.vy += (wdy / wdist) * SEEK_STRENGTH;
        }
        b.vx += (Math.random() - 0.5) * WANDER_STRENGTH;
        b.vy += (Math.random() - 0.5) * WANDER_STRENGTH;

        const speed = Math.hypot(b.vx, b.vy);
        if (speed > MAX_SPEED) {
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
      ctx!.fillStyle = `rgba(${isDark ? DARK_COLOR : LIGHT_COLOR},${isDark ? 0.9 : 0.55})`;
      for (const b of boids) {
        const angle = Math.atan2(b.vy, b.vx);
        ctx!.save();
        ctx!.translate(b.x, b.y);
        ctx!.rotate(angle);
        ctx!.beginPath();
        ctx!.moveTo(4, 0);
        ctx!.lineTo(-3, 2.5);
        ctx!.lineTo(-3, -2.5);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
      }

      rafId = requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
