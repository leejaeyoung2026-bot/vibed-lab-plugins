import { getPluginsByCategory } from "@/lib/data";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import PluginCard from "@/components/PluginCard";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const plugins = getPluginsByCategory(slug);

  return (
    <>
      <section className="hero">
        <h1>{categoryLabel(slug)}</h1>
        <p>{plugins.length} plugin{plugins.length !== 1 ? "s" : ""} in this category.</p>
      </section>
      {plugins.length === 0 ? (
        <div className="empty-state">No plugins yet in this category.</div>
      ) : (
        <div className="card-grid">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.slug} plugin={plugin} />
          ))}
        </div>
      )}
    </>
  );
}
