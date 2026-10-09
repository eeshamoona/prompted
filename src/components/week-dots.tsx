import { cn } from "@/lib/utils";

type Day = { date: string; written: boolean; isToday: boolean; future: boolean };
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/** The week at a glance: the main objective is writing most days of the week. */
export function WeekDots({ week, variant = "bars" }: { week: Day[]; variant?: "bars" | "tiles" }) {
  return (
    <ol aria-label="This week" className={cn("grid grid-cols-7", variant === "bars" ? "gap-2" : "gap-2 text-center text-xs text-muted-foreground")}>
      {week.map((d, i) => (
        <li key={d.date} className="flex flex-col gap-1.5">
          <span
            aria-label={`${LETTERS[i]}: ${d.written ? "written" : d.isToday ? "today" : d.future ? "upcoming" : "missed"}`}
            className={cn(
              "block",
              variant === "bars" ? "h-1 rounded-full" : "h-10 rounded-lg",
              d.written ? "bg-primary" : d.isToday ? "border border-primary" : "bg-border"
            )}
          />
          {variant === "tiles" && <span aria-hidden="true">{LETTERS[i]}</span>}
        </li>
      ))}
    </ol>
  );
}
