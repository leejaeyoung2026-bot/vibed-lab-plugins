import { Octokit } from "@octokit/rest";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractCategories } from "../src/lib/categories";
import type { Plugin } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_PATH = resolve(ROOT, "data/plugins.json");

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

const SEARCH_QUERIES = [
  "topic:claude-code-plugin",
  "topic:claude-plugin",
  "topic:claude-code-plugins",
  "\"claude-code plugin\" in:name,description",
  "\"claude code plugin\" in:readme",
];

const MIN_STARS = 3;
const MAX_AGE_DAYS = 365;
const PER_PAGE = 100;

type PreviousSnapshot = Record<string, number>;

function loadPreviousStars(): PreviousSnapshot {
  if (!existsSync(DATA_PATH)) return {};
  try {
    const prev = JSON.parse(readFileSync(DATA_PATH, "utf8")) as Plugin[];
    const map: PreviousSnapshot = {};
    for (const p of prev) map[p.slug] = p.stars;
    return map;
  } catch {
    return {};
  }
}

async function searchRepos(query: string) {
  const results: any[] = [];
  try {
    const res = await octokit.search.repos({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: PER_PAGE,
    });
    results.push(...res.data.items);
  } catch (err) {
    console.warn(`Search failed for "${query}":`, (err as Error).message);
  }
  return results;
}

async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const res = await octokit.repos.getReadme({
      owner,
      repo,
      mediaType: { format: "raw" },
    });
    return res.data as unknown as string;
  } catch {
    return "";
  }
}

async function detectPluginJson(owner: string, repo: string): Promise<boolean> {
  try {
    await octokit.repos.getContent({
      owner,
      repo,
      path: ".claude-plugin/plugin.json",
    });
    return true;
  } catch {
    return false;
  }
}

async function countDirectoryEntries(
  owner: string,
  repo: string,
  path: string
): Promise<number> {
  try {
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data)) {
      return res.data.length;
    }
    return 0;
  } catch {
    return 0;
  }
}

function excerpt(readme: string, maxLines = 20): string {
  if (!readme) return "";
  const lines = readme.split("\n").slice(0, maxLines);
  return lines.join("\n").trim();
}

function makeInstallSnippet(owner: string, repo: string): string {
  return `git clone https://github.com/${owner}/${repo}.git ~/.claude/plugins/${repo}`;
}

function daysBetween(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

async function main() {
  const previous = loadPreviousStars();
  const seen = new Set<string>();
  const plugins: Plugin[] = [];
  const now = new Date().toISOString();

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    const repos = await searchRepos(query);

    for (const repo of repos) {
      const slug = `${repo.owner.login}-${repo.name}`.toLowerCase();
      if (seen.has(slug)) continue;
      seen.add(slug);

      if (repo.stargazers_count < MIN_STARS) continue;
      if (repo.fork) continue;
      const lastPush = repo.pushed_at ?? repo.updated_at;
      if (daysBetween(lastPush) > MAX_AGE_DAYS) continue;

      const owner = repo.owner.login;
      const repoName = repo.name;

      const readme = await fetchReadme(owner, repoName);
      const description = repo.description ?? "";
      const topics: string[] = repo.topics ?? [];
      const categories = extractCategories(description, topics, readme);

      const prevStars = previous[slug] ?? repo.stargazers_count;
      const starsDelta7d = repo.stargazers_count - prevStars;

      const [hasPluginJson, skillCount, agentCount, commandCount] =
        await Promise.all([
          detectPluginJson(owner, repoName),
          countDirectoryEntries(owner, repoName, "skills"),
          countDirectoryEntries(owner, repoName, "agents"),
          countDirectoryEntries(owner, repoName, "commands"),
        ]);

      plugins.push({
        slug,
        name: repoName,
        owner,
        repo: repoName,
        url: repo.html_url,
        description,
        stars: repo.stargazers_count,
        starsDelta7d,
        lastCommit: lastPush,
        topics,
        categories,
        hasPluginJson,
        skillCount,
        agentCount,
        commandCount,
        installSnippet: makeInstallSnippet(owner, repoName),
        readmeExcerpt: excerpt(readme),
        crawledAt: now,
      });
    }
  }

  plugins.sort((a, b) => b.stars - a.stars);

  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(plugins, null, 2) + "\n");
  console.log(`Wrote ${plugins.length} plugins to ${DATA_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
