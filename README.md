# vibed-lab-plugins

Curated weekly directory of Claude Code plugins. Live at [plugins.vibed-lab.com](https://plugins.vibed-lab.com).

## Stack
- Next.js 15 (App Router) + TypeScript
- Static export → Cloudflare Pages
- GitHub Actions weekly crawl

## Local dev
```bash
npm install
GITHUB_TOKEN=ghp_... npm run crawl
npm run dev
```

## How it works
1. GitHub Actions runs `scripts/crawl.ts` every Monday (UTC 00:00 / KST 09:00)
2. Crawler searches for Claude Code plugin repos and detects `.claude-plugin/plugin.json`
3. Results written to `data/plugins.json`, committed automatically
4. Cloudflare Pages rebuilds on push
5. Weekly featured picks are curated manually in `data/featured.json`
