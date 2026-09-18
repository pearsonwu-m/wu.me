import { NextRequest, NextResponse } from "next/server";
import { deliverContactMessage, parseContactMessage } from "../../../lib/contact";

// Writes to the filesystem, so this must not run on the edge runtime.
export const runtime = "nodejs";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_BODY_BYTES = 16 * 1024;

// Per-IP submission timestamps. In-memory is fine for the single-container
// deploy; swap for Redis/Upstash if this ever runs on more than one instance.
const submissions = new Map<string, number[]>();
let lastSweep = Date.now();

/** Drops IPs whose submissions have aged out, so the map can't grow forever. */
function sweep(now: number): void {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [ip, times] of submissions) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) submissions.delete(ip);
    else submissions.set(ip, recent);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  sweep(now);
  const recent = (submissions.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

function clientIp(req: NextRequest): string {
  // Behind the reverse proxy the left-most entry is the real client. This is
  // only trustworthy because nothing routes to the container directly.
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Message is too long (5000 characters max)." },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot: real users never fill this hidden field. Pretend success
  // so bots don't learn they were caught.
  if ((body as Record<string, unknown>)?.company) {
    return NextResponse.json({ ok: true });
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many messages — please try again later." },
      { status: 429 }
    );
  }

  const parsed = parseContactMessage(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 }
    );
  }

  try {
    // Resolves once the message is durably stored; a failed notification
    // email is logged rather than surfaced, since nothing has been lost.
    await deliverContactMessage(parsed.message);
  } catch (err) {
    console.error("[contact] could not store message:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong — please email me directly." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
