import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { ProjectIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Projects — Pearson Wu",
  description: "Things I've built.",
};

export default function ProjectsPage() {
  return (
    <TopicPage title="Projects" Icon={ProjectIcon}>
      <p>
        Work in progress — I&rsquo;m still putting this page together. Come
        back soon for a rundown of what I&rsquo;ve been building.
      </p>
    </TopicPage>
  );
}
