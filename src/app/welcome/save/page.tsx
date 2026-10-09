import { requireUser } from "@/lib/data";
import { SaveDraft } from "./save-draft";

/** After signing up from the wizard: saves the answer that was waiting in this browser. */
export default async function SaveDraftPage() {
  await requireUser();
  return <SaveDraft />;
}
