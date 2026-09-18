import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

export type DeliveryResult = {
  /** The message is durably stored; safe to tell the sender it was received. */
  stored: boolean;
  /** Whether the notification email went out. False when unconfigured or failing. */
  emailed: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STORE_DIR = process.env.CONTACT_STORE_DIR ?? path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "messages.jsonl");

export function parseContactMessage(
  body: unknown
): { ok: true; message: ContactMessage } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const { name, email, message } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "Please enter your name." };
  }
  if (name.length > 100) {
    return { ok: false, error: "Name is too long." };
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (email.length > 254) {
    return { ok: false, error: "Email is too long." };
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return { ok: false, error: "Please write a message." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "Message is too long (5000 characters max)." };
  }

  return {
    ok: true,
    message: {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    },
  };
}

async function persist(msg: ContactMessage, receivedAt: string): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await appendFile(
    STORE_FILE,
    JSON.stringify({ ...msg, receivedAt }) + "\n",
    "utf8"
  );
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** The message is attacker-controlled; it must never reach the inbox as markup. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Collapses whitespace so a newline in the name can't forge a mail header. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatReceived(receivedAt: string): string {
  return new Date(receivedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

function buildSubject(msg: ContactMessage): string {
  const name = oneLine(msg.name);
  const preview = oneLine(msg.message);
  const snippet =
    preview.length > 60 ? `${preview.slice(0, 60).trimEnd()}…` : preview;
  return `wu.me · ${name} — ${snippet}`;
}

function buildText(msg: ContactMessage, receivedAt: string): string {
  // Collapsed: a newline in the name would otherwise render as a forged header.
  const name = oneLine(msg.name);
  return [
    `New message from wu.me`,
    ``,
    `From:     ${name} <${msg.email}>`,
    `Received: ${formatReceived(receivedAt)}`,
    ``,
    `----------------------------------------`,
    ``,
    msg.message,
    ``,
    `----------------------------------------`,
    ``,
    `Reply to this email to respond directly to ${name}.`,
  ].join("\n");
}

function buildHtml(msg: ContactMessage, receivedAt: string): string {
  const name = escapeHtml(oneLine(msg.name));
  const email = escapeHtml(msg.email);
  const body = escapeHtml(msg.message);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fafafa;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:16px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a1a1aa;">
          New message from wu.me
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px;">
          <div style="font-size:16px;font-weight:600;color:#18181b;">${name}</div>
          <div style="padding-top:2px;font-size:14px;">
            <a href="mailto:${email}" style="color:#52525b;text-decoration:none;">${email}</a>
          </div>
          <div style="padding-top:2px;font-size:13px;color:#a1a1aa;">${formatReceived(receivedAt)}</div>
          <div style="margin:20px 0;height:1px;background:rgba(0,0,0,.08);"></div>
          <div style="font-size:15px;line-height:1.65;color:#3f3f46;white-space:pre-wrap;word-break:break-word;">${body}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;font-size:13px;color:#a1a1aa;">
          Reply to this email to respond directly to ${name}.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(
  msg: ContactMessage,
  apiKey: string,
  to: string,
  receivedAt: string
): Promise<void> {
  // Resend can hang; without a deadline the request thread waits indefinitely.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "contact@wu.me",
        to,
        reply_to: msg.email,
        subject: buildSubject(msg),
        text: buildText(msg, receivedAt),
        html: buildHtml(msg, receivedAt),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend returned ${res.status}: ${detail.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Writes the message to the append-only log first, then tries to email it.
 *
 * Order matters: the disk write is the durability guarantee, so a Resend
 * outage degrades to "delayed notification" rather than "lost message".
 * Throws only if the message could not be stored at all.
 */
export async function deliverContactMessage(
  msg: ContactMessage
): Promise<DeliveryResult> {
  const receivedAt = new Date().toISOString();
  await persist(msg, receivedAt);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.warn(
      "[contact] RESEND_API_KEY/CONTACT_TO_EMAIL unset — message stored at %s but not emailed",
      STORE_FILE
    );
    return { stored: true, emailed: false };
  }

  try {
    await sendEmail(msg, apiKey, to, receivedAt);
    return { stored: true, emailed: true };
  } catch (err) {
    console.error(
      "[contact] email delivery failed for %s; message is saved at %s:",
      msg.email,
      STORE_FILE,
      err
    );
    return { stored: true, emailed: false };
  }
}
