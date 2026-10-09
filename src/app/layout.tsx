import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import { getUser } from "@/lib/data";
import { ThemeToggle, type ThemeChoice } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Prompted",
  description: "A daily creative warm-up. One prompt, no right answer, only yours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#161a17" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, cookieStore] = await Promise.all([getUser(), cookies()]);
  const saved = cookieStore.get("prompted_theme")?.value;
  const theme: ThemeChoice = saved === "light" || saved === "dark" ? saved : "system";

  return (
    <html lang="en" className="h-full antialiased" data-theme={theme === "system" ? undefined : theme}>
      <body className="flex min-h-full flex-col">
        <header className={`mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 pt-5 sm:px-6 sm:pt-6 ${user ? "max-w-xl lg:max-w-2xl" : "max-w-5xl"}`}>
          <Link href="/" className="font-serif text-2xl text-foreground">
            Prompted
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            {user ? (
              <nav aria-label="Main" className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-5">
                <Link href="/" className="py-2 hover:text-foreground">Today</Link>
                <Link href="/book" className="py-2 hover:text-foreground">Your book</Link>
                <Link href="/settings" className="py-2 hover:text-foreground">Settings</Link>
              </nav>
            ) : (
              <Link href="/login" className="py-2 text-sm text-primary hover:underline">Sign in</Link>
            )}
            <ThemeToggle initial={theme} />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-6 sm:px-6 sm:pt-8 lg:max-w-2xl">{children}</main>
      </body>
    </html>
  );
}
