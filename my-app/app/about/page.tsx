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
        I&rsquo;m Pearson — this site is where I keep the things I think
        about most: physics, technology, and the societies both get built
        into.
      </p>
      <p>
        Outside of that, you&rsquo;ll usually find me on the water sailing,
        out hiking, or writing something that has nothing to do with a
        deadline. This site is partly a portfolio and partly just a place to
        think out loud — the blog is where the longer-form version of that
        lives.
      </p>
      <p>
        If any of it overlaps with something you&rsquo;re working on, I&rsquo;d
        like to hear about it.
      </p>
    </TopicPage>
  );
}
