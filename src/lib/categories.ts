import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    slug: "workflow",
    label: "Workflow & Automation",
    keywords: ["workflow", "automation", "pipeline", "orchestration"],
  },
  {
    slug: "tdd",
    label: "TDD & Testing",
    keywords: ["tdd", "test", "testing", "pytest", "vitest", "jest"],
  },
  {
    slug: "debugging",
    label: "Debugging",
    keywords: ["debug", "debugger", "troubleshoot", "bug"],
  },
  {
    slug: "docs",
    label: "Documentation",
    keywords: ["docs", "documentation", "readme", "markdown"],
  },
  {
    slug: "design",
    label: "Design & UI",
    keywords: ["design", "ui", "frontend", "tailwind", "css", "animate", "visual"],
  },
  {
    slug: "devops",
    label: "DevOps & Infra",
    keywords: ["devops", "docker", "kubernetes", "terraform", "ci", "cd", "deploy"],
  },
  {
    slug: "productivity",
    label: "Productivity",
    keywords: ["productivity", "task", "todo", "note", "memory", "scheduler"],
  },
  {
    slug: "ai",
    label: "AI & Prompting",
    keywords: ["prompt", "rag", "llm", "agent", "superpower", "brain"],
  },
  {
    slug: "data",
    label: "Data & ML",
    keywords: ["data", "ml", "analytics", "pandas", "notebook"],
  },
  {
    slug: "security",
    label: "Security",
    keywords: ["security", "vuln", "pentest", "audit"],
  },
];

export function extractCategories(
  description: string,
  topics: string[],
  readme: string
): string[] {
  const haystack = [description, topics.join(" "), readme]
    .join(" ")
    .toLowerCase();
  const matched = new Set<string>();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => haystack.includes(kw))) {
      matched.add(cat.slug);
    }
  }
  return Array.from(matched);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
