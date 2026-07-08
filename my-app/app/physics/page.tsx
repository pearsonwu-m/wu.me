import type { Metadata } from "next";
import TopicPage from "../components/TopicPage";
import { AtomIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Physics — Pearson Wu",
  description: "Why physics.",
};

export default function PhysicsPage() {
  return (
    <TopicPage
      title="Physics"
      Icon={AtomIcon}
    >
      <p>
        Physics is where I go when I want the world to make sense. A small
        set of principles — conservation, symmetry, least action — turns out
        to describe everything from a dropped ball to the structure of
        matter itself. That compression of complexity into a few elegant
        rules is what keeps me coming back.
      </p>
      <p>
        I like problems that reward careful reasoning over memorization:
        working through mechanics and thermodynamics by hand, then sitting
        with the stranger parts of quantum theory where intuition starts to
        break down.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Classical mechanics and thermodynamics</li>
        <li>Quantum foundations and the philosophy of measurement</li>
        <li>Competition-style problem solving</li>
      </ul>
    </TopicPage>
  );
}
