import { getProfile, getUser } from "@/lib/data";
import { DEFAULT_TZ, localDate } from "@/lib/dates";
import { getRotation, pickPrompt } from "@/lib/prompts";
import { Wizard, type WizardVariant } from "./wizard";

/** Which opening to show by default. Compare others with /welcome?v=full or /welcome?v=none. */
const DEFAULT_VARIANT: WizardVariant = "short";

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const { v } = await searchParams;
  const variant: WizardVariant = v === "full" || v === "none" || v === "short" ? v : DEFAULT_VARIANT;

  const user = await getUser();
  const profile = user ? await getProfile(user.id) : null;
  const prompt = pickPrompt(await getRotation(), localDate(profile?.timezone ?? DEFAULT_TZ));
  if (!prompt) return <p className="text-muted-foreground">No prompts yet. Run the seed SQL in Supabase to load them.</p>;

  return <Wizard prompt={{ id: prompt.id, text: prompt.text, category: prompt.category }} variant={variant} signedIn={!!user} />;
}
