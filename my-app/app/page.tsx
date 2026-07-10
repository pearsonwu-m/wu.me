import BoidField from "./components/BoidField";

export default function Home() {
  return (
    <main className="relative flex flex-1 w-full items-center justify-center overflow-hidden">
      <BoidField />
      <h1 className="relative z-10 pointer-events-none font-display text-6xl tracking-wide uppercase sm:text-7xl md:text-8xl">
        Pearson Wu
      </h1>
    </main>
  );
}
