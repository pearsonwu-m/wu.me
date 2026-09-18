import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { PersonIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "About — Pearson Wu",
  description: "A little about me.",
};

export default function AboutPage() {
  return (
    <TopicPage
      title="About"
      Icon={PersonIcon}
    >
      <p>
        I&rsquo;m Pearson — this is my personal site. I learn, read, write, draw, and think. This is where you can read some of my thoughts and whims. 
      </p>
      <p>
        That means this site is partly a portfolio and partly just a place to
        think out loud — the blog is where the longer-form version of that
        lives.
      </p>
    </TopicPage>
  );
}
