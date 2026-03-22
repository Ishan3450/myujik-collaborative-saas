import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return ["/", "/terms", "/privacy"].map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
