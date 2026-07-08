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
        background: "#171717",
        color: "#ededed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      吴
    </div>
  );
}
