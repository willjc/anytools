import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";
import { tools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...tools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
