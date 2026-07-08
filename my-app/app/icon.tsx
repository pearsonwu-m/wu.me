import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { WuMark } from "./components/WuMark";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await readFile(
    path.join(process.cwd(), "app/fonts/CangErFeiBaiW01-2.ttf"),
  );

  return new ImageResponse(<WuMark size={32} fontFamily="CangErFeiBai" />, {
    ...size,
    fonts: [
      { name: "CangErFeiBai", data: fontData, style: "normal", weight: 400 },
    ],
  });
}
