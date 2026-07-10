"use client";

import { useEffect, useRef } from "react";

type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const BOID_COUNT = 70;
const MAX_SPEED = 2.4;
const NEIGHBOR_RADIUS = 60;
const SEPARATION_RADIUS = 22;
const MOUSE_RADIUS = 220;
const MOUSE_STILL_MS = 400;
const ORBIT_RADIUS = 210;
const ORBIT_STRENGTH = 0.0025;
const ORBIT_SPRING = 0.0006;
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
      for (let i = 0; i < BOID_COUNT; i++) {
        boids.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * MAX_SPEED,
          vy: (Math.random() - 0.5) * MAX_SPEED,
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

      const homeX = width / 2;
      const homeY = height / 2;

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
          b.vx += (avgX - b.x) * 0.0005;
          b.vy += (avgY - b.y) * 0.0005;
          b.vx += (avgVX - b.vx) * 0.03;
          b.vy += (avgVY - b.vy) * 0.03;
        }

        b.vx += sepX * 0.03;
        b.vy += sepY * 0.03;

        if (target.active) {
          const dx = target.x - b.x;
          const dy = target.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.02;
            b.vx += (dx / dist) * force;
            b.vy += (dy / dist) * force;
          }
        } else {
          const dx = b.x - homeX;
          const dy = b.y - homeY;
          const dist = Math.hypot(dx, dy) || 1;
          b.vx += (-dy / dist) * ORBIT_STRENGTH;
          b.vy += (dx / dist) * ORBIT_STRENGTH;
          const radial = (dist - ORBIT_RADIUS) * -ORBIT_SPRING;
          b.vx += (dx / dist) * radial;
          b.vy += (dy / dist) * radial;
        }

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
