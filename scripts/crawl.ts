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
const MAX_PAGES = 10;

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

/**
 * Search repos with pagination (up to MAX_PAGES × PER_PAGE results).
 * Throws on API error instead of silently returning partial data.
 */
async function searchRepos(query: string): Promise<any[]> {
  const results: any[] = [];
  // Append archived:false to exclude archived repos
  const fullQuery = `${query} archived:false`;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await octokit.search.repos({
      q: fullQuery,
      sort: "stars",
      order: "desc",
      per_page: PER_PAGE,
      page,
    });
    results.push(...res.data.items);
    // GitHub search caps at 1000 results; stop early if fewer items returned
    if (res.data.items.length < PER_PAGE) break;
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

// Files that live alongside skills/agents/commands but are not items themselves.
const NON_ENTRY_RE = /^(readme|license|contributing|changelog|\.gitkeep|\.ds_store)/i;
const NON_ENTRY_EXT_RE = /\.(png|jpe?g|gif|svg|webp|ico)$/i;

/**
 * Count genuine skill/agent/command items in a directory.
 * Each item is either a subdirectory or a content file (e.g. a .md), so we
 * exclude README/LICENSE/.gitkeep/images and other non-item files.
 * GitHub's getContent caps directory listings at 1000 entries; when we hit
 * that ceiling the true count is unknown, so we return -1 to signal "1000+".
 */
async function countDirectoryEntries(
  owner: string,
  repo: string,
  path: string
): Promise<number> {
  try {
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data)) {
      // GitHub truncates directory listings at 1000 entries.
      if (res.data.length >= 1000) return -1;
      return res.data.filter(
        (entry) =>
          entry.type === "dir" ||
          (entry.type === "file" &&
            !NON_ENTRY_RE.test(entry.name) &&
            !NON_ENTRY_EXT_RE.test(entry.name))
      ).length;
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
  // Dedup by numeric repo.id to avoid collisions between owner-repo slug combos
  const seenIds = new Set<string>();
  // Track slug -> repoId to detect and disambiguate URL slug collisions
  // e.g. foo/bar-baz and foo-bar/baz both produce slug "foo-bar-baz"
  const slugToId = new Map<string, string>();
  const plugins: Plugin[] = [];
  const now = new Date().toISOString();

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    // searchRepos throws on failure — this will propagate to main() catch
    // and prevent writing partial data to disk
    const repos = await searchRepos(query);

    for (const repo of repos) {
      const repoId = String(repo.id);
      if (seenIds.has(repoId)) continue;
      seenIds.add(repoId);

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

      const [hasPluginJson, skillCount, agentCount, commandCount] =
        await Promise.all([
          detectPluginJson(owner, repoName),
          countDirectoryEntries(owner, repoName, "skills"),
          countDirectoryEntries(owner, repoName, "agents"),
          countDirectoryEntries(owner, repoName, "commands"),
        ]);

      // Inclusion filter (option b): require plugin.json OR at least one
      // structured content directory. This passes genuine Claude Code plugin
      // repos while pruning awesome-lists and prompt-collections that match
      // search terms but contain no plugin structure at all.
      // A count of -1 means the directory exists but is too large to count
      // exactly (1000+), so it still counts as structured.
      const isStructuredPlugin =
        hasPluginJson ||
        skillCount !== 0 ||
        agentCount !== 0 ||
        commandCount !== 0;
      if (!isStructuredPlugin) continue;

      const baseSlug = `${owner}-${repoName}`.toLowerCase();
      // Disambiguate if a different repo already occupies this slug string
      const existingId = slugToId.get(baseSlug);
      const slug =
        existingId !== undefined && existingId !== repoId
          ? `${baseSlug}-${repoId.slice(-4)}`
          : baseSlug;
      slugToId.set(slug, repoId);

      const prevStars = previous[slug] ?? repo.stargazers_count;
      const starsDelta7d = repo.stargazers_count - prevStars;

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
