export function WuMark({
  size = 32,
  fontFamily = "var(--font-chinese)",
}: {
  size?: number;
  fontFamily?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: size * 0.75,
        fontFamily,
      }}
      className="flex items-center justify-center bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
    >
      吴
    </div>
  );
}
