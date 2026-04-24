import pluginsData from "../../data/plugins.json";
import featuredData from "../../data/featured.json";
import type { Plugin, FeaturedData, FeaturedWeek } from "./types";

export function getAllPlugins(): Plugin[] {
  return pluginsData as Plugin[];
}

export function getPluginBySlug(slug: string): Plugin | undefined {
  return getAllPlugins().find((p) => p.slug === slug);
}

export function getTrending(limit = 10): Plugin[] {
  return [...getAllPlugins()]
    .sort((a, b) => b.starsDelta7d - a.starsDelta7d)
    .slice(0, limit);
}

export function getPluginsByCategory(categorySlug: string): Plugin[] {
  return getAllPlugins()
    .filter((p) => p.categories.includes(categorySlug))
    .sort((a, b) => b.stars - a.stars);
}

export function getLatestFeatured(): FeaturedWeek | null {
  const data = featuredData as FeaturedData;
  const keys = Object.keys(data).sort().reverse();
  if (keys.length === 0) return null;
  return data[keys[0]];
}

export function getFeaturedPlugins(): { plugin: Plugin; comment: string }[] {
  const latest = getLatestFeatured();
  if (!latest) return [];
  const plugins = getAllPlugins();
  const result: { plugin: Plugin; comment: string }[] = [];
  for (const pick of latest.picks) {
    const plugin = plugins.find((p) => p.slug === pick.slug);
    if (plugin) result.push({ plugin, comment: pick.comment });
  }
  return result;
}
