import {
  getAllPlugins,
  getFeaturedPlugins,
  getTrending,
} from "@/lib/data";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import PluginCard from "@/components/PluginCard";

export default function Home() {
  const featured = getFeaturedPlugins();
  const trending = getTrending(10);
  const all = getAllPlugins();

  const categoryCounts = CATEGORIES.map((cat) => ({
    slug: cat.slug,
    label: cat.label,
    count: all.filter((p) => p.categories.includes(cat.slug)).length,
  })).filter((c) => c.count > 0);

  return (
    <>
      <section className="hero">
        <h1>Claude Code Plugins</h1>
        <p>Curated weekly. Hand-picked featured plugins and auto-trending repos from GitHub.</p>
      </section>

      {featured.length > 0 ? (
        <section className="section">
          <h2>
            This week&apos;s featured
            <span className="count">{featured.length} picks</span>
          </h2>
          <div className="card-grid">
            {featured.map(({ plugin, comment }) => (
              <PluginCard key={plugin.slug} plugin={plugin} featuredComment={comment} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>
          Trending
          <span className="count">sorted by weekly star growth</span>
        </h2>
        {trending.length === 0 ? (
          <div className="empty-state">
            No plugins crawled yet. The weekly crawler will populate this shortly.
          </div>
        ) : (
          <div className="card-grid">
            {trending.map((plugin) => (
              <PluginCard key={plugin.slug} plugin={plugin} />
            ))}
          </div>
        )}
      </section>

      {categoryCounts.length > 0 && (
        <section className="section">
          <h2>Explore by category</h2>
          <div className="category-tiles">
            {categoryCounts.map((cat) => (
              <a
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="category-tile"
              >
                <span>{cat.label}</span>
                <span className="tile-count">{cat.count}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
