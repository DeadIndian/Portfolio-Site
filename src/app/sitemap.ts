import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://gollabharath.me", changeFrequency: "weekly", priority: 1 },
    {
      url: "https://gollabharath.me/resume",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://gollabharath.me/credits",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
