import type { MetadataRoute } from "next";
import { getAllPosts } from "../lib/blog";
import { SITE_URL } from "../lib/site";

// Posts are read from the mounted content volume, so build the sitemap per
// request instead of freezing it at build time.
export const dynamic = "force-dynamic";

const PAGES = ["", "/about", "/blog", "/projects", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = PAGES.map((path) => ({ url: `${SITE_URL}${path}` }));
  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : undefined,
  }));
  return [...pages, ...posts];
}
