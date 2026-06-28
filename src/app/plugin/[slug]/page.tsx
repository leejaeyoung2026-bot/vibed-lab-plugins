import type { Metadata } from "next";
import { getPluginBySlug, getAllPlugins } from "@/lib/data";
import { categoryLabel } from "@/lib/categories";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllPlugins().map((plugin) => ({ slug: plugin.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plugin = getPluginBySlug(slug);
  if (!plugin) return {};

  const title = `${plugin.name} — Vibed Lab Plugins`;
  const description = plugin.description
    ? plugin.description.slice(0, 155)
    : `Explore the ${plugin.name} Claude Code plugin on Vibed Lab Plugins.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Vibed Lab",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PluginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plugin = getPluginBySlug(slug);
  if (!plugin) notFound();

  // A count of -1 means "1000+" (directory too large for GitHub to list exactly).
  const hasCountData =
    plugin.skillCount !== 0 ||
    plugin.agentCount !== 0 ||
    plugin.commandCount !== 0;

  const formatCount = (n: number) => (n < 0 ? "1000+" : String(n));

  const lastCommitDate = (() => {
    const d = new Date(plugin.lastCommit);
    return isNaN(d.getTime()) ? "unknown" : d.toISOString().slice(0, 10);
  })();

  return (
    <>
      <div className="detail-header">
        <h1>{plugin.owner}/{plugin.repo}</h1>
        <p className="owner">
          {plugin.stars.toLocaleString()} stars · Last commit{" "}
          {lastCommitDate}
        </p>
        {plugin.description && <p>{plugin.description}</p>}
        <div className="card-tags" style={{ marginTop: 12 }}>
          {plugin.hasPluginJson && (
            <span className="tag-plugin">Plugin</span>
          )}
          {plugin.categories.map((cat) => (
            <a key={cat} href={`/category/${cat}`} className="tag">
              {categoryLabel(cat)}
            </a>
          ))}
        </div>
      </div>

      <div className="detail-body">
        <div>
          <h2>README preview</h2>
          {plugin.readmeExcerpt ? (
            <pre className="readme-excerpt">{plugin.readmeExcerpt}</pre>
          ) : (
            <div className="empty-state">No README preview available.</div>
          )}
          <p style={{ marginTop: 16 }}>
            <a href={plugin.url} target="_blank" rel="noopener noreferrer">
              View full repository on GitHub →
            </a>
          </p>
        </div>
        <aside>
          <div className="install-box">
            <h3>Install</h3>
            <pre>{plugin.installSnippet}</pre>
          </div>
          {hasCountData && (
            <div className="counts-box">
              <h3>Includes</h3>
              <ul>
                {plugin.skillCount !== 0 && (
                  <li>
                    <span>{formatCount(plugin.skillCount)}</span> skill{plugin.skillCount !== 1 ? "s" : ""}
                  </li>
                )}
                {plugin.agentCount !== 0 && (
                  <li>
                    <span>{formatCount(plugin.agentCount)}</span> agent{plugin.agentCount !== 1 ? "s" : ""}
                  </li>
                )}
                {plugin.commandCount !== 0 && (
                  <li>
                    <span>{formatCount(plugin.commandCount)}</span> command{plugin.commandCount !== 1 ? "s" : ""}
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
