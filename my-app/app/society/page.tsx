import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { GlobeIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Society — Pearson Wu",
  description: "Why society.",
};

export default function SocietyPage() {
  return (
    <TopicPage
      title="Society"
      Icon={GlobeIcon}
    >
      <p>
        Neither physics nor technology happens in a vacuum — both are
        shaped by, and reshape, the societies that build them. I&rsquo;m
        interested in that feedback loop: who gets to decide how a new
        technology is used, who it empowers, and who gets left out.
      </p>
      <p>
        This pulls me toward philosophy and political theory as much as
        science — ethics, logic, and the history of ideas, applied to very
        current questions about information, power, and public discourse.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Ethics and governance of new technologies</li>
        <li>Media, information, and public discourse</li>
        <li>Political philosophy and the history of science</li>
      </ul>
    </TopicPage>
  );
}
