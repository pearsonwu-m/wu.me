import Link from "next/link";
import { WuMark } from "./WuMark";
import ThemeToggle from "./ThemeToggle";

export default function SiteNav() {
  return (
    <header className="border-b border-black/[.08] dark:border-white/[.08]">
      <nav className="font-nav mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" aria-label="Home">
          <WuMark size={28} />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            Contact
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            Blog
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
