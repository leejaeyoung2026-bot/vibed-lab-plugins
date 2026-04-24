import type { MetadataRoute } from "next";
import { getAllPlugins } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = "https://plugins.vibed-lab.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();
  const plugins = getAllPlugins();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: today,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pluginEntries: MetadataRoute.Sitemap = plugins.map((plugin) => {
    const lastCommitDate = new Date(plugin.lastCommit);
    const lastModified = isNaN(lastCommitDate.getTime())
      ? today
      : lastCommitDate;
    return {
      url: `${BASE_URL}/plugin/${plugin.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    };
  });

  return [...staticEntries, ...categoryEntries, ...pluginEntries];
}
