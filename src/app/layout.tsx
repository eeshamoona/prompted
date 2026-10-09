import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getUser } from "@/lib/data";

export const metadata: Metadata = {
  title: "Prompted",
  description: "A daily creative warm-up. One prompt, no right answer, only yours.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 pt-6">
          <Link href="/" className="font-serif text-2xl text-foreground">
            Prompted
          </Link>
          {user ? (
            <nav aria-label="Main" className="flex items-center gap-5 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Today</Link>
              <Link href="/book" className="hover:text-foreground">Your book</Link>
              <Link href="/settings" className="hover:text-foreground">Settings</Link>
            </nav>
          ) : (
            <Link href="/login" className="text-sm text-primary hover:underline">Sign in</Link>
          )}
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-10 pt-8">{children}</main>
      </body>
    </html>
  );
}
