import { getProfile, requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions";
import { saveSettings } from "./actions";
import { TimezoneField } from "./timezone-field";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { saved } = await searchParams;
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-4xl">Settings</h1>
      <form action={saveSettings} className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Who reads your answers?</legend>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 has-[:checked]:border-primary">
              <input type="radio" name="persona" value={key} defaultChecked={profile.persona === key} className="mt-1 accent-[var(--primary)]" />
              <span className="flex flex-col">
                <span className="font-medium">{p.label}</span>
                <span className="text-sm text-muted-foreground">{p.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Evening reminder</legend>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="reminder" defaultChecked={profile.reminder_enabled} className="size-5 accent-[var(--primary)]" />
            <span>Email me today’s prompt each evening, around 7pm Central</span>
          </label>
          <p className="text-sm text-muted-foreground">Skipped on days you’ve already written.</p>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="display_name" className="text-sm font-medium">Name shown when you share an answer</label>
          <input
            id="display_name"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            maxLength={40}
            placeholder="A fellow writer"
            className="h-12 rounded-lg border border-border bg-surface px-4"
          />
          <p className="text-sm text-muted-foreground">Answers stay private unless you share them one at a time.</p>
        </div>

        <TimezoneField current={profile.timezone} />

        <div className="flex items-center gap-4">
          <Button type="submit">Save</Button>
          {saved && <span role="status" className="text-sm text-muted-foreground">Saved.</span>}
        </div>
      </form>
      <form action={signOut} className="border-t border-border pt-6">
        <Button type="submit" variant="ghost" className="px-0 hover:bg-transparent">Sign out</Button>
      </form>
    </div>
  );
}
