import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UniPilot — Your study system", template: "%s | UniPilot" },
  description: "Turn university materials into an organized study system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a href="#main-content" className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="mt-auto border-t border-ink/10 px-5 py-6 text-sm text-muted">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 sm:px-3">
            <span className="font-semibold text-ink">UniPilot</span>
            <span>A little structure. More room to learn.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
