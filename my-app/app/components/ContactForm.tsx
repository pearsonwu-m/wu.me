"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const inputClasses =
  "w-full rounded-xl border border-black/[.08] bg-white px-4 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-black/[.24] focus:outline-none dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-white/[.24]";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus("error");
        setError(json.error ?? "Something went wrong — please email me directly.");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setError("Something went wrong — please email me directly.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
        <p className="text-base text-zinc-900 dark:text-zinc-50">
          Thanks — your message is on its way.
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          I try to reply to everything.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Name
          </span>
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Your name"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClasses}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Message
        </span>
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="What's on your mind?"
          className={`${inputClasses} resize-y`}
        />
      </label>
      {/* Honeypot — hidden from real users, tempting to bots. */}
      <input
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
