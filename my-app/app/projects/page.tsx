import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { ProjectIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Projects — Pearson Wu",
  description: "Things I've built.",
};

type Project = {
  title: string;
  stack: string[];
  description: string;
  links: { label: string; href: string }[];
};

const WITH_AI: Project[] = [
  {
    title: "RoboLab",
    stack: ["Next.js", "Three.js", "GSAP", "Claude"],
    description:
      "A robotics workbench that brings RoboPrompt and RoboLab FTC under one roof. RoboPrompt turns a photo of a robotic arm into a control plan: it reads the hardware, asks only what the image can't answer, then writes the architecture, build plan, and test plan. I built the landing page's hero, an inverse-kinematics robot arm that follows your cursor to pick a product.",
    links: [
      { label: "Live", href: "https://www.robo-labs.net" },
      { label: "Source", href: "https://github.com/annieeeeyxy/robolab-hub" },
    ],
  },
  {
    title: "Thoughtflow",
    stack: ["Tauri", "Rust", "React", "Claude"],
    description:
      "A thinking companion for macOS. Press ⌥Space from any app, dump a half-formed thought, and Claude asks one useful question at a time before turning it into a plan, a task list, or a prompt for another AI. Every thought stays on your Mac in SQLite, with full-text search.",
    links: [
      {
        label: "Source",
        href: "https://github.com/pearsonwu-m/thoughtflow-desktop",
      },
    ],
  },
  {
    title: "LitPlot",
    stack: ["Python", "spaCy", "Next.js", "Claude"],
    description:
      "Upload a book, or pick one from Project Gutenberg, and LitPlot maps its characters, relationships, and literary allusions, then lets you scrub through it chapter by chapter and ask questions grounded in the text.",
    links: [
      { label: "Source", href: "https://github.com/pearsonwu-m/allusion_pilot" },
    ],
  },
];

const WITHOUT_AI: Project[] = [
  {
    title: "Ray Tracing",
    stack: ["C++", "CMake"],
    description:
      "My way into graphics: working through Ray Tracing in One Weekend from the ground up, starting with vectors, rays, and colour written out to PPM images.",
    links: [
      { label: "Source", href: "https://github.com/pearsonwu-m/ray-tracing" },
    ],
  },
  {
    title: "OCR From Scratch",
    stack: ["Python", "PyTorch"],
    description:
      "Learning computer vision by building an OCR system piece by piece. So far: a CNN that classifies all 62 EMNIST characters, and a small Tkinter app where you draw a letter and watch it guess.",
    links: [],
  },
  {
    title: "Hanzi Rec",
    stack: ["Python", "PyTorch"],
    description:
      "Training a ResNet-50 to read handwritten Chinese — 7,536 character classes from the CASIA-HWDB dataset, trained on my own GPU with mixed precision.",
    links: [],
  },
  {
    title: "News Sentiment Analysis",
    stack: ["Python", "Transformers", "BERTopic"],
    description:
      "A research pipeline for comparing how U.S. outlets cover the same stories: collect articles through Media Cloud, run sentiment, named-entity, and topic models over them, then test the differences between outlets.",
    links: [],
  },
];

function ProjectRow({ project }: { project: Project }) {
  return (
    <article className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {project.stack.join(" · ")}
      </span>
      <h3 className="font-title text-lg text-zinc-900 dark:text-zinc-50">
        {project.title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {project.description}
      </p>
      {project.links.length > 0 && (
        <div className="flex gap-4 pt-1 text-sm">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function ProjectSection({
  title,
  projects,
}: {
  title: string;
  projects: Project[];
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-black/[.08] pb-2 text-sm font-medium uppercase tracking-wide text-zinc-900 dark:border-white/[.08] dark:text-zinc-50">
        {title}
      </h2>
      <div className="flex flex-col gap-8">
        {projects.map((project) => (
          <ProjectRow key={project.title} project={project} />
        ))}
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <TopicPage title="Projects" Icon={ProjectIcon}>
      <div className="flex flex-col gap-12">
        <ProjectSection title="With AI" projects={WITH_AI} />
        <ProjectSection title="Without AI" projects={WITHOUT_AI} />
      </div>
    </TopicPage>
  );
}
