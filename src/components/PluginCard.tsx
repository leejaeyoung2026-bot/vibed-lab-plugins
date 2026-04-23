import type { Plugin } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";

type Props = {
  plugin: Plugin;
  featuredComment?: string;
};

export default function PluginCard({ plugin, featuredComment }: Props) {
  return (
    <article className="card">
      <h3 className="card-title">
        <a href={`/plugin/${plugin.slug}`}>{plugin.owner}/{plugin.repo}</a>
      </h3>
      {featuredComment && (
        <p className="featured-comment">{featuredComment}</p>
      )}
      <p className="card-desc">{plugin.description || "No description provided."}</p>
      <div className="card-meta">
        <span className="stars">{plugin.stars.toLocaleString()}</span>
        {plugin.starsDelta7d > 0 && (
          <span className="delta">+{plugin.starsDelta7d} this week</span>
        )}
      </div>
      <div className="card-tags">
        {plugin.hasPluginJson && (
          <span className="tag-plugin">Plugin</span>
        )}
        {plugin.categories.slice(0, 3).map((cat) => (
          <span key={cat} className="tag">
            {categoryLabel(cat)}
          </span>
        ))}
      </div>
    </article>
  );
}
