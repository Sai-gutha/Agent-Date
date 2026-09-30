import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentDate — Your agent dates before you do",
  description: "Agents built from public LinkedIn and Instagram content go on simulated dates and rank your strongest connections.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm text-black">♡</span>
            AgentDate
          </Link>
          <span className="text-xs text-zinc-500">Public profile data only · simulated dates</span>
        </header>
        <main className="mx-auto max-w-6xl px-6 pb-24">{children}</main>
      </body>
    </html>
  );
}
