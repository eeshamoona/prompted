import Link from "next/link";

export const metadata = { title: "Not found · Prompted" };

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-5 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">404</p>
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">This page wandered off.</h1>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Nothing here, but there&rsquo;s always a prompt waiting. No wrong answer.
      </p>
      <Link
        href="/"
        className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-base text-primary-foreground hover:opacity-90"
      >
        Back to today&rsquo;s prompt
      </Link>
    </div>
  );
}
