"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendTestReminder } from "@/app/admin/actions";

export function SendTest() {
  const [message, action, pending] = useActionState(async () => sendTestReminder(), "");
  return (
    <form action={action} className="flex flex-col gap-3">
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send me today’s reminder"}
      </Button>
      {message && <p role="status" className="text-sm leading-relaxed">{message}</p>}
    </form>
  );
}
