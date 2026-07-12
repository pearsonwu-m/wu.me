import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { MailIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Contact — Pearson Wu",
  description: "Get in touch.",
};

export default function ContactPage() {
  return (
    <TopicPage
      title="Contact"
      Icon={MailIcon}
    >
      <p>
        The best way to reach me is by email at{" "}
        <a
          href="mailto:pearson@pinsong.me"
          className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50"
        >
          pearson@pinsong.me
        </a>
        .
      </p>
      <p>
        Whether it&rsquo;s about physics, technology, something you read on
        the blog, or just to say hi — I try to reply to everything.
      </p>
      <div className="flex gap-4">
        <a
          href="https://github.com/pearsonwu-m"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/pinsong-wu-b045b9408/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          LinkedIn
        </a>
        <a
          href="https://www.instagram.com/pear.son.wu/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          Instagram
        </a>
      </div>
    </TopicPage>
  );
}
