import BoidField from "./components/BoidField";
import PlaceholderLinks from "./components/PlaceholderLinks";

export default function Home() {
  return (
    <main className="relative flex flex-1 w-full items-center justify-center overflow-hidden">
      <BoidField />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <h1 className="pointer-events-none font-display text-6xl tracking-wide uppercase sm:text-7xl md:text-8xl">
          Pearson Wu
        </h1>
        <PlaceholderLinks />
      </div>
    </main>
  );
}
