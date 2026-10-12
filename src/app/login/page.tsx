import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, sendMagicLink } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, message, error } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/";

  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl">Welcome to Prompted</h1>
        <p className="text-muted-foreground">One prompt a day. No wrong answer, only yours.</p>
      </div>
      {message && <p role="status" className="rounded-lg bg-muted p-4 text-sm">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-muted p-4 text-sm text-destructive">{error}</p>}
      <form className="flex flex-col gap-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password <span className="font-normal text-muted-foreground">(not needed for a magic link)</span></Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" minLength={6} />
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Button formAction={signIn}>Sign in</Button>
          <Button formAction={sendMagicLink} variant="outline">Email me a magic link</Button>
          <Button formAction={signUp} variant="ghost">Create an account</Button>
        </div>
      </form>
    </div>
  );
}
