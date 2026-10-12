import { Button } from "@/components/ui/button";
import { setShared } from "@/app/share-actions";

/** Answers are private unless you choose to share them, one answer at a time. */
export function ShareToggle({ entryId, shared, displayName }: { entryId: string; shared: boolean; displayName: string | null }) {
  const name = displayName?.trim() || "A fellow writer";
  return (
    <form action={setShared} className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="shared" value={shared ? "false" : "true"} />
      <p className="text-sm">
        {shared
          ? `Shared as “${name}” with people who answered this prompt.`
          : "Private. Only you can see this answer."}
      </p>
      <Button type="submit" size="sm" variant={shared ? "ghost" : "outline"} className="self-start">
        {shared ? "Make it private" : "Share with others who answered"}
      </Button>
      {!shared && <p className="text-xs text-muted-foreground">Only people who’ve written their own answer can see shared ones.</p>}
    </form>
  );
}
