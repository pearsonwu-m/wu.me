import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export async function renderFavicon(dark: boolean) {
  const fontData = await readFile(
    path.join(process.cwd(), "app/fonts/CangErFeiBaiW01-2.ttf"),
  );
  const bg = dark ? "#ededed" : "#171717";
  const fg = dark ? "#171717" : "#ededed";

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: fg,
          fontSize: 24,
          fontFamily: "CangErFeiBai",
        }}
      >
        吴
      </div>
    ),
    {
      width: 32,
      height: 32,
      fonts: [
        { name: "CangErFeiBai", data: fontData, style: "normal", weight: 400 },
      ],
    },
  );
}
