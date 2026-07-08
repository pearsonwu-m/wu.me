import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { ChipIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Technology — Pearson Wu",
  description: "Why technology.",
};

export default function TechnologyPage() {
  return (
    <TopicPage
      title="Technology"
      Icon={ChipIcon}
    >
      <p>
        I&rsquo;m drawn to technology as applied physics — the point where theory
        turns into something you can build, run, and break. Machine
        learning interests me most: systems that improve from data instead
        of being explicitly programmed step by step.
      </p>
      <p>
        I like understanding a system from the ground up rather than
        treating it as a black box — how the pieces underneath an app or a
        model actually fit together, and where they&rsquo;re fragile.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Machine learning and neural networks</li>
        <li>The infrastructure behind everyday software</li>
        <li>Hands-on projects over theory alone</li>
      </ul>
    </TopicPage>
  );
}
