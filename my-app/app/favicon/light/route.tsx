import { renderFavicon } from "../render";

export async function GET() {
  return renderFavicon(false);
}
