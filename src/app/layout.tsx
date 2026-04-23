import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Code Plugins — vibed-lab",
  description:
    "Curated weekly directory of Claude Code plugins. Discover trending and hand-picked plugins to extend your Claude Code workflow.",
  metadataBase: new URL("https://plugins.vibed-lab.com"),
  openGraph: {
    title: "Claude Code Plugins — vibed-lab",
    description: "Curated weekly directory of Claude Code plugins.",
    url: "https://plugins.vibed-lab.com",
    siteName: "vibed-lab plugins",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            <strong>vibed-lab</strong> / plugins
          </a>
          <nav>
            <a href="https://vibed-lab.com">← vibed-lab.com</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Curated weekly · Data from{" "}
            <a href="https://github.com/leejaeyoung2026-bot/vibed-lab-plugins">
              GitHub
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
