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
        This page is still being put together — check back soon for a
        rundown of what I&rsquo;ve been building.
      </p>
    </TopicPage>
  );
}
