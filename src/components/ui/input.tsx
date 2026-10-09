import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full rounded-lg border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
